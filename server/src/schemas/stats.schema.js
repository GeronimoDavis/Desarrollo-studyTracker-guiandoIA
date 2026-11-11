import { z } from 'zod';

import { dateKeySchema, yearSchema } from './common.schema.js';

export const dailyQuerySchema = z.object({
  date: dateKeySchema.optional()
});

export const periodQuerySchema = z.object({
  period: z
    .enum(['week', 'month', 'year'], {
      error: 'El período debe ser semana, mes o año.'
    })
    .default('week'),
  date: dateKeySchema.optional()
});

export const streakQuerySchema = z.object({
  date: dateKeySchema.optional()
});

export const heatmapQuerySchema = z.object({
  year: yearSchema.optional()
});
