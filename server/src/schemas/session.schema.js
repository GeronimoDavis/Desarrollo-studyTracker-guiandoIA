import { z } from 'zod';

import { dateKeySchema } from './common.schema.js';

const isoDateTime = z.string().datetime({ offset: true });

const isoDateTimeSchema = z
  .string({ error: 'La fecha y hora son obligatorias.' })
  .refine(
    (value) => isoDateTime.safeParse(value).success,
    'Usá una fecha ISO 8601 con zona horaria.'
  );

const nullablePositiveInt = z.coerce
  .number({ error: 'El valor debe ser un número entero positivo.' })
  .int('El valor debe ser un número entero positivo.')
  .positive('El valor debe ser un número entero positivo.')
  .nullable()
  .optional();

export const createSessionSchema = z.object({
  clientId: z
    .string({ error: 'El identificador de la sesión es obligatorio.' })
    .uuid('El identificador de la sesión no es válido.'),
  subjectId: z.coerce
    .number({ error: 'El ID de la materia no es válido.' })
    .int('El ID de la materia no es válido.')
    .positive('El ID de la materia no es válido.'),
  mode: z.enum(['free', 'fixed'], {
    error: 'El modo debe ser libre o fijo.'
  }),
  status: z.enum(['completed', 'abandoned'], {
    error: 'El estado debe ser completada o abandonada.'
  }),
  targetMinutes: nullablePositiveInt,
  breakMinutes: nullablePositiveInt,
  breakCount: nullablePositiveInt,
  effectiveSeconds: z.coerce
    .number({ error: 'El tiempo efectivo no es válido.' })
    .int('El tiempo efectivo no es válido.')
    .max(86400, 'La sesión no puede superar las 24 horas.'),
  startedAt: isoDateTimeSchema,
  endedAt: isoDateTimeSchema
});

export const listSessionsQuerySchema = z
  .object({
    from: dateKeySchema.optional(),
    to: dateKeySchema.optional(),
    subjectId: z.coerce
      .number({ error: 'El ID de la materia no es válido.' })
      .int('El ID de la materia no es válido.')
      .positive('El ID de la materia no es válido.')
      .optional(),
    status: z
      .enum(['completed', 'abandoned'], {
        error: 'El estado debe ser completada o abandonada.'
      })
      .optional(),
    mode: z
      .enum(['free', 'fixed'], {
        error: 'El modo debe ser libre o fijo.'
      })
      .optional(),
    limit: z.coerce
      .number({ error: 'El límite no es válido.' })
      .int('El límite no es válido.')
      .min(1, 'El límite debe ser mayor a 0.')
      .max(100, 'El límite no puede superar 100.')
      .default(50),
    offset: z.coerce
      .number({ error: 'El desplazamiento no es válido.' })
      .int('El desplazamiento no es válido.')
      .min(0, 'El desplazamiento no puede ser negativo.')
      .default(0)
  })
  .refine(
    (data) => !data.from || !data.to || data.from <= data.to,
    {
      message: 'La fecha desde no puede ser posterior a la fecha hasta.',
      path: ['_form']
    }
  );
