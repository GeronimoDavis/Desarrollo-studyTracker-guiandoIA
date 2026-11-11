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

export function isValidFixedPlan(targetMinutes, breakMinutes) {
  return expectedBreakCount(targetMinutes, breakMinutes) !== null;
}

export function listBreakPlans() {
  return FIXED_TARGETS.flatMap((targetMinutes) =>
    FIXED_BREAK_MINUTES.map((breakMinutes) => ({
      targetMinutes,
      breakMinutes,
      breakCount: expectedBreakCount(targetMinutes, breakMinutes)
    }))
  );
}

export function buildBreakPlan(targetMinutes, breakMinutes) {
  const breakCount = expectedBreakCount(targetMinutes, breakMinutes);

  if (breakCount === null) {
    throw new Error('La combinación de objetivo y descanso no es válida.');
  }

  const totalStudySeconds = targetMinutes * 60;
  const blockCount = breakCount + 1;
  const baseStudySeconds = Math.floor(totalStudySeconds / blockCount);
  const remainderSeconds = totalStudySeconds % blockCount;
  const breakSeconds = breakMinutes * 60;
  const blocks = Array.from({ length: blockCount }, (_, index) => ({
    index,
    studySeconds:
      index === blockCount - 1
        ? baseStudySeconds + remainderSeconds
        : baseStudySeconds,
    breakSeconds: index === blockCount - 1 ? 0 : breakSeconds
  }));

  return {
    targetMinutes,
    breakMinutes,
    breakCount,
    blocks,
    totalStudySeconds,
    totalBreakSeconds: breakCount * breakSeconds,
    totalWallSeconds: totalStudySeconds + breakCount * breakSeconds
  };
}
