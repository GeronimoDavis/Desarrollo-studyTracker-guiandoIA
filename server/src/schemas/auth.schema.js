import { z } from 'zod';

const nameSchema = z
  .string({ error: 'El nombre es obligatorio.' })
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres.')
  .max(80, 'El nombre no puede superar los 80 caracteres.');

const emailSchema = z
  .string({ error: 'El email es obligatorio.' })
  .trim()
  .email('Ingresá un email válido.')
  .max(255, 'El email no puede superar los 255 caracteres.')
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(72, 'La contraseña no puede superar los 72 caracteres.');

const loginPasswordSchema = z
  .string({ error: 'La contraseña es obligatoria.' })
  .min(1, 'Ingresá tu contraseña.')
  .max(72, 'La contraseña no puede superar los 72 caracteres.');

function isValidTimeZone(value) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

const timezoneSchema = z
  .string({ error: 'La zona horaria es obligatoria.' })
  .trim()
  .min(1, 'La zona horaria es obligatoria.')
  .max(64, 'La zona horaria no puede superar los 64 caracteres.')
  .refine(isValidTimeZone, 'Ingresá una zona horaria IANA válida.');

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  timezone: timezoneSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema
});

export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    timezone: timezoneSchema.optional()
  })
  .refine((data) => data.name !== undefined || data.timezone !== undefined, {
    message: 'Enviá al menos un campo para actualizar.',
    path: ['_form']
  });

export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ error: 'La contraseña actual es obligatoria.' })
    .min(1, 'Ingresá tu contraseña actual.')
    .max(72, 'La contraseña actual no puede superar los 72 caracteres.'),
  newPassword: passwordSchema
});
