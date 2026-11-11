export const TIMER_STATUS = {
  STUDY: 'study',
  PAUSED: 'paused',
  BREAK: 'break',
  FINISHED: 'finished'
};

const ACTIVE_STATUSES = [
  TIMER_STATUS.STUDY,
  TIMER_STATUS.PAUSED,
  TIMER_STATUS.BREAK
];

export function isTimerActive(state) {
  return Boolean(state && ACTIVE_STATUSES.includes(state.status));
}

export function isTimerFinished(state) {
  return state?.status === TIMER_STATUS.FINISHED;
}

export function startFreeSession({
  clientId,
  subjectId,
  startedAt = Date.now(),
  gapMs = 0
}) {
  return {
    status: TIMER_STATUS.STUDY,
    mode: 'free',
    clientId,
    subjectId,
    plan: null,
    blockIndex: 0,
    accumulatedStudyMs: 0,
    phaseElapsedMs: 0,
    phaseStartedAt: startedAt,
    startedAt,
    endedAt: null,
    finalStatus: null,
    gapMs
  };
}

export function startFixedSession({
  clientId,
  subjectId,
  plan,
  startedAt = Date.now(),
  gapMs = 0
}) {
  return {
    status: TIMER_STATUS.STUDY,
    mode: 'fixed',
    clientId,
    subjectId,
    plan,
    blockIndex: 0,
    accumulatedStudyMs: 0,
    phaseElapsedMs: 0,
    phaseStartedAt: startedAt,
    startedAt,
    endedAt: null,
    finalStatus: null,
    gapMs
  };
}

export function getPhaseElapsedMs(state, now = Date.now()) {
  if (!state || state.status === TIMER_STATUS.FINISHED) {
    return 0;
  }

  const base = state.phaseElapsedMs ?? 0;

  if (state.phaseStartedAt === null || state.phaseStartedAt === undefined) {
    return base;
  }

  return base + Math.max(0, now - state.phaseStartedAt);
}

function getStudyBlockMs(state) {
  if (state.mode !== 'fixed' || !state.plan) {
    return Number.POSITIVE_INFINITY;
  }

  return state.plan.blocks[state.blockIndex].studySeconds * 1000;
}

function getBreakBlockMs(state) {
  if (state.mode !== 'fixed' || !state.plan) {
    return 0;
  }

  return state.plan.blocks[state.blockIndex].breakSeconds * 1000;
}

export function advanceTimer(state, now = Date.now()) {
  if (!state) {
    return state;
  }

  if (state.mode === 'free' || state.status === TIMER_STATUS.PAUSED) {
    return state;
  }

  if (state.status === TIMER_STATUS.FINISHED) {
    return state;
  }

  if (state.mode !== 'fixed' || !state.plan) {
    return state;
  }

  let next = state;
  let guard = 0;

  while (
    guard < 100 &&
    (next.status === TIMER_STATUS.STUDY || next.status === TIMER_STATUS.BREAK)
  ) {
    guard += 1;
    const elapsedMs = getPhaseElapsedMs(next, now);

    if (next.status === TIMER_STATUS.STUDY) {
      const durationMs = next.plan.blocks[next.blockIndex].studySeconds * 1000;

      if (elapsedMs < durationMs) {
        break;
      }

      const boundary = now - elapsedMs + durationMs;
      const isLastBlock =
        next.blockIndex === next.plan.blocks.length - 1;
      const accumulatedStudyMs = next.accumulatedStudyMs + durationMs;

      if (isLastBlock) {
        next = {
          ...next,
          status: TIMER_STATUS.FINISHED,
          accumulatedStudyMs,
          phaseElapsedMs: 0,
          phaseStartedAt: null,
          endedAt: boundary,
          finalStatus: 'completed'
        };
        break;
      }

      next = {
        ...next,
        status: TIMER_STATUS.BREAK,
        accumulatedStudyMs,
        phaseElapsedMs: 0,
        phaseStartedAt: boundary
      };
      continue;
    }

    const breakDurationMs = getBreakBlockMs(next);

    if (breakDurationMs <= 0) {
      next = {
        ...next,
        status: TIMER_STATUS.STUDY,
        blockIndex: next.blockIndex + 1,
        phaseElapsedMs: 0,
        phaseStartedAt: now
      };
      continue;
    }

    if (elapsedMs < breakDurationMs) {
      break;
    }

    const boundary = now - elapsedMs + breakDurationMs;
    next = {
      ...next,
      status: TIMER_STATUS.STUDY,
      blockIndex: next.blockIndex + 1,
      phaseElapsedMs: 0,
      phaseStartedAt: boundary
    };
  }

  return next;
}

export function freezeTimer(state, now = Date.now()) {
  const advanced = advanceTimer(state, now);

  if (
    !advanced ||
    advanced.status === TIMER_STATUS.FINISHED ||
    advanced.status === TIMER_STATUS.PAUSED ||
    advanced.phaseStartedAt === null ||
    advanced.phaseStartedAt === undefined
  ) {
    return advanced;
  }

  return {
    ...advanced,
    phaseElapsedMs: getPhaseElapsedMs(advanced, now),
    phaseStartedAt: null
  };
}

export function resumeFrozenTimer(state, now = Date.now()) {
  if (
    !state ||
    (state.status !== TIMER_STATUS.STUDY &&
      state.status !== TIMER_STATUS.BREAK)
  ) {
    return state;
  }

  return {
    ...state,
    phaseStartedAt: now
  };
}

export function pauseTimer(state, now = Date.now()) {
  if (!state || state.mode !== 'free' || state.status !== TIMER_STATUS.STUDY) {
    return state;
  }

  const elapsedMs = getPhaseElapsedMs(state, now);

  return {
    ...state,
    status: TIMER_STATUS.PAUSED,
    accumulatedStudyMs: state.accumulatedStudyMs + elapsedMs,
    phaseElapsedMs: 0,
    phaseStartedAt: null
  };
}

export function resumeTimer(state, now = Date.now()) {
  if (!state || state.status !== TIMER_STATUS.PAUSED) {
    return state;
  }

  return {
    ...state,
    status: TIMER_STATUS.STUDY,
    phaseElapsedMs: 0,
    phaseStartedAt: now
  };
}

export function skipBreak(state, now = Date.now()) {
  if (!state || state.status !== TIMER_STATUS.BREAK || !state.plan) {
    return state;
  }

  const nextIndex = Math.min(
    state.blockIndex + 1,
    state.plan.blocks.length - 1
  );

  return {
    ...state,
    status: TIMER_STATUS.STUDY,
    blockIndex: nextIndex,
    phaseElapsedMs: 0,
    phaseStartedAt: now
  };
}

export function finishFreeSession(state, now = Date.now()) {
  if (!state || state.mode !== 'free') {
    return state;
  }

  if (
    state.status !== TIMER_STATUS.STUDY &&
    state.status !== TIMER_STATUS.PAUSED
  ) {
    return state;
  }

  const elapsedMs =
    state.status === TIMER_STATUS.STUDY
      ? getPhaseElapsedMs(state, now)
      : 0;

  return {
    ...state,
    status: TIMER_STATUS.FINISHED,
    accumulatedStudyMs: state.accumulatedStudyMs + elapsedMs,
    phaseElapsedMs: 0,
    phaseStartedAt: null,
    endedAt: now,
    finalStatus: 'completed'
  };
}

export function abandonSession(state, now = Date.now()) {
  if (!state || state.mode !== 'fixed') {
    return state;
  }

  const advanced = advanceTimer(state, now);

  if (advanced.status === TIMER_STATUS.FINISHED) {
    return advanced;
  }

  const studyElapsedMs =
    advanced.status === TIMER_STATUS.STUDY
      ? Math.min(getPhaseElapsedMs(advanced, now), getStudyBlockMs(advanced))
      : 0;

  return {
    ...advanced,
    status: TIMER_STATUS.FINISHED,
    accumulatedStudyMs: advanced.accumulatedStudyMs + studyElapsedMs,
    phaseElapsedMs: 0,
    phaseStartedAt: null,
    endedAt: now,
    finalStatus: 'abandoned'
  };
}

export function computeTimerMetrics(state, now = Date.now()) {
  if (!state) {
    return null;
  }

  const phaseElapsedMs = getPhaseElapsedMs(state, now);
  let effectiveMs = state.accumulatedStudyMs ?? 0;

  if (state.status === TIMER_STATUS.STUDY) {
    effectiveMs += Math.min(phaseElapsedMs, getStudyBlockMs(state));
  }

  const wallMs = state.endedAt
    ? state.endedAt - state.startedAt - (state.gapMs ?? 0)
    : now - state.startedAt - (state.gapMs ?? 0);

  const fixedTargetMs =
    state.mode === 'fixed' && state.plan
      ? state.plan.totalStudySeconds * 1000
      : 0;

  let phaseRemainingSeconds = null;
  let phaseDurationSeconds = null;

  if (state.mode === 'fixed' && state.plan) {
    const block = state.plan.blocks[state.blockIndex];

    if (state.status === TIMER_STATUS.STUDY) {
      phaseDurationSeconds = block.studySeconds;
    } else if (state.status === TIMER_STATUS.BREAK) {
      phaseDurationSeconds = block.breakSeconds;
    }

    if (phaseDurationSeconds !== null) {
      phaseRemainingSeconds = Math.max(
        0,
        Math.ceil((phaseDurationSeconds * 1000 - phaseElapsedMs) / 1000)
      );
    }
  }

  return {
    effectiveMs,
    effectiveSeconds: Math.max(0, Math.floor(effectiveMs / 1000)),
    wallSeconds: Math.max(0, Math.floor(wallMs / 1000)),
    phaseElapsedSeconds: Math.max(0, Math.floor(phaseElapsedMs / 1000)),
    phaseRemainingSeconds,
    phaseDurationSeconds,
    progress:
      fixedTargetMs > 0 ? Math.min(1, effectiveMs / fixedTargetMs) : 0,
    blockNumber:
      state.mode === 'fixed' && state.plan
        ? Math.min(state.blockIndex + 1, state.plan.blocks.length)
        : null,
    totalBlocks: state.plan?.blocks.length ?? null,
    currentBlock: state.plan?.blocks[state.blockIndex] ?? null
  };
}

export function buildSessionPayload(state) {
  if (!state || state.status !== TIMER_STATUS.FINISHED) {
    return null;
  }

  const payload = {
    clientId: state.clientId,
    subjectId: state.subjectId,
    mode: state.mode,
    status: state.finalStatus,
    effectiveSeconds: Math.max(
      0,
      Math.floor((state.accumulatedStudyMs ?? 0) / 1000)
    ),
    startedAt: new Date(state.startedAt).toISOString(),
    endedAt: new Date(state.endedAt ?? Date.now()).toISOString()
  };

  if (state.mode === 'fixed' && state.plan) {
    payload.targetMinutes = state.plan.targetMinutes;
    payload.breakMinutes = state.plan.breakMinutes;
    payload.breakCount = state.plan.breakCount;
  }

  return payload;
}
