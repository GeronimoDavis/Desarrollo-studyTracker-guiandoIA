import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HEATMAP_THRESHOLDS,
  getHeatmapLevel,
  getThresholdBands,
  validateThresholds
} from './settings.js';

describe('settings helpers', () => {
  it('acepta cuatro umbrales ascendentes', () => {
    const result = validateThresholds([60, 120, 240, 480]);

    expect(result.valid).toBe(true);
    expect(result.values).toEqual([60, 120, 240, 480]);
  });

  it('rechaza umbrales no ascendentes, decimales o fuera de rango', () => {
    expect(validateThresholds([60, 30, 120, 240]).message).toBe(
      'Los umbrales deben estar en orden ascendente.'
    );
    expect(validateThresholds([60, 120.5, 240, 480]).message).toBe(
      'Cada umbral debe ser un número entero de minutos.'
    );
    expect(validateThresholds([0, 120, 240, 480]).message).toBe(
      'Cada umbral debe estar entre 1 y 1440 minutos.'
    );
    expect(validateThresholds([60, 120, 240, 5000]).message).toBe(
      'Cada umbral debe estar entre 1 y 1440 minutos.'
    );
  });

  it('calcula los niveles igual que el backend', () => {
    const thresholds = DEFAULT_HEATMAP_THRESHOLDS;

    expect(getHeatmapLevel(0, thresholds)).toBe(0);
    expect(getHeatmapLevel(1, thresholds)).toBe(1);
    expect(getHeatmapLevel(59, thresholds)).toBe(1);
    expect(getHeatmapLevel(60, thresholds)).toBe(2);
    expect(getHeatmapLevel(120, thresholds)).toBe(3);
    expect(getHeatmapLevel(240, thresholds)).toBe(4);
    expect(getHeatmapLevel(600, thresholds)).toBe(4);
  });

  it('describe las bandas de color', () => {
    const bands = getThresholdBands([30, 60, 120, 240]);

    expect(bands).toHaveLength(4);
    expect(bands[0].label).toBe('Menos de 30 min');
    expect(bands[1].label).toBe('30 – 59 min');
    expect(bands[2].label).toBe('60 – 119 min');
    expect(bands[3].label).toBe('120 min o más');
  });
});
