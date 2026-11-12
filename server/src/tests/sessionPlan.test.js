import { describe, expect, it } from 'vitest';

import {
  FIXED_BREAK_MINUTES,
  FIXED_TARGETS,
  expectedBreakCount,
  isValidFixedPlan
} from '../utils/sessionPlan.js';

describe('fixed session plan', () => {
  it('acepta las 18 combinaciones válidas', () => {
    const plans = FIXED_TARGETS.flatMap((targetMinutes) =>
      FIXED_BREAK_MINUTES.map((breakMinutes) => ({
        targetMinutes,
        breakMinutes,
        breakCount: expectedBreakCount(targetMinutes, breakMinutes)
      }))
    );

    expect(plans).toHaveLength(18);

    for (const plan of plans) {
      expect(plan.breakCount).toBeGreaterThan(0);
      expect(
        isValidFixedPlan(
          plan.targetMinutes,
          plan.breakMinutes,
          plan.breakCount
        )
      ).toBe(true);
    }
  });

  it('calcula la cantidad exacta de descansos', () => {
    expect(expectedBreakCount(30, 5)).toBe(1);
    expect(expectedBreakCount(30, 10)).toBe(1);
    expect(expectedBreakCount(30, 15)).toBe(1);
    expect(expectedBreakCount(60, 5)).toBe(3);
    expect(expectedBreakCount(60, 10)).toBe(2);
    expect(expectedBreakCount(60, 15)).toBe(1);
    expect(expectedBreakCount(300, 5)).toBe(15);
    expect(expectedBreakCount(300, 10)).toBe(10);
    expect(expectedBreakCount(300, 15)).toBe(5);
  });

  it('rechaza objetivos, descansos y cantidades inválidas', () => {
    expect(expectedBreakCount(45, 5)).toBeNull();
    expect(expectedBreakCount(60, 20)).toBeNull();
    expect(isValidFixedPlan(60, 5, 2)).toBe(false);
    expect(isValidFixedPlan(60, 10, 3)).toBe(false);
    expect(isValidFixedPlan(30, 10, 2)).toBe(false);
    expect(isValidFixedPlan(120, 15, 1)).toBe(false);
  });
});
