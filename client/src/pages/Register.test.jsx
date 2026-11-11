import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { Register } from './Register.jsx';
import { useAuth } from '../context/useAuth.js';

vi.mock('../context/useAuth.js', () => ({
  useAuth: vi.fn()
}));

const register = vi.fn();

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div>Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  register.mockReset();
  useAuth.mockReturnValue({ register });
});

afterEach(cleanup);

describe('Register', () => {
  it('valida nombre, email y contraseña', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText('El nombre debe tener al menos 2 caracteres.')
    ).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu email.')).toBeInTheDocument();
    expect(
      screen.getByText('La contraseña debe tener al menos 8 caracteres.')
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('exige que las contraseñas coincidan', async () => {
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1!');
    await user.type(
      screen.getByLabelText('Confirmar contraseña'),
      'Password2!'
    );
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(
      await screen.findByText('Las contraseñas no coinciden.')
    ).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it('registra con la zona horaria detectada y navega al dashboard', async () => {
    const user = userEvent.setup();
    register.mockResolvedValue({ id: 1 });

    renderRegister();

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1!');
    await user.type(
      screen.getByLabelText('Confirmar contraseña'),
      'Password1!'
    );
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() =>
      expect(register).toHaveBeenCalledWith({
        name: 'Ana',
        email: 'ana@example.com',
        password: 'Password1!',
        timezone: expect.any(String)
      })
    );
    expect(await screen.findByText('Dashboard')).toBeInTheDocument();
  });

  it('marca el email cuando ya está registrado', async () => {
    const user = userEvent.setup();
    register.mockRejectedValue({
      code: 'EMAIL_IN_USE',
      message: 'Ya existe una cuenta con ese email.'
    });

    renderRegister();

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Email'), 'ana@example.com');
    await user.type(screen.getByLabelText('Contraseña'), 'Password1!');
    await user.type(
      screen.getByLabelText('Confirmar contraseña'),
      'Password1!'
    );
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ya existe una cuenta con ese email.'
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });
});
