import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { healthRouter } from './health.routes.js';
import { sessionsRouter } from './sessions.routes.js';
import { settingsRouter } from './settings.routes.js';
import { dashboardRouter, statsRouter } from './stats.routes.js';
import { subjectsRouter } from './subjects.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/subjects', subjectsRouter);
apiRouter.use('/sessions', sessionsRouter);
apiRouter.use('/stats', statsRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/settings', settingsRouter);
