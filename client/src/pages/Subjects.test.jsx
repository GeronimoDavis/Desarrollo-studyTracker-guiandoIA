import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

import { Subjects } from './Subjects.jsx';
import { useSubjects } from '../hooks/useSubjects.js';

vi.mock('../hooks/useSubjects.js', () => ({
  useSubjects: vi.fn()
}));

const hook = {
  subjects: [],
  loading: false,
  error: null,
  reload: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  restore: vi.fn()
};

function renderSubjects() {
  return render(
    <MemoryRouter>
      <Subjects />
    </MemoryRouter>
  );
}

beforeEach(() => {
  hook.subjects = [];
  hook.loading = false;
  hook.error = null;
  hook.reload.mockReset();
  hook.create.mockReset();
  hook.update.mockReset();
  hook.remove.mockReset();
  hook.restore.mockReset();
  hook.create.mockResolvedValue({ id: 1 });
  hook.update.mockResolvedValue({ id: 1 });
  hook.remove.mockResolvedValue({ deleted: false, subject: null });
  hook.restore.mockResolvedValue({ id: 1 });
  useSubjects.mockReturnValue(hook);
});

afterEach(cleanup);

describe('Subjects', () => {
  it('muestra el estado vacío y permite crear una materia', async () => {
    const user = userEvent.setup();
    renderSubjects();

    expect(
      screen.getByText('Todavía no tenés materias activas')
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Crear mi primera materia' })
    );

    expect(
      screen.getByRole('heading', { name: 'Nueva materia' })
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText('Nombre'), 'Matemática');
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));

    await waitFor(() =>
      expect(hook.create).toHaveBeenCalledWith({
        name: 'Matemática',
        color: '#6366F1',
        description: null
      })
    );
  });

  it('lista materias activas y archivadas y confirma acciones', async () => {
    const user = userEvent.setup();
    hook.subjects = [
      {
        id: 1,
        name: 'Matemática',
        color: '#6366F1',
        description: 'Álgebra',
        isArchived: false
      },
      {
        id: 2,
        name: 'Historia',
        color: '#F59E0B',
        description: 'Siglo XX',
        isArchived: true
      }
    ];

    renderSubjects();

    expect(screen.getByText('Matemática')).toBeInTheDocument();
    expect(screen.getByText('Archivadas (1)')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Archivar' }));

    let dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Archivar materia' })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Archivar' }));

    await waitFor(() => expect(hook.remove).toHaveBeenCalledWith(1));

    await user.click(screen.getByRole('button', { name: 'Restaurar' }));

    dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Restaurar materia' })
    ).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Restaurar' }));

    await waitFor(() => expect(hook.restore).toHaveBeenCalledWith(2));
  });

  it('muestra el error de carga y permite reintentar', async () => {
    const user = userEvent.setup();
    hook.error = new Error('No se pudieron cargar las materias.');

    renderSubjects();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudieron cargar las materias.'
    );

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(hook.reload).toHaveBeenCalled();
  });
});
