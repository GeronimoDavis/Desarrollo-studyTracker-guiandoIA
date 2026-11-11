import { z } from 'zod';

const thresholdSchema = z.coerce
  .number({ error: 'Cada umbral debe ser un número entero.' })
  .int('Cada umbral debe ser un número entero.')
  .min(1, 'Cada umbral debe ser mayor a 0.')
  .max(1440, 'Cada umbral no puede superar los 1440 minutos.');

export const updateSettingsSchema = z.object({
  heatmapThresholds: z
    .array(thresholdSchema, {
      error: 'Los umbrales del heatmap son obligatorios.'
    })
    .length(4, 'Ingresá exactamente cuatro umbrales.')
    .refine(
      (values) =>
        values.every(
          (value, index) => index === 0 || value > values[index - 1]
        ),
      'Los umbrales deben estar en orden ascendente.'
    )
});
