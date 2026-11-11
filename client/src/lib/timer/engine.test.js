import { describe, expect, it } from 'vitest';

import { buildBreakPlan } from './breakPlan.js';
import {
  abandonSession,
  advanceTimer,
  buildSessionPayload,
  computeTimerMetrics,
  finishFreeSession,
  freezeTimer,
  pauseTimer,
  resumeFrozenTimer,
  resumeTimer,
  skipBreak,
  startFixedSession,
  startFreeSession
} from './engine.js';

const BASE = 1_700_000_000_000;

describe('timer engine - libre', () => {
  it('acumula tiempo efectivo y no suma las pausas', () => {
    let state = startFreeSession({
      clientId: '6f0f1e6d-0f6c-4e9b-9d1c-2f0a7c4b8e11',
      subjectId: 3,
      startedAt: BASE
    });

    expect(computeTimerMetrics(state, BASE + 60_000).effectiveSeconds).toBe(60);

    state = pauseTimer(state, BASE + 60_000);
    expect(state.status).toBe('paused');
    expect(computeTimerMetrics(state, BASE + 600_000).effectiveSeconds).toBe(60);

    state = resumeTimer(state, BASE + 600_000);
    state = finishFreeSession(state, BASE + 630_000);

    expect(state.status).toBe('finished');
    expect(state.finalStatus).toBe('completed');
    expect(computeTimerMetrics(state, BASE + 630_000).effectiveSeconds).toBe(90);

    const payload = buildSessionPayload(state);
    expect(payload).toMatchObject({
      mode: 'free',
      status: 'completed',
      effectiveSeconds: 90
    });
    expect(payload.targetMinutes).toBeUndefined();
  });

  it('congela el estado sin contar el tiempo cerrado', () => {
    const state = startFreeSession({
      clientId: '6f0f1e6d-0f6c-4e9b-9d1c-2f0a7c4b8e11',
      subjectId: 3,
      startedAt: BASE
    });
    const frozen = freezeTimer(state, BASE + 30_000);

    expect(frozen.phaseElapsedMs).toBe(30_000);
    expect(frozen.phaseStartedAt).toBeNull();

    const resumed = resumeFrozenTimer(frozen, BASE + 500_000);
    expect(computeTimerMetrics(resumed, BASE + 510_000).effectiveSeconds).toBe(
      40
    );
  });
});

describe('timer engine - fijo', () => {
  const plan = buildBreakPlan(30, 10);

  function start() {
    return startFixedSession({
      clientId: '6f0f1e6d-0f6c-4e9b-9d1c-2f0a7c4b8e11',
      subjectId: 3,
      plan,
      startedAt: BASE
    });
  }

  it('pasa a descanso y completa todos los bloques', () => {
    let state = start();
    state = advanceTimer(state, BASE + 899_000);

    expect(state.status).toBe('study');
    expect(computeTimerMetrics(state, BASE + 899_000).phaseRemainingSeconds).toBe(
      1
    );

    state = advanceTimer(state, BASE + 901_000);
    expect(state.status).toBe('break');
    expect(state.accumulatedStudyMs).toBe(900_000);
    expect(computeTimerMetrics(state, BASE + 901_000).phaseRemainingSeconds).toBe(
      599
    );

    state = advanceTimer(state, BASE + 1_500_000);
    expect(state.status).toBe('study');
    expect(state.blockIndex).toBe(1);

    state = advanceTimer(state, BASE + 2_400_000);
    expect(state.status).toBe('finished');
    expect(state.finalStatus).toBe('completed');
    expect(state.accumulatedStudyMs).toBe(1_800_000);
    expect(state.endedAt).toBe(BASE + 2_400_000);

    const payload = buildSessionPayload(state);
    expect(payload).toMatchObject({
      mode: 'fixed',
      status: 'completed',
      targetMinutes: 30,
      breakMinutes: 10,
      breakCount: 1,
      effectiveSeconds: 1800
    });
  });

  it('salta un descanso sin sumar sus segundos', () => {
    let state = start();
    state = advanceTimer(state, BASE + 950_000);
    state = skipBreak(state, BASE + 1_000_000);

    expect(state.status).toBe('study');
    expect(state.blockIndex).toBe(1);
    expect(computeTimerMetrics(state, BASE + 1_000_000).effectiveSeconds).toBe(
      900
    );
  });

  it('abandona durante el estudio con el efectivo real', () => {
    let state = start();
    state = advanceTimer(state, BASE + 950_000);
    state = skipBreak(state, BASE + 1_000_000);
    state = abandonSession(state, BASE + 1_500_000);

    expect(state.status).toBe('finished');
    expect(state.finalStatus).toBe('abandoned');
    expect(computeTimerMetrics(state, BASE + 1_500_000).effectiveSeconds).toBe(
      1400
    );
    expect(buildSessionPayload(state).status).toBe('abandoned');
  });

  it('abandona durante el descanso sin acreditar el descanso', () => {
    let state = start();
    state = advanceTimer(state, BASE + 1_000_000);
    state = abandonSession(state, BASE + 1_100_000);

    expect(state.status).toBe('finished');
    expect(state.finalStatus).toBe('abandoned');
    expect(state.accumulatedStudyMs).toBe(900_000);
  });

  it('completa el plan completo si el tick llega tarde', () => {
    const state = advanceTimer(start(), BASE + 10_000_000);

    expect(state.status).toBe('finished');
    expect(state.finalStatus).toBe('completed');
    expect(state.accumulatedStudyMs).toBe(1_800_000);
    expect(state.endedAt).toBe(BASE + 2_400_000);
  });
});
