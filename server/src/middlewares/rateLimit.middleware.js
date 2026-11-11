import { rateLimit } from 'express-rate-limit';

import { env } from '../config/env.js';

function rateLimitHandler(req, res) {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'
    }
  });
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
  keyGenerator: (req) =>
    `${req.ip}:${String(req.body?.email ?? '').trim().toLowerCase()}`
});

export const refreshLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 60 * 1000,
  limit: 30
});
