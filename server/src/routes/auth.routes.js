import { Router } from 'express';

import {
  changePassword,
  login,
  logout,
  me,
  refresh,
  register,
  updateMe
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  loginLimiter,
  refreshLimiter,
  registerLimiter
} from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  changePasswordSchema,
  loginSchema,
  registerSchema,
  updateProfileSchema
} from '../schemas/auth.schema.js';

export const authRouter = Router();

authRouter.post('/register', registerLimiter, validate(registerSchema), register);
authRouter.post('/login', loginLimiter, validate(loginSchema), login);
authRouter.post('/refresh', refreshLimiter, refresh);
authRouter.post('/logout', logout);

authRouter.get('/me', requireAuth, me);
authRouter.patch('/me', requireAuth, validate(updateProfileSchema), updateMe);
authRouter.patch(
  '/password',
  requireAuth,
  validate(changePasswordSchema),
  changePassword
);
