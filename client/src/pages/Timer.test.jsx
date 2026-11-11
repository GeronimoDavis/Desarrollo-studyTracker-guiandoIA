import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Timer } from './Timer.jsx';
import { useTimer } from '../context/useTimer.js';
import { useSubjects } from '../hooks/useSubjects.js';

vi.mock('../context/useTimer.js', () => ({
  useTimer: vi.fn()
}));

vi.mock('../hooks/useSubjects.js', () => ({
  useSubjects: vi.fn()
}));

const subject = {
  id: 1,
  name: 'Matemática',
  color: '#6366F1',
  isArchived: false
};

function createTimerHook(overrides = {}) {
  return {
    timer: null,
    config: {
      subjectId: '',
      mode: 'free',
      targetMinutes: 60,
      breakMinutes: 5
    },
    updateConfig: vi.fn(),
    metrics: null,
    active: false,
    finished: false,
    notice: null,
    clearNotice: vi.fn(),
    externalActive: false,
    notificationPermission: 'default',
    requestNotifications: vi.fn(),
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    finish: vi.fn(),
    skip: vi.fn(),
    abandon: vi.fn(),
    discard: vi.fn(),
    saving: false,
    saveError: null,
    savedSession: null,
    saveCurrent: vi.fn(),
    retrySave: vi.fn(),
    ...overrides
  };
}

function renderTimer() {
  return render(
    <MemoryRouter>
      <Timer />
    </MemoryRouter>
  );
}

beforeEach(() => {
  useSubjects.mockReturnValue({
    subjects: [subject],
    loading: false,
    error: null,
    reload: vi.fn()
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Timer page', () => {
  it('muestra la configuración y deshabilita iniciar sin materia', () => {
    useTimer.mockReturnValue(createTimerHook());
    renderTimer();

    expect(screen.getByRole('heading', { name: 'Configuración' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Materia'), {
      target: { value: '1' }
    });
    expect(useTimer().updateConfig).toHaveBeenCalledWith({ subjectId: 1 });
  });

  it('resume el plan fijo con bloques y descansos', () => {
    const hook = createTimerHook({
      config: {
        subjectId: 1,
        mode: 'fixed',
        targetMinutes: 60,
        breakMinutes: 5
      }
    });
    useTimer.mockReturnValue(hook);
    renderTimer();

    expect(screen.getByText('4 de estudio')).toBeInTheDocument();
    expect(screen.getByText('3 × 5 min')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeEnabled();
  });

  it('muestra el reloj y los controles de una sesión libre activa', () => {
    useTimer.mockReturnValue(
      createTimerHook({
        timer: {
          status: 'study',
          mode: 'free',
          subjectId: 1,
          finalStatus: null,
          startedAt: Date.now()
        },
        config: {
          subjectId: 1,
          mode: 'free',
          targetMinutes: 60,
          breakMinutes: 5
        },
        active: true,
        metrics: {
          effectiveSeconds: 125,
          wallSeconds: 130,
          progress: 0,
          blockNumber: null,
          totalBlocks: null,
          phaseRemainingSeconds: null
        }
      })
    );
    renderTimer();

    expect(screen.getByText('00:02:05')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pausar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activar avisos del navegador' })).toBeInTheDocument();
  });

  it('avisa cuando hay otra pestaña activa', () => {
    useTimer.mockReturnValue(createTimerHook({ externalActive: true }));
    renderTimer();

    expect(
      screen.getByText(/Hay una sesión activa en otra pestaña/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();
  });
});
