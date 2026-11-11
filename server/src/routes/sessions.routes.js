import { Router } from 'express';

import {
  createSession,
  listSessions
} from '../controllers/sessions.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createSessionSchema,
  listSessionsQuerySchema
} from '../schemas/session.schema.js';

export const sessionsRouter = Router();

sessionsRouter.use(requireAuth);

sessionsRouter.get(
  '/',
  validate(listSessionsQuerySchema, 'query'),
  listSessions
);
sessionsRouter.post('/', validate(createSessionSchema), createSession);
