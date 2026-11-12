import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';

import { ToastProvider } from './ToastContext.jsx';
import { useToast } from './useToast.js';

function Trigger() {
  const { showToast } = useToast();

  return (
    <button
      type="button"
      onClick={() => showToast({ message: 'Perfil actualizado.', type: 'success' })}
    >
      Mostrar aviso
    </button>
  );
}

describe('ToastProvider', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra y permite cerrar los avisos', async () => {
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    await act(async () => {
      screen.getByRole('button', { name: 'Mostrar aviso' }).click();
    });

    expect(screen.getByText('Perfil actualizado.')).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Cerrar aviso' }).click();
    });

    expect(screen.queryByText('Perfil actualizado.')).not.toBeInTheDocument();
  });
});
