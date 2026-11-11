import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute.jsx';
import { useAuth } from '../../context/useAuth.js';

vi.mock('../../context/useAuth.js', () => ({
  useAuth: vi.fn()
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div>Contenido privado</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Pantalla de login</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  useAuth.mockReset();
});

afterEach(cleanup);

describe('ProtectedRoute', () => {
  it('muestra carga mientras se resuelve la sesión', () => {
    useAuth.mockReturnValue({ status: 'loading' });

    renderProtected();

    expect(screen.getByText('Cargando tu sesión…')).toBeInTheDocument();
  });

  it('redirige a login sin sesión', () => {
    useAuth.mockReturnValue({ status: 'anonymous' });

    renderProtected();

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('renderiza el contenido con sesión activa', () => {
    useAuth.mockReturnValue({ status: 'authenticated' });

    renderProtected();

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});
