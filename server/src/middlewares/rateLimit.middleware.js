import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';

function rateLimitHandler(req, res) {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'
    }
  });
}

// `ipKeyGenerator` normaliza IPv6 a un subred (/56) para que un /64 completo
// no evada el límite por IP; IPv4 queda intacto. No se puede usar la opción
// `ipv6Subnet` junto a un `keyGenerator` propio: la librería lo rechaza.
export function buildLoginKey(req) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();

  return `${ipKeyGenerator(req.ip)}:${email}`;
}

const sharedOptions = {
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test'
};

export const apiLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 300
});

export const registerLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 60 * 1000,
  limit: 5
});

export const loginLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: buildLoginKey
});

export const refreshLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  limit: 30
});
