import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import {
  createSubjectFor,
  deleteUsersByEmail,
  insertSession,
  pool,
  registerUser
} from './helpers.js';

const app = createApp();
const createdEmails = new Set();

async function setup({ user = {}, subject = {} } = {}) {
  const registered = await registerUser(app, user);
  expect(registered.response.status).toBe(201);
  createdEmails.add(registered.email);

  const subjectResponse = await createSubjectFor(
    app,
    registered.accessCookie,
    subject
  );
  expect(subjectResponse.status).toBe(201);

  return {
    ...registered,
    subject: subjectResponse.body.data.subject
  };
}

function freePayload(subjectId, overrides = {}) {
  return {
    clientId: randomUUID(),
    subjectId,
    mode: 'free',
    status: 'completed',
    targetMinutes: null,
    breakMinutes: null,
    breakCount: null,
    effectiveSeconds: 120,
    startedAt: '2026-11-11T10:00:00.000Z',
    endedAt: '2026-11-11T10:02:00.000Z',
    ...overrides
  };
}

function postSession(accessCookie, payload) {
  return request(app)
    .post('/api/sessions')
    .set('Cookie', accessCookie)
    .send(payload);
}

afterAll(async () => {
  await deleteUsersByEmail(createdEmails);
  await pool.end();
});

describe('sessions', () => {
  it('crea una sesión libre y es idempotente por clientId', async () => {
    const { accessCookie, subject } = await setup();
    const payload = freePayload(subject.id);

    const created = await postSession(accessCookie, payload);
    expect(created.status).toBe(201);
    expect(created.body.data.created).toBe(true);
    expect(created.body.data.session).toMatchObject({
      clientId: payload.clientId,
      subjectId: subject.id,
      subject: {
        id: subject.id,
        name: subject.name,
        color: subject.color
      },
      mode: 'free',
      status: 'completed',
      targetMinutes: null,
      breakMinutes: null,
      breakCount: null,
      effectiveSeconds: 120,
      effectiveMinutes: 2,
      sessionDate: '2026-11-11'
    });

    const repeated = await postSession(accessCookie, payload);
    expect(repeated.status).toBe(200);
    expect(repeated.body.data.created).toBe(false);
    expect(repeated.body.data.session.id).toBe(
      created.body.data.session.id
    );

    const list = await request(app)
      .get('/api/sessions')
      .set('Cookie', accessCookie);

    expect(list.status).toBe(200);
    expect(list.body.data.sessions).toHaveLength(1);
    expect(list.body.data.pagination.total).toBe(1);
  });

  it('valida las reglas básicas del modo libre', async () => {
    const { accessCookie, subject } = await setup();

    const tooShort = await postSession(
      accessCookie,
      freePayload(subject.id, {
        effectiveSeconds: 30,
        endedAt: '2026-11-11T10:00:30.000Z'
      })
    );
    expect(tooShort.status).toBe(422);
    expect(tooShort.body.error.code).toBe('INVALID_SESSION');

    const abandoned = await postSession(
      accessCookie,
      freePayload(subject.id, { status: 'abandoned' })
    );
    expect(abandoned.status).toBe(422);
    expect(abandoned.body.error.code).toBe('INVALID_SESSION');

    const withPlan = await postSession(
      accessCookie,
      freePayload(subject.id, {
        targetMinutes: 30,
        breakMinutes: 10,
        breakCount: 1
      })
    );
    expect(withPlan.status).toBe(422);
    expect(withPlan.body.error.code).toBe('INVALID_SESSION');

    const invalidStart = await postSession(
      accessCookie,
      freePayload(subject.id, { startedAt: 'ayer a la tarde' })
    );
    expect(invalidStart.status).toBe(422);
    expect(invalidStart.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('valida las reglas del modo fijo y guarda una abandonada', async () => {
    const { accessCookie, subject } = await setup();

    const completed = await postSession(
      accessCookie,
      {
        ...freePayload(subject.id),
        mode: 'fixed',
        targetMinutes: 30,
        breakMinutes: 10,
        breakCount: 1,
        effectiveSeconds: 1800,
        startedAt: '2026-11-11T10:00:00.000Z',
        endedAt: '2026-11-11T10:40:00.000Z'
      }
    );
    expect(completed.status).toBe(201);
    expect(completed.body.data.session).toMatchObject({
      mode: 'fixed',
      status: 'completed',
      targetMinutes: 30,
      breakMinutes: 10,
      breakCount: 1,
      effectiveSeconds: 1800,
      effectiveMinutes: 30
    });

    const invalidPlan = await postSession(
      accessCookie,
      {
        ...freePayload(subject.id),
        mode: 'fixed',
        targetMinutes: 60,
        breakMinutes: 5,
        breakCount: 2,
        effectiveSeconds: 3600,
        startedAt: '2026-11-11T11:00:00.000Z',
        endedAt: '2026-11-11T11:45:00.000Z'
      }
    );
    expect(invalidPlan.status).toBe(422);
    expect(invalidPlan.body.error.code).toBe('INVALID_SESSION');

    const mismatch = await postSession(
      accessCookie,
      {
        ...freePayload(subject.id),
        mode: 'fixed',
        targetMinutes: 30,
        breakMinutes: 10,
        breakCount: 1,
        effectiveSeconds: 1700,
        startedAt: '2026-11-11T12:00:00.000Z',
        endedAt: '2026-11-11T12:40:00.000Z'
      }
    );
    expect(mismatch.status).toBe(422);
    expect(mismatch.body.error.code).toBe('INVALID_SESSION');

    const abandoned = await postSession(
      accessCookie,
      {
        ...freePayload(subject.id),
        mode: 'fixed',
        status: 'abandoned',
        targetMinutes: 60,
        breakMinutes: 10,
        breakCount: 2,
        effectiveSeconds: 1200,
        startedAt: '2026-11-11T13:00:00.000Z',
        endedAt: '2026-11-11T13:40:00.000Z'
      }
    );
    expect(abandoned.status).toBe(201);
    expect(abandoned.body.data.session).toMatchObject({
      mode: 'fixed',
      status: 'abandoned',
      targetMinutes: 60,
      breakMinutes: 10,
      breakCount: 2,
      effectiveSeconds: 1200
    });

    const abandonedTooLong = await postSession(
      accessCookie,
      {
        ...freePayload(subject.id),
        mode: 'fixed',
        status: 'abandoned',
        targetMinutes: 60,
        breakMinutes: 10,
        breakCount: 2,
        effectiveSeconds: 3600,
        startedAt: '2026-11-11T14:00:00.000Z',
        endedAt: '2026-11-11T14:40:00.000Z'
      }
    );
    expect(abandonedTooLong.status).toBe(422);
    expect(abandonedTooLong.body.error.code).toBe('INVALID_SESSION');
  });

  it('rechaza solapamientos del mismo usuario', async () => {
    const { accessCookie, subject } = await setup();

    const first = await postSession(accessCookie, freePayload(subject.id));
    expect(first.status).toBe(201);

    const overlapping = await postSession(
      accessCookie,
      freePayload(subject.id, {
        startedAt: '2026-11-11T10:01:00.000Z',
        endedAt: '2026-11-11T10:03:00.000Z'
      })
    );

    expect(overlapping.status).toBe(409);
    expect(overlapping.body.error.code).toBe('SESSION_OVERLAP');
  });

  it('rechaza materias ajenas y archivadas', async () => {
    const userA = await setup();
    const userB = await setup();

    const foreign = await postSession(
      userA.accessCookie,
      freePayload(userB.subject.id)
    );
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.code).toBe('NOT_FOUND');

    const first = await postSession(
      userA.accessCookie,
      freePayload(userA.subject.id)
    );
    expect(first.status).toBe(201);

    const archived = await request(app)
      .delete(`/api/subjects/${userA.subject.id}`)
      .set('Cookie', userA.accessCookie);
    expect(archived.status).toBe(200);
    expect(archived.body.data.deleted).toBe(false);

    const onArchived = await postSession(
      userA.accessCookie,
      freePayload(userA.subject.id, {
        startedAt: '2026-11-11T11:00:00.000Z',
        endedAt: '2026-11-11T11:02:00.000Z'
      })
    );
    expect(onArchived.status).toBe(422);
    expect(onArchived.body.error.code).toBe('SUBJECT_ARCHIVED');
  });

  it('valida el reloj y las fechas de la sesión', async () => {
    const { accessCookie, subject } = await setup();

    const fasterThanClock = await postSession(
      accessCookie,
      freePayload(subject.id, {
        effectiveSeconds: 120,
        startedAt: '2026-11-11T10:00:00.000Z',
        endedAt: '2026-11-11T10:01:00.000Z'
      })
    );
    expect(fasterThanClock.status).toBe(422);
    expect(fasterThanClock.body.error.code).toBe('INVALID_SESSION');

    const sameEnd = await postSession(
      accessCookie,
      freePayload(subject.id, {
        startedAt: '2026-11-11T10:00:00.000Z',
        endedAt: '2026-11-11T10:00:00.000Z'
      })
    );
    expect(sameEnd.status).toBe(422);
    expect(sameEnd.body.error.code).toBe('INVALID_SESSION');
  });

  it('deriva session_date con la zona horaria del usuario', async () => {
    const { accessCookie, subject } = await setup({
      user: { timezone: 'America/Argentina/Buenos_Aires' }
    });

    const response = await postSession(
      accessCookie,
      freePayload(subject.id, {
        startedAt: '2026-03-09T02:30:00.000Z',
        endedAt: '2026-03-09T02:32:00.000Z'
      })
    );

    expect(response.status).toBe(201);
    expect(response.body.data.session.sessionDate).toBe('2026-03-08');
  });

  it('filtra y pagina el historial', async () => {
    const { accessCookie, userId, subject } = await setup();
    const secondSubject = await createSubjectFor(app, accessCookie, {
      name: 'Historia'
    });
    expect(secondSubject.status).toBe(201);
    const secondSubjectId = secondSubject.body.data.subject.id;

    const first = await insertSession(userId, subject.id, {
      sessionDate: '2026-11-01',
      effectiveSeconds: 60
    });
    const second = await insertSession(userId, subject.id, {
      sessionDate: '2026-11-02',
      effectiveSeconds: 600,
      mode: 'fixed',
      status: 'abandoned',
      targetMinutes: 60,
      breakMinutes: 5,
      breakCount: 3
    });
    const third = await insertSession(userId, secondSubjectId, {
      sessionDate: '2026-11-03',
      effectiveSeconds: 120
    });
    const fourth = await insertSession(userId, subject.id, {
      sessionDate: '2026-11-04',
      effectiveSeconds: 180
    });

    const byRange = await request(app)
      .get('/api/sessions?from=2026-11-02&to=2026-11-03')
      .set('Cookie', accessCookie);
    expect(byRange.status).toBe(200);
    expect(byRange.body.data.pagination.total).toBe(2);
    expect(byRange.body.data.sessions.map((session) => session.clientId)).toEqual([
      third.clientId,
      second.clientId
    ]);

    const bySubject = await request(app)
      .get(`/api/sessions?subjectId=${subject.id}`)
      .set('Cookie', accessCookie);
    expect(bySubject.status).toBe(200);
    expect(bySubject.body.data.pagination.total).toBe(3);
    expect(bySubject.body.data.sessions.map((session) => session.clientId)).toEqual([
      fourth.clientId,
      second.clientId,
      first.clientId
    ]);

    const byStatus = await request(app)
      .get('/api/sessions?status=abandoned&mode=fixed')
      .set('Cookie', accessCookie);
    expect(byStatus.status).toBe(200);
    expect(byStatus.body.data.sessions).toHaveLength(1);
    expect(byStatus.body.data.sessions[0].clientId).toBe(second.clientId);

    const firstPage = await request(app)
      .get('/api/sessions?limit=2&offset=0')
      .set('Cookie', accessCookie);
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.pagination).toEqual({
      limit: 2,
      offset: 0,
      total: 4
    });
    expect(firstPage.body.data.sessions).toHaveLength(2);

    const secondPage = await request(app)
      .get('/api/sessions?limit=2&offset=2')
      .set('Cookie', accessCookie);
    expect(secondPage.status).toBe(200);
    expect(secondPage.body.data.sessions).toHaveLength(2);
    expect(
      new Set([
        ...firstPage.body.data.sessions.map((session) => session.id),
        ...secondPage.body.data.sessions.map((session) => session.id)
      ]).size
    ).toBe(4);

    const invalidRange = await request(app)
      .get('/api/sessions?from=2026-11-05&to=2026-11-01')
      .set('Cookie', accessCookie);
    expect(invalidRange.status).toBe(422);
    expect(invalidRange.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requiere autenticación', async () => {
    const list = await request(app).get('/api/sessions');
    expect(list.status).toBe(401);

    const create = await postSession(null, freePayload(1));
    expect(create.status).toBe(401);
  });
});
