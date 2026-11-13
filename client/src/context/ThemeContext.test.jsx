import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

import { ThemeProvider } from './ThemeContext.jsx';
import { useTheme } from './useTheme.js';
import { THEME_STORAGE_KEY } from '../lib/theme.js';

function Consumer() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button type="button" onClick={toggleTheme}>
        Alternar
      </button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'light');
  });

  afterEach(() => {
    cleanup();
  });

  it('toma el tema que ya está aplicado en el documento', () => {
    document.documentElement.setAttribute('data-theme', 'dark');

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('alterna el tema y lo persiste', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('light');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Alternar' }));
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Alternar' }));
    });

    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('falla con un mensaje claro si se usa fuera del provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<Consumer />)).toThrow(
      'useTheme debe usarse dentro de ThemeProvider.'
    );

    consoleError.mockRestore();
  });
});
