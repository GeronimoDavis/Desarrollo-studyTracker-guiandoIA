import { describe, expect, it } from 'vitest';

import {
  FIXED_BREAK_MINUTES,
  FIXED_TARGETS,
  buildBreakPlan,
  expectedBreakCount,
  listBreakPlans
} from './breakPlan.js';

describe('breakPlan', () => {
  it('genera las 18 combinaciones válidas', () => {
    expect(listBreakPlans()).toHaveLength(18);
    expect(expectedBreakCount(30, 5)).toBe(1);
    expect(expectedBreakCount(60, 5)).toBe(3);
    expect(expectedBreakCount(60, 10)).toBe(2);
    expect(expectedBreakCount(60, 15)).toBe(1);
    expect(expectedBreakCount(300, 5)).toBe(15);
    expect(expectedBreakCount(45, 5)).toBeNull();
    expect(expectedBreakCount(60, 7)).toBeNull();
  });

  it('reparte el objetivo y deja el resto en el último bloque', () => {
    const plan = buildBreakPlan(300, 5);

    expect(plan.blocks).toHaveLength(16);
    expect(plan.blocks[0].studySeconds).toBe(1125);
    expect(plan.blocks[15].studySeconds).toBe(1125);
    expect(plan.blocks[15].breakSeconds).toBe(0);
    expect(plan.totalStudySeconds).toBe(18000);
    expect(plan.totalBreakSeconds).toBe(4500);
    expect(plan.totalWallSeconds).toBe(22500);
  });

  it('no deja descanso después del último bloque en ninguna combinación', () => {
    for (const targetMinutes of FIXED_TARGETS) {
      for (const breakMinutes of FIXED_BREAK_MINUTES) {
        const plan = buildBreakPlan(targetMinutes, breakMinutes);
        const lastBlock = plan.blocks[plan.blocks.length - 1];

        expect(plan.blocks).toHaveLength(plan.breakCount + 1);
        expect(lastBlock.breakSeconds).toBe(0);
        expect(
          plan.blocks.reduce((total, block) => total + block.studySeconds, 0)
        ).toBe(targetMinutes * 60);
        expect(
          plan.blocks.reduce((total, block) => total + block.breakSeconds, 0)
        ).toBe(plan.breakCount * breakMinutes * 60);
      }
    }
  });

  it('rechaza combinaciones inválidas', () => {
    expect(() => buildBreakPlan(45, 5)).toThrow();
    expect(() => buildBreakPlan(60, 7)).toThrow();
  });
});
