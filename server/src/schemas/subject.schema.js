import { z } from 'zod';

const nameSchema = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(80, 'El nombre no puede superar los 80 caracteres.');

const colorSchema = z
  .string({ error: 'El color es obligatorio.' })
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Ingresá un color con formato #RRGGBB.')
  .transform((value) => value.toUpperCase());

const descriptionSchema = z
  .string()
  .trim()
  .max(500, 'La descripción no puede superar los 500 caracteres.')
  .nullable()
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }

    return value ? value : null;
  });

export const subjectIdSchema = z.object({
  id: z.coerce
    .number({ error: 'El ID de la materia no es válido.' })
    .int('El ID de la materia no es válido.')
    .positive('El ID de la materia no es válido.')
});

export const createSubjectSchema = z.object({
  name: nameSchema,
  color: colorSchema,
  description: descriptionSchema
});

export const updateSubjectSchema = z
  .object({
    name: nameSchema.optional(),
    color: colorSchema.optional(),
    description: descriptionSchema
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.color !== undefined ||
      data.description !== undefined,
    {
      message: 'Enviá al menos un campo para actualizar.',
      path: ['_form']
    }
  );

export const listSubjectsQuerySchema = z.object({
  includeArchived: z
    .enum(['0', '1'], {
      error: 'includeArchived debe ser 0 o 1.'
    })
    .optional()
});
