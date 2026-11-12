import { describe, expect, it } from 'vitest';

import {
  HEATMAP_LEVEL_CLASSES,
  getHeatmapLevelClass
} from './heatmap.js';

describe('heatmap levels', () => {
  it('mapea los cinco niveles a colores', () => {
    for (let level = 0; level <= 4; level += 1) {
      expect(getHeatmapLevelClass({ level, isFuture: false })).toBe(
        HEATMAP_LEVEL_CLASSES[level]
      );
    }
  });

  it('deja neutros los días futuros', () => {
    expect(getHeatmapLevelClass({ level: null, isFuture: true })).toContain(
      'border-dashed'
    );
    expect(getHeatmapLevelClass({ level: null, isFuture: true })).toContain(
      'bg-white'
    );
  });

  it('limita niveles fuera de rango', () => {
    expect(getHeatmapLevelClass({ level: 99, isFuture: false })).toBe(
      HEATMAP_LEVEL_CLASSES[4]
    );
    expect(getHeatmapLevelClass({ level: -1, isFuture: false })).toBe(
      HEATMAP_LEVEL_CLASSES[0]
    );
  });
});
