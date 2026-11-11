import { randomUUID } from 'node:crypto';

import { closeDatabase } from '../src/config/db.js';
import { findByEmail } from '../src/repositories/users.repository.js';
import { addDays, getLocalDateString, todayInZone } from '../src/utils/dates.js';
import { withTransaction } from '../src/utils/transaction.js';

const SUBJECTS = [
  {
    name: 'Matemática',
    color: '#6366F1',
    description: 'Álgebra, análisis y estadística'
  },
  {
    name: 'Historia',
    color: '#F59E0B',
    description: 'Historia argentina y universal'
  },
  {
    name: 'Física',
    color: '#10B981',
    description: 'Mecánica y termodinámica'
  },
  {
    name: 'Programación',
    color: '#EC4899',
    description: 'Algoritmos y desarrollo web'
  }
];

function getArgument(name) {
  const inlinePrefix = `--${name}=`;
  const inline = process.argv.find((argument) =>
    argument.startsWith(inlinePrefix)
  );

  if (inline) {
    return inline.slice(inlinePrefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);

  if (index !== -1) {
    return process.argv[index + 1];
  }

  return undefined;
}

async function insertSubject(connection, userId, subject) {
  const [result] = await connection.execute(
    `INSERT INTO subjects (user_id, name, color, description)
     VALUES (?, ?, ?, ?)`,
    [userId, subject.name, subject.color, subject.description ?? null]
  );

  return result.insertId;
}

async function insertSession(
  connection,
  userId,
  {
    subjectId,
    mode,
    status,
    targetMinutes = null,
    breakMinutes = null,
    breakCount = null,
    effectiveSeconds,
    startedAt,
    endedAt,
    timezone
  }
) {
  await connection.execute(
    `INSERT INTO study_sessions
       (user_id, subject_id, client_id, mode, status, target_minutes,
        break_minutes, break_count, effective_seconds, started_at, ended_at,
        session_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      subjectId,
      randomUUID(),
      mode,
      status,
      targetMinutes,
      breakMinutes,
      breakCount,
      effectiveSeconds,
      startedAt,
      endedAt,
      getLocalDateString(startedAt, timezone)
    ]
  );
}

async function seed(user, days) {
  const today = todayInZone(user.timezone);

  return withTransaction(async (connection) => {
    await connection.execute(
      'DELETE FROM study_sessions WHERE user_id = ?',
      [user.id]
    );
    await connection.execute('DELETE FROM subjects WHERE user_id = ?', [
      user.id
    ]);

    const subjectIds = [];

    for (const subject of SUBJECTS) {
      subjectIds.push(await insertSubject(connection, user.id, subject));
    }

    let sessionCount = 0;

    for (let offset = days; offset >= 1; offset -= 1) {
      if (offset % 6 === 0) {
        continue;
      }

      const dateKey = addDays(today, -offset);
      const primaryStart = new Date(`${dateKey}T12:00:00.000Z`);
      const primaryMinutes = 20 + ((offset * 13) % 70);
      const primarySeconds = primaryMinutes * 60;

      await insertSession(connection, user.id, {
        subjectId: subjectIds[offset % subjectIds.length],
        mode: 'free',
        status: 'completed',
        effectiveSeconds: primarySeconds,
        startedAt: primaryStart,
        endedAt: new Date(primaryStart.getTime() + primarySeconds * 1000),
        timezone: user.timezone
      });
      sessionCount += 1;

      if (offset % 3 === 0) {
        const secondaryStart = new Date(`${dateKey}T16:00:00.000Z`);
        const secondarySeconds = (15 + ((offset * 7) % 30)) * 60;

        await insertSession(connection, user.id, {
          subjectId: subjectIds[(offset + 1) % subjectIds.length],
          mode: 'free',
          status: 'completed',
          effectiveSeconds: secondarySeconds,
          startedAt: secondaryStart,
          endedAt: new Date(
            secondaryStart.getTime() + secondarySeconds * 1000
          ),
          timezone: user.timezone
        });
        sessionCount += 1;
      }

      if (offset % 5 === 0) {
        const fixedStart = new Date(`${dateKey}T20:00:00.000Z`);

        await insertSession(connection, user.id, {
          subjectId: subjectIds[(offset + 2) % subjectIds.length],
          mode: 'fixed',
          status: 'completed',
          targetMinutes: 30,
          breakMinutes: 10,
          breakCount: 1,
          effectiveSeconds: 30 * 60,
          startedAt: fixedStart,
          endedAt: new Date(fixedStart.getTime() + 40 * 60 * 1000),
          timezone: user.timezone
        });
        sessionCount += 1;
      }

      if (offset % 11 === 0) {
        const abandonedStart = new Date(`${dateKey}T21:00:00.000Z`);

        await insertSession(connection, user.id, {
          subjectId: subjectIds[(offset + 3) % subjectIds.length],
          mode: 'fixed',
          status: 'abandoned',
          targetMinutes: 60,
          breakMinutes: 10,
          breakCount: 2,
          effectiveSeconds: 15 * 60,
          startedAt: abandonedStart,
          endedAt: new Date(abandonedStart.getTime() + 20 * 60 * 1000),
          timezone: user.timezone
        });
        sessionCount += 1;
      }
    }

    return {
      today,
      from: addDays(today, -days),
      to: addDays(today, -1),
      subjects: subjectIds.length,
      sessions: sessionCount
    };
  });
}

async function main() {
  const email = getArgument('email') ?? process.env.SEED_USER_EMAIL;
  const daysArgument = getArgument('days') ?? '30';
  const days = Number(daysArgument);

  if (!email) {
    throw new Error(
      'Indicá el email con --email=... o con la variable SEED_USER_EMAIL.'
    );
  }

  if (!Number.isInteger(days) || days < 1 || days > 365) {
    throw new Error('La cantidad de días debe ser un entero entre 1 y 365.');
  }

  const user = await findByEmail(email);

  if (!user) {
    throw new Error(`No existe un usuario con el email ${email}.`);
  }

  const summary = await seed(user, days);

  console.log('[seed] Datos de desarrollo generados.');
  console.log(`[seed] Usuario: ${user.email}`);
  console.log(
    `[seed] Materias: ${summary.subjects} · Sesiones: ${summary.sessions}`
  );
  console.log(
    `[seed] Rango de días: ${summary.from} a ${summary.to} (hoy: ${summary.today})`
  );
}

main()
  .catch((error) => {
    console.error(`[seed] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
