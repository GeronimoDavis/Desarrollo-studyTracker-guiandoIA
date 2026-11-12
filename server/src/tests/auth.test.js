import { randomUUID } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';

import { createApp } from '../app.js';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';
import { loginLimiter } from '../middlewares/rateLimit.middleware.js';

const app = createApp();
const createdEmails = new Set();

function cookieHeader(response, name) {
  const cookies = response.headers['set-cookie'] ?? [];
  const cookie = cookies.find((value) => value.startsWith(`${name}=`));

  return cookie?.split(';')[0] ?? null;
}

function cookieWithAttributes(response, name) {
  const cookies = response.headers['set-cookie'] ?? [];
  return cookies.find((value) => value.startsWith(`${name}=`)) ?? '';
}

function trackEmail(email) {
  createdEmails.add(email);
  return email;
}

async function registerUser(overrides = {}) {
  const email = trackEmail(
    overrides.email ?? `auth-test-${randomUUID()}@example.com`
  );
  const password = overrides.password ?? 'Password1!';
  const payload = {
    name: 'Usuario de Prueba',
    email,
    password,
    timezone: 'America/Argentina/Buenos_Aires',
    ...overrides
  };

  const response = await request(app)
    .post('/api/auth/register')
    .send(payload);

  return {
    response,
    email,
    password,
    accessCookie: cookieHeader(response, 'st_access'),
    refreshCookie: cookieHeader(response, 'st_refresh')
  };
}

afterAll(async () => {
  for (const email of createdEmails) {
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
  }

  await pool.end();
});

describe('auth', () => {
  it('registra un usuario, crea settings y cookies httpOnly', async () => {
    const { response, email, accessCookie, refreshCookie } =
      await registerUser();

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({
      name: 'Usuario de Prueba',
      email
    });
    expect(response.body.data.user).not.toHaveProperty('password_hash');

    const accessHeader = cookieWithAttributes(response, 'st_access');
    const refreshHeader = cookieWithAttributes(response, 'st_refresh');

    expect(accessHeader.toLowerCase()).toContain('httponly');
    expect(accessHeader.toLowerCase()).toContain('path=/api');
    expect(refreshHeader.toLowerCase()).toContain('httponly');
    expect(refreshHeader.toLowerCase()).toContain('path=/api/auth');
    expect(accessCookie).toBeTruthy();
    expect(refreshCookie).toBeTruthy();

    const [rows] = await pool.query(
      `SELECT us.heatmap_thresholds
         FROM user_settings us
         JOIN users u ON u.id = us.user_id
        WHERE u.email = ?`,
      [email]
    );

    const thresholds =
      typeof rows[0].heatmap_thresholds === 'string'
        ? JSON.parse(rows[0].heatmap_thresholds)
        : rows[0].heatmap_thresholds;

    expect(thresholds).toEqual([60, 120, 240, 480]);
  });

  it('rechaza un email duplicado con 409', async () => {
    const first = await registerUser();
    const second = await registerUser({ email: first.email });

    expect(first.response.status).toBe(201);
    expect(second.response.status).toBe(409);
    expect(second.response.body.error.code).toBe('EMAIL_IN_USE');
  });

  it('devuelve 422 con campos en español', async () => {
    const response = await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'no-es-email',
      password: 'corta',
      timezone: 'No/Existe'
    });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.fields).toMatchObject({
      name: expect.any(String),
      email: expect.any(String),
      password: expect.any(String),
      timezone: expect.any(String)
    });
  });

  it('hace login y usa un error genérico para credenciales inválidas', async () => {
    const { email, password } = await registerUser();

    const invalid = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'Incorrecta1!' });

    expect(invalid.status).toBe(401);
    expect(invalid.body.error.code).toBe('INVALID_CREDENTIALS');

    const unknown = await request(app)
      .post('/api/auth/login')
      .send({ email: `nadie-${randomUUID()}@example.com`, password });

    expect(unknown.status).toBe(401);
    expect(unknown.body.error.code).toBe('INVALID_CREDENTIALS');

    const valid = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(valid.status).toBe(200);
    expect(valid.body.data.user.email).toBe(email);
    expect(cookieHeader(valid, 'st_access')).toBeTruthy();
    expect(cookieHeader(valid, 'st_refresh')).toBeTruthy();
  });

  it('rota el refresh y detecta reutilización', async () => {
    const { refreshCookie } = await registerUser();

    const firstRefresh = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(firstRefresh.status).toBe(200);
    const rotatedRefresh = cookieHeader(firstRefresh, 'st_refresh');
    expect(rotatedRefresh).toBeTruthy();
    expect(rotatedRefresh).not.toBe(refreshCookie);

    const reuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(reuse.status).toBe(401);

    const afterReuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', rotatedRefresh);

    expect(afterReuse.status).toBe(401);
  });

  it('hace logout y deja de aceptar el refresh', async () => {
    const { refreshCookie } = await registerUser();

    const logout = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', refreshCookie);

    expect(logout.status).toBe(204);

    const refreshAfterLogout = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshAfterLogout.status).toBe(401);
  });

  it('cambia la contraseña y revoca los refresh', async () => {
    const { email, password, accessCookie, refreshCookie } =
      await registerUser();
    const newPassword = 'Password2!';

    const wrongCurrent = await request(app)
      .patch('/api/auth/password')
      .set('Cookie', accessCookie)
      .send({ currentPassword: 'Incorrecta1!', newPassword });

    expect(wrongCurrent.status).toBe(422);
    expect(wrongCurrent.body.error.code).toBe('INVALID_CURRENT_PASSWORD');

    const changed = await request(app)
      .patch('/api/auth/password')
      .set('Cookie', accessCookie)
      .send({ currentPassword: password, newPassword });

    expect(changed.status).toBe(204);

    const refreshAfterChange = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshAfterChange.status).toBe(401);

    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(oldLogin.status).toBe(401);

    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: newPassword });

    expect(newLogin.status).toBe(200);
  });

  it('protege /me y distingue TOKEN_EXPIRED', async () => {
    const withoutCookie = await request(app).get('/api/auth/me');
    expect(withoutCookie.status).toBe(401);
    expect(withoutCookie.body.error.code).toBe('UNAUTHENTICATED');

    const { accessCookie } = await registerUser();
    const me = await request(app)
      .get('/api/auth/me')
      .set('Cookie', accessCookie);

    expect(me.status).toBe(200);

    const expired = jwt.sign(
      { sub: '1', typ: 'access' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '-1s' }
    );

    const expiredResponse = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `st_access=${expired}`);

    expect(expiredResponse.status).toBe(401);
    expect(expiredResponse.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('mantiene aisladas las sesiones de dos usuarios', async () => {
    const first = await registerUser();
    const second = await registerUser();

    const firstMe = await request(app)
      .get('/api/auth/me')
      .set('Cookie', first.accessCookie);
    const secondMe = await request(app)
      .get('/api/auth/me')
      .set('Cookie', second.accessCookie);

    expect(firstMe.status).toBe(200);
    expect(secondMe.status).toBe(200);
    expect(firstMe.body.data.user.email).toBe(first.email);
    expect(secondMe.body.data.user.email).toBe(second.email);
    expect(firstMe.body.data.user.email).not.toBe(second.email);
  });

  it('rechaza orígenes no permitidos en métodos mutantes', async () => {
    const badOrigin = await request(app)
      .post('/api/auth/logout')
      .set('Origin', 'http://evil.example');

    expect(badOrigin.status).toBe(403);
    expect(badOrigin.body.error.code).toBe('ORIGIN_NOT_ALLOWED');

    const goodOrigin = await request(app)
      .post('/api/auth/logout')
      .set('Origin', env.CLIENT_ORIGIN);

    expect(goodOrigin.status).toBe(204);
  });

  it('limita los intentos de login', async () => {
    const originalNodeEnv = env.NODE_ENV;
    env.NODE_ENV = 'development';

    const limiterApp = express();
    limiterApp.use(express.json());
    limiterApp.post('/login', loginLimiter, (req, res) => {
      res.json({ data: { ok: true } });
    });

    try {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        const response = await request(limiterApp)
          .post('/login')
          .send({ email: 'limit@example.com' });

        expect(response.status).toBe(200);
      }

      const blocked = await request(limiterApp)
        .post('/login')
        .send({ email: 'limit@example.com' });

      expect(blocked.status).toBe(429);
      expect(blocked.body.error.code).toBe('RATE_LIMITED');
    } finally {
      env.NODE_ENV = originalNodeEnv;
    }
  });
});
