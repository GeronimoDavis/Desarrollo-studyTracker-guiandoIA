import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Dashboard } from './Dashboard.jsx';
import { useAuth } from '../context/useAuth.js';
import { useDashboard } from '../hooks/useDashboard.js';
import { useHeatmap } from '../hooks/useHeatmap.js';

vi.mock('../context/useAuth.js', () => ({
  useAuth: vi.fn()
}));

vi.mock('../hooks/useDashboard.js', () => ({
  useDashboard: vi.fn()
}));

vi.mock('../hooks/useHeatmap.js', () => ({
  useHeatmap: vi.fn()
}));

const user = {
  name: 'Ana',
  timezone: 'America/Argentina/Buenos_Aires'
};

const session = {
  id: 1,
  subjectId: 1,
  sessionDate: '2026-11-11',
  effectiveSeconds: 3600,
  startedAt: '2026-11-11T12:00:00.000Z',
  mode: 'free',
  status: 'completed',
  subject: { id: 1, name: 'Matemática', color: '#6366F1' }
};

const subject = {
  subjectId: 1,
  name: 'Matemática',
  color: '#6366F1',
  effectiveSeconds: 3600,
  effectiveMinutes: 60,
  sessions: 1
};

const report = {
  period: 'week',
  startDate: '2026-11-09',
  endDate: '2026-11-15',
  totalSeconds: 3600,
  totalMinutes: 60,
  sessions: 1,
  days: [
    { date: '2026-11-09', effectiveSeconds: 0, effectiveMinutes: 0 },
    { date: '2026-11-10', effectiveSeconds: 0, effectiveMinutes: 0 },
    { date: '2026-11-11', effectiveSeconds: 3600, effectiveMinutes: 60 }
  ],
  subjects: [subject],
  extremes: {
    most: { date: '2026-11-11', effectiveSeconds: 3600, effectiveMinutes: 60 },
    least: { date: '2026-11-11', effectiveSeconds: 3600, effectiveMinutes: 60 }
  }
};

const heatmap = {
  year: 2026,
  threshold: [60, 120, 240, 480],
  totalSeconds: 3600,
  activeDays: 1,
  days: [
    {
      date: '2026-11-10',
      effectiveSeconds: 0,
      level: 0,
      isFuture: false
    },
    {
      date: '2026-11-11',
      effectiveSeconds: 3600,
      level: 4,
      isFuture: false
    },
    {
      date: '2026-11-12',
      effectiveSeconds: 0,
      level: null,
      isFuture: true
    }
  ]
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({ user });
    vi.mocked(useHeatmap).mockReturnValue({
      heatmap,
      loading: false,
      error: null,
      reload: vi.fn()
    });
  });

  it('muestra el resumen diario, período, racha y heatmap', () => {
    vi.mocked(useDashboard).mockReturnValue({
      today: {
        date: '2026-11-11',
        totalSeconds: 3600,
        totalMinutes: 60,
        sessions: 1,
        subjects: [subject]
      },
      report,
      streak: {
        current: 1,
        best: 1,
        today: '2026-11-11',
        lastCompletedDate: '2026-11-11'
      },
      sessions: [session],
      todaySessions: [session],
      loading: false,
      error: null,
      reload: vi.fn()
    });

    renderDashboard();

    expect(screen.getByText('Hola, Ana')).toBeInTheDocument();
    expect(screen.getByText('Estudiaste hoy. ¡Mantené la racha!')).toBeInTheDocument();
    expect(screen.getByText('Estudio por día')).toBeInTheDocument();
    expect(screen.getByText('Por materia')).toBeInTheDocument();
    expect(screen.getByText('Día con más estudio')).toBeInTheDocument();
    expect(screen.getByText('Tu año de estudio')).toBeInTheDocument();
    expect(screen.getByText(/día activo/)).toBeInTheDocument();
  });

  it('muestra estados vacíos claros', () => {
    vi.mocked(useDashboard).mockReturnValue({
      today: {
        date: '2026-11-11',
        totalSeconds: 0,
        totalMinutes: 0,
        sessions: 0,
        subjects: []
      },
      report: {
        ...report,
        totalSeconds: 0,
        totalMinutes: 0,
        sessions: 0,
        days: report.days.map((day) => ({ ...day, effectiveSeconds: 0 })),
        subjects: [],
        extremes: { most: null, least: null }
      },
      streak: {
        current: 0,
        best: 0,
        today: '2026-11-11',
        lastCompletedDate: null
      },
      sessions: [],
      todaySessions: [],
      loading: false,
      error: null,
      reload: vi.fn()
    });
    vi.mocked(useHeatmap).mockReturnValue({
      heatmap: { ...heatmap, totalSeconds: 0, activeDays: 0, days: [] },
      loading: false,
      error: null,
      reload: vi.fn()
    });

    renderDashboard();

    expect(screen.getByText('Todavía no estudiaste hoy')).toBeInTheDocument();
    expect(
      screen.getByText('Empezá una sesión para iniciar tu racha.')
    ).toBeInTheDocument();
    expect(screen.getByText('Sin sesiones en este período')).toBeInTheDocument();
    expect(screen.getByText('Sin materias para mostrar')).toBeInTheDocument();
    expect(screen.getAllByText('Sin datos suficientes en el período.')).toHaveLength(2);
  });
});
