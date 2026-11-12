import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { ErrorBoundary } from './ErrorBoundary.jsx';

function Boom() {
  throw new Error('Falla simulada');
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    cleanup();
  });

  it('muestra los hijos cuando no hay errores', () => {
    render(
      <ErrorBoundary>
        <p>Todo bien</p>
      </ErrorBoundary>
    );

    expect(screen.getByText('Todo bien')).toBeInTheDocument();
  });

  it('muestra un mensaje en español cuando un hijo falla', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Recargar la página' })
    ).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
