import { describe, expect, it } from 'vitest';

import {
  buildHeatmapWeeks,
  buildSessionMatrix,
  getActiveDaysCount,
  getDonutSegments,
  getHeatmapMonthLabels
} from './dashboard.js';
import { addDaysToDateKey, getMondayIndex } from './dates.js';

function buildDays(startDate, count) {
  return Array.from({ length: count }, (_, index) => ({
    date: addDaysToDateKey(startDate, index),
    effectiveSeconds: 0,
    effectiveMinutes: 0
  }));
}

describe('dashboard data helpers', () => {
  it('agrupa sesiones por día y materia sin perder materias nuevas', () => {
    const matrix = buildSessionMatrix({
      days: [
        { date: '2026-11-10', effectiveSeconds: 60 },
        { date: '2026-11-11', effectiveSeconds: 0 },
        { date: '2026-11-12', effectiveSeconds: 120 }
      ],
      subjects: [
        {
          subjectId: 1,
          name: 'Matemática',
          color: '#6366F1',
          effectiveSeconds: 120,
          effectiveMinutes: 2,
          sessions: 2
        }
      ],
      sessions: [
        {
          sessionDate: '2026-11-10',
          subjectId: 1,
          effectiveSeconds: 60,
          subject: { name: 'Matemática', color: '#6366F1' }
        },
        {
          sessionDate: '2026-11-12',
          subjectId: 1,
          effectiveSeconds: 60,
          subject: { name: 'Matemática', color: '#6366F1' }
        },
        {
          sessionDate: '2026-11-12',
          subjectId: 2,
          effectiveSeconds: 60,
          subject: { name: 'Física', color: '#F59E0B' }
        }
      ]
    });

    expect(matrix.subjects.map((subject) => subject.name)).toEqual([
      'Matemática',
      'Física'
    ]);
    expect(matrix.rows[0].subjects[1].seconds).toBe(60);
    expect(matrix.rows[1].totalFromSessions).toBe(0);
    expect(matrix.rows[2].totalSeconds).toBe(120);
    expect(matrix.rows[2].totalFromSessions).toBe(120);
    expect(matrix.totalsBySubject[1]).toEqual({ seconds: 120, sessions: 2 });
    expect(matrix.totalsBySubject[2]).toEqual({ seconds: 60, sessions: 1 });
  });

  it('calcula porcentajes y offsets de la dona', () => {
    const segments = getDonutSegments([
      { subjectId: 1, name: 'A', effectiveSeconds: 180 },
      { subjectId: 2, name: 'B', effectiveSeconds: 60 }
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0].percent).toBeCloseTo(75);
    expect(segments[0].offset).toBe(0);
    expect(segments[1].percent).toBeCloseTo(25);
    expect(segments[1].offset).toBeCloseTo(75);
    expect(
      segments.reduce((total, segment) => total + segment.percent, 0)
    ).toBeCloseTo(100);
  });

  it('construye 365 y 366 días en semanas completas', () => {
    const weeks2026 = buildHeatmapWeeks(buildDays('2026-01-01', 365));
    const weeks2024 = buildHeatmapWeeks(buildDays('2024-01-01', 366));

    expect(weeks2026).toHaveLength(53);
    expect(weeks2024).toHaveLength(53);
    expect(weeks2026.flat().filter(Boolean)).toHaveLength(365);
    expect(weeks2024.flat().filter(Boolean)).toHaveLength(366);
    expect(weeks2026.every((week) => week.length === 7)).toBe(true);
    expect(weeks2024.every((week) => week.length === 7)).toBe(true);
  });

  it('ubica el primer día y las etiquetas de mes', () => {
    const days = buildDays('2026-01-01', 365);
    const weeks = buildHeatmapWeeks(days);
    const labels = getHeatmapMonthLabels(weeks);

    expect(getMondayIndex('2026-01-01')).toBe(3);
    expect(weeks[0][3].date).toBe('2026-01-01');
    expect(labels).toHaveLength(12);
    expect(labels[0].month).toBe('01');
    expect(labels[11].month).toBe('12');
  });

  it('cuenta solo días con tiempo efectivo', () => {
    expect(
      getActiveDaysCount([
        { effectiveSeconds: 0 },
        { effectiveSeconds: 60 },
        { effectiveSeconds: 1 }
      ])
    ).toBe(2);
  });
});
