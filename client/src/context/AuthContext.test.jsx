import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AuthProvider } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';
import * as authApi from '../api/auth.js';

vi.mock('../api/auth.js', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  updateMe: vi.fn(),
  changePassword: vi.fn()
}));

function Probe() {
  const auth = useAuth();

  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="email">{auth.user?.email ?? ''}</span>
      <button
        type="button"
        onClick={() => auth.login({ email: 'ana@example.com', password: 'x' })}
      >
        login
      </button>
      <button type="button" onClick={() => auth.logout()}>
        logout
      </button>
      <button
        type="button"
        onClick={() =>
          auth.changePassword({
            currentPassword: 'x',
            newPassword: 'y'
          })
        }
      >
        change-password
      </button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authApi.getMe.mockRejectedValue({ code: 'UNAUTHENTICATED' });
});

afterEach(cleanup);

describe('AuthContext', () => {
  it('carga el usuario autenticado al iniciar', async () => {
    authApi.getMe.mockResolvedValue({
      user: { id: 1, name: 'Ana', email: 'ana@example.com' }
    });

    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    );
    expect(screen.getByTestId('email')).toHaveTextContent('ana@example.com');
  });

  it('queda anónimo si no hay sesión', async () => {
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    );
    expect(screen.getByTestId('email')).toHaveTextContent('');
  });

  it('actualiza el usuario al hacer login', async () => {
    const user = userEvent.setup();
    authApi.login.mockResolvedValue({
      user: { id: 2, name: 'Luis', email: 'luis@example.com' }
    });

    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    );

    await user.click(screen.getByRole('button', { name: 'login' }));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    );
    expect(screen.getByTestId('email')).toHaveTextContent('luis@example.com');
  });

  it('limpia la sesión al hacer logout', async () => {
    const user = userEvent.setup();
    authApi.getMe.mockResolvedValue({
      user: { id: 1, name: 'Ana', email: 'ana@example.com' }
    });
    authApi.logout.mockResolvedValue();

    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    );

    await user.click(screen.getByRole('button', { name: 'logout' }));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    );
    expect(authApi.logout).toHaveBeenCalledTimes(1);
  });

  it('limpia la sesión al cambiar la contraseña', async () => {
    const user = userEvent.setup();
    authApi.getMe.mockResolvedValue({
      user: { id: 1, name: 'Ana', email: 'ana@example.com' }
    });
    authApi.changePassword.mockResolvedValue();

    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated')
    );

    await user.click(screen.getByRole('button', { name: 'change-password' }));

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    );
    expect(authApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'x',
      newPassword: 'y'
    });
  });
});
