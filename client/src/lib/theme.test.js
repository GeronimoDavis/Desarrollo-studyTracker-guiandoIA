import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  getNextTheme,
  isTheme,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  applyTheme
} from './theme.js';

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    values,
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value))
  };
}

describe('theme helpers', () => {
  it('reconoce sólo los dos temas válidos', () => {
    expect(isTheme('light')).toBe(true);
    expect(isTheme('dark')).toBe(true);
    expect(isTheme('azul')).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });

  it('resuelve cualquier valor al tema por defecto', () => {
    expect(resolveTheme('dark')).toBe('dark');
    expect(resolveTheme('azul')).toBe(DEFAULT_THEME);
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
  });

  it('lee la preferencia guardada', () => {
    const storage = createStorage({ [THEME_STORAGE_KEY]: 'dark' });

    expect(readStoredTheme(storage)).toBe('dark');
    expect(storage.getItem).toHaveBeenCalledWith(THEME_STORAGE_KEY);
  });

  it('devuelve null cuando no hay preferencia guardada', () => {
    expect(readStoredTheme(createStorage())).toBeNull();
  });

  it('corrige un valor corrupto y usa el tema por defecto', () => {
    const storage = createStorage({ [THEME_STORAGE_KEY]: 'azul' });

    expect(readStoredTheme(storage)).toBe(DEFAULT_THEME);
    expect(storage.setItem).toHaveBeenCalledWith(
      THEME_STORAGE_KEY,
      DEFAULT_THEME
    );
  });

  it('no lanza cuando el almacenamiento falla', () => {
    const broken = {
      getItem: () => {
        throw new Error('bloqueado');
      },
      setItem: () => {
        throw new Error('bloqueado');
      }
    };

    expect(readStoredTheme(broken)).toBeNull();
    expect(writeStoredTheme(broken, 'dark')).toBe(false);
    expect(readStoredTheme(undefined)).toBeNull();
    expect(writeStoredTheme(undefined, 'dark')).toBe(false);
  });

  it('persiste la preferencia', () => {
    const storage = createStorage();

    expect(writeStoredTheme(storage, 'dark')).toBe(true);
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe('dark');

    expect(writeStoredTheme(storage, 'azul')).toBe(true);
    expect(storage.values.get(THEME_STORAGE_KEY)).toBe(DEFAULT_THEME);
  });

  it('aplica el atributo data-theme sobre el documento', () => {
    const root = { setAttribute: vi.fn() };

    expect(applyTheme('dark', root)).toBe('dark');
    expect(root.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');

    expect(applyTheme('azul', root)).toBe(DEFAULT_THEME);
    expect(root.setAttribute).toHaveBeenLastCalledWith(
      'data-theme',
      DEFAULT_THEME
    );
  });

  it('alterna entre los dos temas', () => {
    expect(getNextTheme('light')).toBe('dark');
    expect(getNextTheme('dark')).toBe('light');
    expect(getNextTheme('azul')).toBe('dark');
  });
});
