import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { addDays, startOfWeek, todayInZone } from '../utils/dates.js';
import {
  createSubjectFor,
  deleteUsersByEmail,
  insertSession,
  pool,
  registerUser
} from './helpers.js';

const app = createApp();
const createdEmails = new Set();

async function setup(user = {}) {
  const registered = await registerUser(app, user);
  expect(registered.response.status).toBe(201);
  createdEmails.add(registered.email);

  const subjectResponse = await createSubjectFor(app, registered.accessCookie);
  expect(subjectResponse.status).toBe(201);

  return {
    ...registered,
    subject: subjectResponse.body.data.subject
  };
}

function get(accessCookie, path) {
  return request(app).get(path).set('Cookie', accessCookie);
}

afterAll(async () => {
  await deleteUsersByEmail(createdEmails);
  await pool.end();
});

describe('stats', () => {
  it('devuelve el reporte diario agrupado por materia', async () => {
    const { accessCookie, userId, subject } = await setup();
    const secondSubject = await createSubjectFor(app, accessCookie, {
      name: 'Historia'
    });
    const secondSubjectId = secondSubject.body.data.subject.id;

    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-11',
      effectiveSeconds: 60
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-11',
      effectiveSeconds: 120,
      startedAt: '2026-11-11T13:00:00.000Z'
    });
    await insertSession(userId, secondSubjectId, {
      sessionDate: '2026-11-11',
      effectiveSeconds: 600,
      mode: 'fixed',
      status: 'abandoned',
      targetMinutes: 60,
      breakMinutes: 10,
      breakCount: 2,
      startedAt: '2026-11-11T15:00:00.000Z'
    });

    const response = await get(
      accessCookie,
      '/api/stats/daily?date=2026-11-11'
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      date: '2026-11-11',
      totalSeconds: 780,
      totalMinutes: 13,
      sessions: 3
    });
    expect(response.body.data.subjects).toHaveLength(2);
    expect(response.body.data.subjects[0]).toMatchObject({
      subjectId: secondSubjectId,
      effectiveSeconds: 600,
      effectiveMinutes: 10,
      sessions: 1
    });
    expect(response.body.data.subjects[1]).toMatchObject({
      subjectId: subject.id,
      effectiveSeconds: 180,
      effectiveMinutes: 3,
      sessions: 2
    });

    const empty = await get(
      accessCookie,
      '/api/stats/daily?date=2026-11-12'
    );
    expect(empty.status).toBe(200);
    expect(empty.body.data).toMatchObject({
      date: '2026-11-12',
      totalSeconds: 0,
      totalMinutes: 0,
      sessions: 0,
      subjects: []
    });
  });

  it('devuelve serie, materias y extremos semanales y mensuales', async () => {
    const { accessCookie, userId, subject } = await setup();

    await insertSession(userId, subject.id, {
      sessionDate: '2026-10-31',
      effectiveSeconds: 300
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-01',
      effectiveSeconds: 180
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-09',
      effectiveSeconds: 60
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-10',
      effectiveSeconds: 120
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-11',
      effectiveSeconds: 120
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-30',
      effectiveSeconds: 180
    });

    const week = await get(
      accessCookie,
      '/api/stats/period?period=week&date=2026-11-11'
    );
    expect(week.status).toBe(200);
    expect(week.body.data).toMatchObject({
      period: 'week',
      startDate: '2026-11-09',
      endDate: '2026-11-15',
      totalSeconds: 300,
      totalMinutes: 5,
      sessions: 3
    });
    expect(week.body.data.days).toHaveLength(7);
    expect(week.body.data.days.find((day) => day.date === '2026-11-09'))
      .toMatchObject({ effectiveSeconds: 60, effectiveMinutes: 1 });
    expect(week.body.data.days.find((day) => day.date === '2026-11-12'))
      .toMatchObject({ effectiveSeconds: 0, effectiveMinutes: 0 });
    expect(week.body.data.subjects[0]).toMatchObject({
      subjectId: subject.id,
      effectiveSeconds: 300,
      sessions: 3
    });
    expect(week.body.data.extremes.most).toMatchObject({
      date: '2026-11-11',
      effectiveSeconds: 120
    });
    expect(week.body.data.extremes.least).toMatchObject({
      date: '2026-11-09',
      effectiveSeconds: 60
    });

    const month = await get(
      accessCookie,
      '/api/stats/period?period=month&date=2026-11-11'
    );
    expect(month.status).toBe(200);
    expect(month.body.data).toMatchObject({
      period: 'month',
      startDate: '2026-11-01',
      endDate: '2026-11-30',
      totalSeconds: 660,
      totalMinutes: 11,
      sessions: 5
    });
    expect(month.body.data.days).toHaveLength(30);
    expect(month.body.data.extremes.most).toMatchObject({
      date: '2026-11-30',
      effectiveSeconds: 180
    });
    expect(month.body.data.extremes.least).toMatchObject({
      date: '2026-11-09',
      effectiveSeconds: 60
    });

    const empty = await get(
      accessCookie,
      '/api/stats/period?period=month&date=2027-02-10'
    );
    expect(empty.status).toBe(200);
    expect(empty.body.data).toMatchObject({
      totalSeconds: 0,
      totalMinutes: 0,
      sessions: 0,
      subjects: []
    });
    expect(empty.body.data.days).toHaveLength(28);
    expect(empty.body.data.extremes).toEqual({
      most: null,
      least: null
    });
  });

  it('calcula la racha viva, rota y el mejor histórico', async () => {
    const { accessCookie, userId, subject } = await setup();

    await insertSession(userId, subject.id, {
      sessionDate: '2026-11-08',
      effectiveSeconds: 600,
      mode: 'fixed',
      status: 'abandoned',
      targetMinutes: 60,
      breakMinutes: 10,
      breakCount: 2
    });

    for (const date of ['2026-11-09', '2026-11-10', '2026-11-11']) {
      await insertSession(userId, subject.id, {
        sessionDate: date,
        effectiveSeconds: 60
      });
    }

    const today = await get(
      accessCookie,
      '/api/stats/streak?date=2026-11-11'
    );
    expect(today.status).toBe(200);
    expect(today.body.data).toMatchObject({
      current: 3,
      best: 3,
      today: '2026-11-11',
      lastCompletedDate: '2026-11-11'
    });

    const alive = await get(
      accessCookie,
      '/api/stats/streak?date=2026-11-12'
    );
    expect(alive.body.data.current).toBe(3);
    expect(alive.body.data.lastCompletedDate).toBe('2026-11-11');

    const broken = await get(
      accessCookie,
      '/api/stats/streak?date=2026-11-14'
    );
    expect(broken.body.data.current).toBe(0);
    expect(broken.body.data.best).toBe(3);

    const firstDay = await get(
      accessCookie,
      '/api/stats/streak?date=2026-11-09'
    );
    expect(firstDay.body.data.current).toBe(1);
  });

  it('genera el heatmap anual con niveles exactos y días futuros neutros', async () => {
    const { accessCookie, userId, subject } = await setup();

    await insertSession(userId, subject.id, {
      sessionDate: '2024-01-01',
      effectiveSeconds: 3600
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-01-02',
      effectiveSeconds: 7200
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-01-03',
      effectiveSeconds: 14400
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-01-04',
      effectiveSeconds: 28800
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-01-05',
      effectiveSeconds: 600
    });

    const response = await get(
      accessCookie,
      '/api/stats/heatmap?year=2024'
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      year: 2024,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      thresholds: [60, 120, 240, 480],
      totalSeconds: 54600,
      totalMinutes: 910,
      activeDays: 5
    });
    expect(response.body.data.days).toHaveLength(366);

    const byDate = new Map(
      response.body.data.days.map((day) => [day.date, day])
    );
    expect(byDate.get('2024-01-01')).toMatchObject({
      effectiveSeconds: 3600,
      level: 1
    });
    expect(byDate.get('2024-01-02')).toMatchObject({
      effectiveSeconds: 7200,
      level: 2
    });
    expect(byDate.get('2024-01-03')).toMatchObject({
      effectiveSeconds: 14400,
      level: 3
    });
    expect(byDate.get('2024-01-04')).toMatchObject({
      effectiveSeconds: 28800,
      level: 4
    });
    expect(byDate.get('2024-01-05')).toMatchObject({
      effectiveSeconds: 600,
      level: 0
    });
    expect(byDate.get('2024-01-06')).toMatchObject({
      effectiveSeconds: 0,
      level: 0
    });

    const today = todayInZone('UTC');
    const tomorrow = addDays(today, 1);

    if (tomorrow.slice(0, 4) === today.slice(0, 4)) {
      const current = await get(accessCookie, '/api/stats/heatmap');
      const futureDay = current.body.data.days.find(
        (day) => day.date === tomorrow
      );

      expect(futureDay).toMatchObject({
        isFuture: true,
        level: null
      });
    }
  });

  it('usa los umbrales configurados en el heatmap', async () => {
    const { accessCookie, userId, subject } = await setup();

    const updated = await request(app)
      .put('/api/settings')
      .set('Cookie', accessCookie)
      .send({ heatmapThresholds: [30, 60, 120, 240] });
    expect(updated.status).toBe(200);

    await insertSession(userId, subject.id, {
      sessionDate: '2024-02-01',
      effectiveSeconds: 1800
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-02-02',
      effectiveSeconds: 3600
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-02-03',
      effectiveSeconds: 7200
    });
    await insertSession(userId, subject.id, {
      sessionDate: '2024-02-04',
      effectiveSeconds: 14400
    });

    const response = await get(
      accessCookie,
      '/api/stats/heatmap?year=2024'
    );
    const byDate = new Map(
      response.body.data.days.map((day) => [day.date, day])
    );

    expect(response.body.data.thresholds).toEqual([30, 60, 120, 240]);
    expect(byDate.get('2024-02-01').level).toBe(1);
    expect(byDate.get('2024-02-02').level).toBe(2);
    expect(byDate.get('2024-02-03').level).toBe(3);
    expect(byDate.get('2024-02-04').level).toBe(4);
  });

  it('lee, actualiza y usa fallback en settings', async () => {
    const { accessCookie, userId } = await setup();

    const defaults = await get(accessCookie, '/api/settings');
    expect(defaults.status).toBe(200);
    expect(defaults.body.data.settings).toEqual({
      heatmapThresholds: [60, 120, 240, 480]
    });

    const updated = await request(app)
      .put('/api/settings')
      .set('Cookie', accessCookie)
      .send({ heatmapThresholds: [30, 90, 180, 360] });
    expect(updated.status).toBe(200);
    expect(updated.body.data.settings.heatmapThresholds).toEqual([
      30, 90, 180, 360
    ]);

    const reread = await get(accessCookie, '/api/settings');
    expect(reread.body.data.settings.heatmapThresholds).toEqual([
      30, 90, 180, 360
    ]);

    const wrongLength = await request(app)
      .put('/api/settings')
      .set('Cookie', accessCookie)
      .send({ heatmapThresholds: [30, 60, 120] });
    expect(wrongLength.status).toBe(422);
    expect(wrongLength.body.error.code).toBe('VALIDATION_ERROR');

    const wrongOrder = await request(app)
      .put('/api/settings')
      .set('Cookie', accessCookie)
      .send({ heatmapThresholds: [60, 30, 120, 240] });
    expect(wrongOrder.status).toBe(422);
    expect(wrongOrder.body.error.code).toBe('VALIDATION_ERROR');

    await pool.execute('DELETE FROM user_settings WHERE user_id = ?', [userId]);

    const fallback = await get(accessCookie, '/api/settings');
    expect(fallback.body.data.settings.heatmapThresholds).toEqual([
      60, 120, 240, 480
    ]);

    const upserted = await request(app)
      .put('/api/settings')
      .set('Cookie', accessCookie)
      .send({ heatmapThresholds: [15, 30, 60, 120] });
    expect(upserted.status).toBe(200);
    expect(upserted.body.data.settings.heatmapThresholds).toEqual([
      15, 30, 60, 120
    ]);
  });

  it('obtiene hoy, semana y racha desde el dashboard', async () => {
    const { accessCookie, userId, subject } = await setup();
    const today = todayInZone('UTC');

    await insertSession(userId, subject.id, {
      sessionDate: today,
      effectiveSeconds: 120
    });

    const response = await get(accessCookie, '/api/dashboard');
    expect(response.status).toBe(200);
    expect(response.body.data.today).toMatchObject({
      date: today,
      totalSeconds: 120,
      totalMinutes: 2,
      sessions: 1
    });
    expect(response.body.data.period).toMatchObject({
      period: 'week',
      startDate: startOfWeek(today)
    });
    expect(response.body.data.streak.current).toBe(1);
  });

  it('aísla las estadísticas entre usuarios', async () => {
    const userA = await setup();
    const userB = await setup();
    const today = todayInZone('UTC');

    await insertSession(userA.userId, userA.subject.id, {
      sessionDate: today,
      effectiveSeconds: 600
    });

    const daily = await get(
      userB.accessCookie,
      `/api/stats/daily?date=${today}`
    );
    expect(daily.body.data.totalSeconds).toBe(0);

    const period = await get(
      userB.accessCookie,
      `/api/stats/period?period=week&date=${today}`
    );
    expect(period.body.data.totalSeconds).toBe(0);

    const streak = await get(
      userB.accessCookie,
      `/api/stats/streak?date=${today}`
    );
    expect(streak.body.data.current).toBe(0);

    const heatmap = await get(
      userB.accessCookie,
      `/api/stats/heatmap?year=${today.slice(0, 4)}`
    );
    expect(heatmap.body.data.totalSeconds).toBe(0);
  });
});
