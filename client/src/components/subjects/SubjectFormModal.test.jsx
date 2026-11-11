import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SubjectFormModal } from './SubjectFormModal.jsx';

const onClose = vi.fn();
const onSubmit = vi.fn();

function renderModal(subject = null) {
  return render(
    <SubjectFormModal
      subject={subject}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

beforeEach(() => {
  onClose.mockReset();
  onSubmit.mockReset();
  onSubmit.mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('SubjectFormModal', () => {
  it('valida el nombre antes de enviar', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: 'Crear materia' }));

    expect(
      await screen.findByText('El nombre debe tener al menos 2 caracteres.')
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('envía nombre, color y descripción normalizados', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('Nombre'), '  Física  ');
    await user.click(
      screen.getByRole('button', { name: 'Color #10B981' })
    );
    await user.type(screen.getByLabelText('Descripción (opcional)'), 'Cinemática');
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Física',
      color: '#10B981',
      description: 'Cinemática'
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('muestra el error de nombre duplicado sin cerrar el formulario', async () => {
    const user = userEvent.setup();
    onSubmit.mockRejectedValue({
      message: 'Ya tenés una materia con ese nombre.',
      code: 'DUPLICATE_NAME'
    });

    renderModal();

    await user.type(screen.getByLabelText('Nombre'), 'Historia');
    await user.click(screen.getByRole('button', { name: 'Crear materia' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya tenés una materia con ese nombre.'
    );
    expect(screen.getAllByText('Ya tenés una materia con ese nombre.').length).toBeGreaterThan(0);
    expect(onClose).not.toHaveBeenCalled();
  });
});
