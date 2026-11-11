import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class TokenTypeError extends Error {
  constructor(message = 'Tipo de token inválido.') {
    super(message);
    this.name = 'TokenTypeError';
  }
}

export function signAccessToken(userId) {
  return jwt.sign(
    {
      sub: String(userId),
      typ: 'access'
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

export function signRefreshToken(userId) {
  const token = jwt.sign(
    {
      sub: String(userId),
      typ: 'refresh'
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
      jwtid: randomUUID()
    }
  );

  return {
    token,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS)
  };
}

function verifyTypedToken(token, secret, expectedType) {
  const payload = jwt.verify(token, secret);

  if (typeof payload !== 'object' || payload.typ !== expectedType) {
    throw new TokenTypeError();
  }

  return payload;
}

export function verifyAccessToken(token) {
  return verifyTypedToken(token, env.JWT_ACCESS_SECRET, 'access');
}

export function verifyRefreshToken(token) {
  return verifyTypedToken(token, env.JWT_REFRESH_SECRET, 'refresh');
}
