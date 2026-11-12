import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import { Settings } from './Settings.jsx';
import { useAuth } from '../context/useAuth.js';
import { useToast } from '../context/useToast.js';
import { useSettings } from '../hooks/useSettings.js';

vi.mock('../context/useAuth.js', () => ({
  useAuth: vi.fn()
}));

vi.mock('../context/useToast.js', () => ({
  useToast: vi.fn()
}));

vi.mock('../hooks/useSettings.js', () => ({
  useSettings: vi.fn()
}));

const user = {
  name: 'Ana',
  email: 'ana@example.com',
  timezone: 'America/Argentina/Buenos_Aires'
};

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  );
}

describe('Settings', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      logout: vi.fn()
    });
    vi.mocked(useToast).mockReturnValue({ showToast: vi.fn() });
    vi.mocked(useSettings).mockReturnValue({
      thresholds: [60, 120, 240, 480],
      loading: false,
      error: null,
      saving: false,
      save: vi.fn(),
      reload: vi.fn()
    });
  });

  it('muestra las secciones de perfil, heatmap, seguridad y sesión', () => {
    renderSettings();

    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.getByText('Heatmap')).toBeInTheDocument();
    expect(screen.getByText('Seguridad')).toBeInTheDocument();
    expect(screen.getByText('Sesión')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('readonly');
    expect(screen.getByLabelText('Umbral 1')).toHaveValue(60);
    expect(screen.getByLabelText('Umbral 4')).toHaveValue(480);
  });

  it('guarda el perfil con el nombre y la zona horaria', () => {
    const updateProfile = vi.fn();
    vi.mocked(useAuth).mockReturnValue({
      user,
      updateProfile,
      changePassword: vi.fn(),
      logout: vi.fn()
    });

    renderSettings();

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Ana María' }
    });
    fireEvent.change(screen.getByLabelText('Zona horaria'), {
      target: { value: 'UTC' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(updateProfile).toHaveBeenCalledWith({
      name: 'Ana María',
      timezone: 'UTC'
    });
  });

  it('rechaza umbrales que no están en orden ascendente', () => {
    const save = vi.fn();
    vi.mocked(useSettings).mockReturnValue({
      thresholds: [60, 120, 240, 480],
      loading: false,
      error: null,
      saving: false,
      save,
      reload: vi.fn()
    });

    renderSettings();

    fireEvent.change(screen.getByLabelText('Umbral 2'), {
      target: { value: '30' }
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar umbrales' }));

    expect(
      screen.getByText('Los umbrales deben estar en orden ascendente.')
    ).toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
  });

  it('valida la confirmación de la contraseña nueva', () => {
    renderSettings();

    fireEvent.change(screen.getByLabelText('Contraseña actual'), {
      target: { value: 'Password1!' }
    });
    fireEvent.change(screen.getByLabelText('Contraseña nueva'), {
      target: { value: 'Password2!' }
    });
    fireEvent.change(screen.getByLabelText('Confirmar contraseña nueva'), {
      target: { value: 'Password3!' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Cambiar contraseña' })
    );

    expect(
      screen.getByText('Las contraseñas no coinciden.')
    ).toBeInTheDocument();
  });
});
