export const FIXED_TARGETS = [30, 60, 120, 180, 240, 300];
export const FIXED_BREAK_MINUTES = [5, 10, 15];

export function expectedBreakCount(targetMinutes, breakMinutes) {
  if (
    !FIXED_TARGETS.includes(targetMinutes) ||
    !FIXED_BREAK_MINUTES.includes(breakMinutes)
  ) {
    return null;
  }

  if (targetMinutes === 30) {
    return 1;
  }

  if (breakMinutes === 5) {
    return targetMinutes / 20;
  }

  if (breakMinutes === 10) {
    return targetMinutes / 30;
  }

  return targetMinutes / 60;
}

export function isValidFixedPlan(targetMinutes, breakMinutes, breakCount) {
  const expected = expectedBreakCount(targetMinutes, breakMinutes);

  return expected !== null && breakCount === expected;
}

export function listFixedPlans() {
  return FIXED_TARGETS.flatMap((targetMinutes) =>
    FIXED_BREAK_MINUTES.map((breakMinutes) => ({
      targetMinutes,
      breakMinutes,
      breakCount: expectedBreakCount(targetMinutes, breakMinutes)
    }))
  );
}
