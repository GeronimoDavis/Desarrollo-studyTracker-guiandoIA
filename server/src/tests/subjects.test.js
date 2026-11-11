import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { pool } from '../config/db.js';
import { addDays, getPeriodRanges, todayInZone } from '../utils/dates.js';

const app = createApp();
const createdEmails = new Set();

function cookieHeader(response, name) {
  const cookies = response.headers['set-cookie'] ?? [];
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));
  return cookie?.split(';')[0] ?? null;
}

async function registerUser(overrides = {}) {
  const email = overrides.email ?? `subject-test-${randomUUID()}@example.com`;
  createdEmails.add(email);

  const response = await request(app).post('/api/auth/register').send({
    name: 'Usuario de Materias',
    email,
    password: 'Password1!',
    timezone: 'America/Argentina/Buenos_Aires',
    ...overrides
  });

  return {
    response,
    email,
    userId: response.body.data.user.id,
    accessCookie: cookieHeader(response, 'st_access')
  };
}

async function createSubject(accessCookie, overrides = {}) {
  return request(app)
    .post('/api/subjects')
    .set('Cookie', accessCookie)
    .send({
      name: 'Matemática',
      color: '#6366F1',
      description: 'Álgebra y análisis',
      ...overrides
    });
}

async function insertSession(userId, subjectId, sessionDate, effectiveSeconds) {
  const startedAt = new Date(`${sessionDate}T12:00:00.000Z`);
  const endedAt = new Date(startedAt.getTime() + effectiveSeconds * 1000);

  await pool.execute(
    `INSERT INTO study_sessions
       (user_id, subject_id, client_id, mode, status, effective_seconds,
        started_at, ended_at, session_date)
     VALUES (?, ?, ?, 'free', 'completed', ?, ?, ?, ?)`,
    [
      userId,
      subjectId,
      randomUUID(),
      effectiveSeconds,
      startedAt,
      endedAt,
      sessionDate
    ]
  );
}

afterAll(async () => {
  for (const email of createdEmails) {
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
  }

  await pool.end();
});

describe('subjects', () => {
  it('crea, lista, edita y consulta una materia propia', async () => {
    const { accessCookie } = await registerUser();

    const emptyList = await request(app)
      .get('/api/subjects')
      .set('Cookie', accessCookie);
    expect(emptyList.status).toBe(200);
    expect(emptyList.body.data.subjects).toEqual([]);

    const created = await createSubject(accessCookie, {
      color: '#10b981',
      description: '  Cálculo y álgebra  '
    });
    expect(created.status).toBe(201);
    expect(created.body.data.subject).toMatchObject({
      name: 'Matemática',
      color: '#10B981',
      description: 'Cálculo y álgebra',
      isArchived: false
    });

    const subjectId = created.body.data.subject.id;

    const list = await request(app)
      .get('/api/subjects')
      .set('Cookie', accessCookie);
    expect(list.status).toBe(200);
    expect(list.body.data.subjects).toHaveLength(1);
    expect(list.body.data.subjects[0].id).toBe(subjectId);

    const updated = await request(app)
      .put(`/api/subjects/${subjectId}`)
      .set('Cookie', accessCookie)
      .send({
        name: 'Matemática Aplicada',
        color: '#ef4444',
        description: ''
      });
    expect(updated.status).toBe(200);
    expect(updated.body.data.subject).toMatchObject({
      name: 'Matemática Aplicada',
      color: '#EF4444',
      description: null
    });

    const detail = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Cookie', accessCookie);
    expect(detail.status).toBe(200);
    expect(detail.body.data.subject.name).toBe('Matemática Aplicada');
  });

  it('rechaza nombres duplicados sin distinguir mayúsculas', async () => {
    const { accessCookie } = await registerUser();

    const first = await createSubject(accessCookie, { name: 'Historia' });
    expect(first.status).toBe(201);

    const duplicate = await createSubject(accessCookie, {
      name: 'historia'
    });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_NAME');
  });

  it('valida nombre, color y descripción con errores por campo', async () => {
    const { accessCookie } = await registerUser();

    const response = await createSubject(accessCookie, {
      name: 'A',
      color: 'azul',
      description: 'x'.repeat(501)
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toMatchObject({
      name: expect.any(String),
      color: expect.any(String),
      description: expect.any(String)
    });
  });

  it('aísla las materias entre usuarios', async () => {
    const first = await registerUser();
    const second = await registerUser();

    const created = await createSubject(first.accessCookie, {
      name: 'Física'
    });
    const subjectId = created.body.data.subject.id;

    const secondList = await request(app)
      .get('/api/subjects')
      .set('Cookie', second.accessCookie);
    expect(secondList.body.data.subjects).toEqual([]);

    const secondDetail = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Cookie', second.accessCookie);
    expect(secondDetail.status).toBe(404);

    const secondUpdate = await request(app)
      .put(`/api/subjects/${subjectId}`)
      .set('Cookie', second.accessCookie)
      .send({ name: 'Física robada' });
    expect(secondUpdate.status).toBe(404);

    const secondDelete = await request(app)
      .delete(`/api/subjects/${subjectId}`)
      .set('Cookie', second.accessCookie);
    expect(secondDelete.status).toBe(404);

    const firstDetail = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Cookie', first.accessCookie);
    expect(firstDetail.status).toBe(200);
    expect(firstDetail.body.data.subject.name).toBe('Física');
  });

  it('borra físicamente una materia sin sesiones', async () => {
    const { accessCookie } = await registerUser();
    const created = await createSubject(accessCookie, { name: 'Química' });
    const subjectId = created.body.data.subject.id;

    const deleted = await request(app)
      .delete(`/api/subjects/${subjectId}`)
      .set('Cookie', accessCookie);
    expect(deleted.status).toBe(204);

    const detail = await request(app)
      .get(`/api/subjects/${subjectId}`)
      .set('Cookie', accessCookie);
    expect(detail.status).toBe(404);
  });

  it('archiva una materia con sesiones y permite restaurarla', async () => {
    const { accessCookie, userId } = await registerUser();
    const created = await createSubject(accessCookie, { name: 'Biología' });
    const subjectId = created.body.data.subject.id;
    const today = todayInZone('America/Argentina/Buenos_Aires');

    await insertSession(userId, subjectId, today, 120);

    const deleted = await request(app)
      .delete(`/api/subjects/${subjectId}`)
      .set('Cookie', accessCookie);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted).toBe(false);
    expect(deleted.body.data.subject.isArchived).toBe(true);

    const activeList = await request(app)
      .get('/api/subjects')
      .set('Cookie', accessCookie);
    expect(activeList.body.data.subjects).toEqual([]);

    const allList = await request(app)
      .get('/api/subjects?includeArchived=1')
      .set('Cookie', accessCookie);
    expect(allList.body.data.subjects).toHaveLength(1);
    expect(allList.body.data.subjects[0].isArchived).toBe(true);

    const restored = await request(app)
      .post(`/api/subjects/${subjectId}/restore`)
      .set('Cookie', accessCookie);
    expect(restored.status).toBe(200);
    expect(restored.body.data.subject.isArchived).toBe(false);

    const restoredList = await request(app)
      .get('/api/subjects')
      .set('Cookie', accessCookie);
    expect(restoredList.body.data.subjects).toHaveLength(1);
  });

  it('calcula el resumen de la materia y coincide con SQL manual', async () => {
    const { accessCookie, userId } = await registerUser();
    const created = await createSubject(accessCookie, { name: 'Programación' });
    const subjectId = created.body.data.subject.id;
    const today = todayInZone('America/Argentina/Buenos_Aires');

    await insertSession(userId, subjectId, today, 120);
    await insertSession(userId, subjectId, addDays(today, -3), 180);
    await insertSession(userId, subjectId, addDays(today, -40), 60);

    const ranges = getPeriodRanges(today);

    const [weekRows] = await pool.execute(
      `SELECT COALESCE(SUM(effective_seconds), 0) AS seconds,
              COUNT(*) AS sessions
         FROM study_sessions
        WHERE user_id = ? AND subject_id = ?
          AND session_date BETWEEN ? AND ?`,
      [userId, subjectId, ranges.week.start, ranges.week.end]
    );
    const [monthRows] = await pool.execute(
      `SELECT COALESCE(SUM(effective_seconds), 0) AS seconds,
              COUNT(*) AS sessions
         FROM study_sessions
        WHERE user_id = ? AND subject_id = ?
          AND session_date BETWEEN ? AND ?`,
      [userId, subjectId, ranges.month.start, ranges.month.end]
    );
    const [yearRows] = await pool.execute(
      `SELECT COALESCE(SUM(effective_seconds), 0) AS seconds,
              COUNT(*) AS sessions
         FROM study_sessions
        WHERE user_id = ? AND subject_id = ?
          AND session_date BETWEEN ? AND ?`,
      [userId, subjectId, ranges.year.start, ranges.year.end]
    );

    const response = await request(app)
      .get(`/api/subjects/${subjectId}/stats`)
      .set('Cookie', accessCookie);

    expect(response.status).toBe(200);
    const { stats } = response.body.data;

    expect(stats.week.effectiveSeconds).toBe(
      Number(weekRows[0].seconds)
    );
    expect(stats.week.sessions).toBe(Number(weekRows[0].sessions));
    expect(stats.month.effectiveSeconds).toBe(
      Number(monthRows[0].seconds)
    );
    expect(stats.month.sessions).toBe(Number(monthRows[0].sessions));
    expect(stats.year.effectiveSeconds).toBe(
      Number(yearRows[0].seconds)
    );
    expect(stats.year.sessions).toBe(Number(yearRows[0].sessions));
    expect(stats.totalSessions).toBe(3);
    expect(stats.lastStudyDate).toBe(today);
    expect(stats.recentSessions).toHaveLength(3);
    expect(stats.recentSessions[0].sessionDate).toBe(today);
    expect(stats.recentSessions[0].effectiveSeconds).toBe(120);
  });

  it('devuelve 404 al pedir el resumen de una materia ajena', async () => {
    const first = await registerUser();
    const second = await registerUser();
    const created = await createSubject(first.accessCookie, {
      name: 'Inglés'
    });
    const subjectId = created.body.data.subject.id;

    const response = await request(app)
      .get(`/api/subjects/${subjectId}/stats`)
      .set('Cookie', second.accessCookie);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
