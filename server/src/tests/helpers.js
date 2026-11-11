import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { pool } from '../config/db.js';

export function cookieHeader(response, name) {
  const cookies = response.headers['set-cookie'] ?? [];
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));

  return cookie?.split(';')[0] ?? null;
}

export async function registerUser(app, overrides = {}) {
  const email =
    overrides.email ?? `integration-test-${randomUUID()}@example.com`;

  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: 'Usuario de Prueba',
      email,
      password: 'Password1!',
      timezone: 'UTC',
      ...overrides
    });

  return {
    response,
    email,
    userId: response.body?.data?.user?.id,
    accessCookie: cookieHeader(response, 'st_access')
  };
}

export async function createSubjectFor(app, accessCookie, overrides = {}) {
  return request(app)
    .post('/api/subjects')
    .set('Cookie', accessCookie)
    .send({
      name: `Materia ${randomUUID().slice(0, 8)}`,
      color: '#6366F1',
      description: null,
      ...overrides
    });
}

export async function insertSession(userId, subjectId, overrides = {}) {
  const {
    clientId = randomUUID(),
    sessionDate = '2026-11-11',
    effectiveSeconds = 120,
    mode = 'free',
    status = 'completed',
    targetMinutes = null,
    breakMinutes = null,
    breakCount = null,
    startedAt = new Date(`${sessionDate}T12:00:00.000Z`),
    endedAt
  } = overrides;

  const start =
    startedAt instanceof Date ? startedAt : new Date(startedAt);
  const breakSeconds =
    mode === 'fixed'
      ? (breakMinutes ?? 0) * (breakCount ?? 0) * 60
      : 0;
  const end = endedAt
    ? endedAt instanceof Date
      ? endedAt
      : new Date(endedAt)
    : new Date(start.getTime() + (effectiveSeconds + breakSeconds) * 1000);

  await pool.execute(
    `INSERT INTO study_sessions
       (user_id, subject_id, client_id, mode, status, target_minutes,
        break_minutes, break_count, effective_seconds, started_at, ended_at,
        session_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      subjectId,
      clientId,
      mode,
      status,
      targetMinutes,
      breakMinutes,
      breakCount,
      effectiveSeconds,
      start,
      end,
      sessionDate
    ]
  );

  return { clientId, startedAt: start, endedAt: end };
}

export async function deleteUsersByEmail(emails) {
  for (const email of emails) {
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
  }
}

export { pool };
