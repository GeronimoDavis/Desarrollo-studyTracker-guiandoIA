import { z } from 'zod';

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isValidDateKey(value) {
  const match = DATE_KEY_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export const dateKeySchema = z
  .string({ error: 'La fecha es obligatoria.' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá el formato YYYY-MM-DD.')
  .refine(isValidDateKey, 'Ingresá una fecha válida.');

export const yearSchema = z.coerce
  .number({ error: 'El año no es válido.' })
  .int('El año no es válido.')
  .min(1970, 'El año debe ser mayor o igual a 1970.')
  .max(2100, 'El año debe ser menor o igual a 2100.');
