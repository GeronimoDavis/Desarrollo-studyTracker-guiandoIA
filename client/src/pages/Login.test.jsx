import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Login } from './Login.jsx';
import { useAuth } from '../context/useAuth.js';

vi.mock('../context/useAuth.js', () => ({
  useAuth: vi.fn()
}));

const login = vi.fn();

function renderLogin(initialEntries = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<div>Dashboard</div>} />
        <Route path="/timer" element={<div>Temporizador</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  login.mockReset();
  useAuth.mockReturnValue({
    login,
    bootstrapError: null
  });
});

afterEach(cleanup);

describe('Login', () => {
  it('valida campos vacíos antes de llamar a la API', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Ingresá tu email.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu contraseña.')).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it('envía credenciales y navega al dashboard', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ id: 1 });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'Password1!'
      })
    );
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('vuelve a la ruta solicitada después del login', async () => {
    const user = userEvent.setup();
    login.mockResolvedValue({ id: 1 });

    renderLogin([
      {
        pathname: '/login',
        state: { from: { pathname: '/timer', search: '', hash: '' } }
      }
    ]);

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText('Temporizador')).toBeInTheDocument();
  });

  it('muestra el error de la API y los errores por campo', async () => {
    const user = userEvent.setup();
    login.mockRejectedValue({
      message: 'El email o la contraseña son incorrectos.',
      fields: { email: 'Revisá este email.' }
    });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1!');
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El email o la contraseña son incorrectos.'
    );
    expect(await screen.findByText('Revisá este email.')).toBeInTheDocument();
  });
});
