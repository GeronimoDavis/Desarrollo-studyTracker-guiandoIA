import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { SubjectDetail } from './SubjectDetail.jsx';
import { useSubjectSummary } from '../hooks/useSubjectSummary.js';

vi.mock('../hooks/useSubjectSummary.js', () => ({
  useSubjectSummary: vi.fn()
}));

const reload = vi.fn();

function buildSummary(overrides = {}) {
  return {
    subject: {
      id: 1,
      name: 'Matemática',
      color: '#6366F1',
      description: 'Álgebra y análisis',
      isArchived: false
    },
    stats: {
      today: '2026-11-11',
      week: {
        start: '2026-11-09',
        end: '2026-11-15',
        effectiveSeconds: 3600,
        sessions: 2
      },
      month: {
        start: '2026-11-01',
        end: '2026-11-30',
        effectiveSeconds: 7200,
        sessions: 3
      },
      year: {
        start: '2026-01-01',
        end: '2026-12-31',
        effectiveSeconds: 5400,
        sessions: 5
      },
      lastStudyDate: '2026-11-10',
      totalSessions: 5,
      recentSessions: [
        {
          id: 9,
          mode: 'free',
          status: 'completed',
          effectiveSeconds: 1800,
          startedAt: '2026-11-10T12:00:00.000Z',
          sessionDate: '2026-11-10'
        }
      ]
    },
    loading: false,
    error: null,
    reload,
    ...overrides
  };
}

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/subjects/1']}>
      <Routes>
        <Route path="/subjects/:id" element={<SubjectDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  reload.mockReset();
  useSubjectSummary.mockReturnValue(buildSummary());
});

afterEach(cleanup);

describe('SubjectDetail', () => {
  it('muestra los períodos, el último día y las últimas sesiones', () => {
    renderDetail();

    expect(
      screen.getByRole('heading', { name: 'Matemática' })
    ).toBeInTheDocument();
    expect(screen.getByText('Esta semana')).toBeInTheDocument();
    expect(screen.getByText('1 h')).toBeInTheDocument();
    expect(screen.getByText('2 sesiones')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText(/Libre/)).toBeInTheDocument();
    expect(screen.getByText('Completada')).toBeInTheDocument();
  });

  it('muestra el estado vacío de sesiones recientes', () => {
    useSubjectSummary.mockReturnValue(
      buildSummary({
        stats: {
          ...buildSummary().stats,
          recentSessions: []
        }
      })
    );

    renderDetail();

    expect(
      screen.getByText(
        'Todavía no hay sesiones registradas para esta materia.'
      )
    ).toBeInTheDocument();
  });

  it('muestra el error y permite reintentar', async () => {
    const user = userEvent.setup();
    useSubjectSummary.mockReturnValue(
      buildSummary({
        subject: null,
        stats: null,
        error: new Error('No se pudo cargar la materia.')
      })
    );

    renderDetail();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar la materia.'
    );

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(reload).toHaveBeenCalled();
  });
});
