import * as subjectsRepository from '../repositories/subjects.repository.js';
import { findById as findUserById } from '../repositories/users.repository.js';
import { getPeriodRanges, todayInZone } from '../utils/dates.js';
import { HttpError } from '../utils/httpError.js';
import { assertOwnedRow } from '../utils/ownership.js';
import { toPublicSubject } from '../utils/publicSubject.js';

const SUBJECT_NOT_FOUND = 'La materia no existe.';

function duplicateNameError() {
  return new HttpError(
    409,
    'DUPLICATE_NAME',
    'Ya tenés una materia con ese nombre.'
  );
}

function translateDuplicateName(error) {
  if (error.code === 'ER_DUP_ENTRY') {
    throw duplicateNameError();
  }

  throw error;
}

function toIsoString(value) {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toPublicRecentSession(row) {
  return {
    id: Number(row.id),
    mode: row.mode,
    status: row.status,
    effectiveSeconds: Number(row.effective_seconds),
    startedAt: toIsoString(row.started_at),
    endedAt: toIsoString(row.ended_at),
    sessionDate: row.session_date
  };
}

async function getOwnedSubjectRow(userId, subjectId) {
  const subject = await subjectsRepository.findById(userId, subjectId);
  assertOwnedRow(subject, SUBJECT_NOT_FOUND);
  return subject;
}

export async function listSubjects(userId, { includeArchived = false } = {}) {
  const rows = await subjectsRepository.listSubjects(userId, {
    includeArchived
  });

  return rows.map(toPublicSubject);
}

export async function getSubject(userId, subjectId) {
  const subject = await getOwnedSubjectRow(userId, subjectId);
  return toPublicSubject(subject);
}

export async function createSubject(userId, input) {
  try {
    const subject = await subjectsRepository.createSubject(userId, input);
    return toPublicSubject(subject);
  } catch (error) {
    return translateDuplicateName(error);
  }
}

export async function updateSubject(userId, subjectId, input) {
  await getOwnedSubjectRow(userId, subjectId);

  try {
    const subject = await subjectsRepository.updateSubject(
      userId,
      subjectId,
      input
    );

    return toPublicSubject(subject);
  } catch (error) {
    return translateDuplicateName(error);
  }
}

export async function deleteSubject(userId, subjectId) {
  await getOwnedSubjectRow(userId, subjectId);

  const sessionCount = await subjectsRepository.countSessions(
    userId,
    subjectId
  );

  if (sessionCount > 0) {
    const archived = await subjectsRepository.setArchived(
      userId,
      subjectId,
      true
    );

    return {
      deleted: false,
      subject: toPublicSubject(archived)
    };
  }

  try {
    const affectedRows = await subjectsRepository.deleteSubject(
      userId,
      subjectId
    );

    if (affectedRows === 0) {
      throw new HttpError(404, 'NOT_FOUND', SUBJECT_NOT_FOUND);
    }

    return {
      deleted: true,
      subject: null
    };
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      const archived = await subjectsRepository.setArchived(
        userId,
        subjectId,
        true
      );

      return {
        deleted: false,
        subject: toPublicSubject(archived)
      };
    }

    throw error;
  }
}

export async function restoreSubject(userId, subjectId) {
  const subject = await getOwnedSubjectRow(userId, subjectId);

  if (!subject.is_archived) {
    return toPublicSubject(subject);
  }

  const restored = await subjectsRepository.setArchived(
    userId,
    subjectId,
    false
  );

  return toPublicSubject(restored);
}

export async function getSubjectStats(userId, subjectId) {
  const subject = await getOwnedSubjectRow(userId, subjectId);
  const user = await findUserById(userId);

  if (!user) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
  }

  const today = todayInZone(user.timezone);
  const ranges = getPeriodRanges(today);

  const [week, month, year, activity, recentSessions] = await Promise.all([
    subjectsRepository.getTotals(
      userId,
      subjectId,
      ranges.week.start,
      ranges.week.end
    ),
    subjectsRepository.getTotals(
      userId,
      subjectId,
      ranges.month.start,
      ranges.month.end
    ),
    subjectsRepository.getTotals(
      userId,
      subjectId,
      ranges.year.start,
      ranges.year.end
    ),
    subjectsRepository.getActivitySummary(userId, subjectId),
    subjectsRepository.listRecentSessions(userId, subjectId, 5)
  ]);

  return {
    subject: toPublicSubject(subject),
    stats: {
      today,
      week: {
        ...ranges.week,
        ...week
      },
      month: {
        ...ranges.month,
        ...month
      },
      year: {
        ...ranges.year,
        ...year
      },
      lastStudyDate: activity.lastStudyDate,
      totalSessions: activity.totalSessions,
      recentSessions: recentSessions.map(toPublicRecentSession)
    }
  };
}
