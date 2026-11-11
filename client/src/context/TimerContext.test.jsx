import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from './authContext.js';
import { TimerProvider } from './TimerContext.jsx';
import { useTimer } from './useTimer.js';
import { startFreeSession } from '../lib/timer/engine.js';
import {
  clearSnapshot,
  getSnapshotKey,
  writeSnapshot
} from '../lib/timer/snapshot.js';

const BASE = 1_700_000_000_000;
const USER = { id: 1, name: 'Ana', email: 'ana@example.com' };
const CLIENT_ID = '6f0f1e6d-0f6c-4e9b-9d1c-2f0a7c4b8e11';

function Probe() {
  const timer = useTimer();

  return (
    <div>
      <span data-testid="status">{timer.timer?.status ?? 'none'}</span>
      <span data-testid="effective">{timer.metrics?.effectiveSeconds ?? 0}</span>
      <span data-testid="recovery">
        {timer.recovery?.state.status ?? 'none'}
      </span>
      <button
        type="button"
        onClick={() => timer.updateConfig({ subjectId: 1 })}
      >
        subject
      </button>
      <button type="button" onClick={timer.start}>
        start
      </button>
      <button type="button" onClick={timer.pause}>
        pause
      </button>
      <button type="button" onClick={timer.resume}>
        resume
      </button>
      <button type="button" onClick={timer.finish}>
        finish
      </button>
      <button type="button" onClick={timer.resumeRecovery}>
        resume-recovery
      </button>
      <button type="button" onClick={timer.discardRecovery}>
        discard-recovery
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthContext.Provider value={{ user: USER }}>
      <TimerProvider>
        <Probe />
      </TimerProvider>
    </AuthContext.Provider>
  );
}

function advanceTo(nextTime) {
  act(() => {
    vi.setSystemTime(nextTime - 1000);
    vi.advanceTimersByTime(1000);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  clearSnapshot(USER.id);
  window.localStorage.clear();
  vi.useRealTimers();
});

describe('TimerContext', () => {
  it('inicia, pausa, reanuda y finaliza una sesión libre', () => {
    renderProvider();

    fireEvent.click(screen.getByRole('button', { name: 'subject' }));
    fireEvent.click(screen.getByRole('button', { name: 'start' }));

    expect(screen.getByTestId('status')).toHaveTextContent('study');
    expect(screen.getByTestId('effective')).toHaveTextContent('0');

    advanceTo(BASE + 60_000);
    expect(screen.getByTestId('effective')).toHaveTextContent('60');

    fireEvent.click(screen.getByRole('button', { name: 'pause' }));
    expect(screen.getByTestId('status')).toHaveTextContent('paused');
    expect(screen.getByTestId('effective')).toHaveTextContent('60');

    advanceTo(BASE + 180_000);
    expect(screen.getByTestId('effective')).toHaveTextContent('60');

    fireEvent.click(screen.getByRole('button', { name: 'resume' }));
    advanceTo(BASE + 210_000);
    fireEvent.click(screen.getByRole('button', { name: 'finish' }));

    expect(screen.getByTestId('status')).toHaveTextContent('finished');
    expect(screen.getByTestId('effective')).toHaveTextContent('90');
  });

  it('recupera un snapshot sin contar el tiempo cerrado', () => {
    const state = startFreeSession({
      clientId: CLIENT_ID,
      subjectId: 1,
      startedAt: BASE
    });

    writeSnapshot(USER.id, state, BASE + 30_000);
    vi.setSystemTime(BASE + 130_000);

    renderProvider();

    expect(screen.getByTestId('recovery')).toHaveTextContent('study');

    fireEvent.click(screen.getByRole('button', { name: 'resume-recovery' }));

    expect(screen.getByTestId('status')).toHaveTextContent('study');
    expect(screen.getByTestId('effective')).toHaveTextContent('30');

    advanceTo(BASE + 140_000);
    expect(screen.getByTestId('effective')).toHaveTextContent('40');
  });

  it('descarta un snapshot y limpia el almacenamiento', () => {
    const state = startFreeSession({
      clientId: CLIENT_ID,
      subjectId: 1,
      startedAt: BASE
    });

    writeSnapshot(USER.id, state, BASE + 30_000);
    renderProvider();

    expect(screen.getByTestId('recovery')).toHaveTextContent('study');

    fireEvent.click(screen.getByRole('button', { name: 'discard-recovery' }));

    expect(screen.getByTestId('recovery')).toHaveTextContent('none');
    expect(screen.getByTestId('status')).toHaveTextContent('none');
    expect(window.localStorage.getItem(getSnapshotKey(USER.id))).toBeNull();
  });
});
