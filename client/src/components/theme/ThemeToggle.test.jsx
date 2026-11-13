import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ThemeToggle } from './ThemeToggle.jsx';
import { ThemeProvider } from '../../context/ThemeContext.jsx';
import { THEME_STORAGE_KEY } from '../../lib/theme.js';

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'light');
  });

  afterEach(() => {
    cleanup();
  });

  it('anuncia el tema activo y la acción disponible en español', () => {
    renderToggle();

    const button = screen.getByRole('button', {
      name: 'Cambiar a tema oscuro'
    });

    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('alterna el tema al activarlo', () => {
    renderToggle();

    fireEvent.click(
      screen.getByRole('button', { name: 'Cambiar a tema oscuro' })
    );

    expect(
      screen.getByRole('button', { name: 'Cambiar a tema claro' })
    ).toHaveAttribute('aria-pressed', 'true');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('se puede activar con el teclado', () => {
    renderToggle();

    const button = screen.getByRole('button', {
      name: 'Cambiar a tema oscuro'
    });

    button.focus();
    expect(button).toHaveFocus();

    fireEvent.keyDown(button, { key: 'Enter' });
    fireEvent.click(button);

    expect(
      screen.getByRole('button', { name: 'Cambiar a tema claro' })
    ).toBeInTheDocument();
  });
});
