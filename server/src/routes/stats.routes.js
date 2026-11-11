import { Router } from 'express';

import {
  getDaily,
  getDashboard,
  getHeatmap,
  getPeriod,
  getStreak
} from '../controllers/stats.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  dailyQuerySchema,
  heatmapQuerySchema,
  periodQuerySchema,
  streakQuerySchema
} from '../schemas/stats.schema.js';

export const statsRouter = Router();

statsRouter.use(requireAuth);

statsRouter.get('/daily', validate(dailyQuerySchema, 'query'), getDaily);
statsRouter.get('/period', validate(periodQuerySchema, 'query'), getPeriod);
statsRouter.get('/streak', validate(streakQuerySchema, 'query'), getStreak);
statsRouter.get(
  '/heatmap',
  validate(heatmapQuerySchema, 'query'),
  getHeatmap
);

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.get('/', getDashboard);
