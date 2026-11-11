import * as sessionsRepository from '../repositories/sessions.repository.js';
import * as subjectsRepository from '../repositories/subjects.repository.js';
import { findById as findUserById } from '../repositories/users.repository.js';
import { getLocalDateString } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { assertOwnedRow } from '../utils/ownership.js';
import { toPublicSession } from '../utils/publicSession.js';
import { isValidFixedPlan } from '../utils/sessionPlan.js';
import { withTransaction } from '../utils/transaction.js';

const SUBJECT_NOT_FOUND = 'La materia no existe.';

function invalidSession(message) {
  return new HttpError(422, 'INVALID_SESSION', message);
}

function overlapError() {
  return new HttpError(
    409,
    'SESSION_OVERLAP',
    'La sesión se superpone con otra sesión guardada.'
  );
}

function getAuthenticatedUser(userId) {
  return findUserById(userId).then((user) => {
    if (!user) {
      throw new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
    }

    return user;
  });
}

function validateSession(input) {
  const startedAt = new Date(input.startedAt);
  const endedAt = new Date(input.endedAt);

  if (
    Number.isNaN(startedAt.getTime()) ||
    Number.isNaN(endedAt.getTime()) ||
    endedAt <= startedAt
  ) {
    throw invalidSession('La fecha de fin debe ser posterior a la de inicio.');
  }

  const targetMinutes = input.targetMinutes ?? null;
  const breakMinutes = input.breakMinutes ?? null;
  const breakCount = input.breakCount ?? null;
  const effectiveSeconds = Number(input.effectiveSeconds);

  if (input.mode === 'free') {
    if (input.status !== 'completed') {
      throw invalidSession('Las sesiones libres deben guardarse como completadas.');
    }

    if (
      targetMinutes !== null ||
      breakMinutes !== null ||
      breakCount !== null
    ) {
      throw invalidSession('Las sesiones libres no llevan plan de descansos.');
    }
  } else {
    if (
      targetMinutes === null ||
      breakMinutes === null ||
      breakCount === null
    ) {
      throw invalidSession(
        'Las sesiones fijas requieren objetivo, descanso y cantidad de bloques.'
      );
    }

    if (!isValidFixedPlan(targetMinutes, breakMinutes, breakCount)) {
      throw invalidSession('El plan de descansos no coincide con el objetivo.');
    }

    if (input.status === 'completed') {
      if (Math.abs(effectiveSeconds - targetMinutes * 60) > 5) {
        throw invalidSession(
          'El tiempo efectivo no coincide con el objetivo de la sesión.'
        );
      }
    } else if (input.status === 'abandoned') {
      if (effectiveSeconds >= targetMinutes * 60) {
        throw invalidSession(
          'Una sesión abandonada debe tener menos tiempo que el objetivo.'
        );
      }
    } else {
      throw invalidSession('El estado de la sesión no es válido.');
    }
  }

  if (!Number.isInteger(effectiveSeconds) || effectiveSeconds < 60) {
    throw invalidSession('La sesión debe tener al menos 60 segundos efectivos.');
  }

  const clockSeconds = Math.floor(
    (endedAt.getTime() - startedAt.getTime()) / 1000
  );

  if (effectiveSeconds > clockSeconds + 5) {
    throw invalidSession(
      'El tiempo efectivo no puede superar el tiempo de reloj.'
    );
  }

  return {
    startedAt,
    endedAt,
    targetMinutes,
    breakMinutes,
    breakCount,
    effectiveSeconds
  };
}

export async function createSession(userId, input) {
  const existing = await sessionsRepository.findByClientId(
    userId,
    input.clientId
  );

  if (existing) {
    return {
      session: toPublicSession(existing),
      created: false
    };
  }

  const [user, subject] = await Promise.all([
    getAuthenticatedUser(userId),
    subjectsRepository.findById(userId, input.subjectId)
  ]);

  assertOwnedRow(subject, SUBJECT_NOT_FOUND);

  if (subject.is_archived) {
    throw new HttpError(
      422,
      'SUBJECT_ARCHIVED',
      'No podés guardar sesiones en una materia archivada.'
    );
  }

  const normalized = validateSession(input);
  const sessionDate = getLocalDateString(normalized.startedAt, user.timezone);

  try {
    const result = await withTransaction(async (connection) => {
      const raced = await sessionsRepository.findByClientId(
        userId,
        input.clientId,
        connection
      );

      if (raced) {
        return { row: raced, created: false };
      }

      const overlaps = await sessionsRepository.hasOverlap(
        userId,
        normalized.startedAt,
        normalized.endedAt,
        null,
        connection
      );

      if (overlaps) {
        throw overlapError();
      }

      const row = await sessionsRepository.insertSession(
        userId,
        {
          subjectId: input.subjectId,
          clientId: input.clientId,
          mode: input.mode,
          status: input.status,
          targetMinutes: normalized.targetMinutes,
          breakMinutes: normalized.breakMinutes,
          breakCount: normalized.breakCount,
          effectiveSeconds: normalized.effectiveSeconds,
          startedAt: normalized.startedAt,
          endedAt: normalized.endedAt,
          sessionDate
        },
        connection
      );

      return { row, created: true };
    });

    return {
      session: toPublicSession(result.row),
      created: result.created
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const raced = await sessionsRepository.findByClientId(
        userId,
        input.clientId
      );

      if (raced) {
        return {
          session: toPublicSession(raced),
          created: false
        };
      }
    }

    if (error.code === 'ER_CHECK_CONSTRAINT_VIOLATED') {
      throw invalidSession('Los datos de la sesión no son válidos.');
    }

    throw error;
  }
}

export async function listSessions(userId, filters) {
  const [rows, total] = await Promise.all([
    sessionsRepository.listSessions(userId, filters),
    sessionsRepository.countSessions(userId, filters)
  ]);

  return {
    sessions: rows.map((row) => toPublicSession(row)),
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      total
    }
  };
}
