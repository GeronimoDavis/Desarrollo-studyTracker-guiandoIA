export const THEME_STORAGE_KEY = 'study-tracker:theme';
export const DEFAULT_THEME = 'light';
export const THEMES = ['light', 'dark'];
export const TRANSITION_MS = 180;

export function isTheme(value) {
  return THEMES.includes(value);
}

export function resolveTheme(value) {
  return isTheme(value) ? value : DEFAULT_THEME;
}

// Nunca lanza: si `localStorage` no existe o está bloqueado devuelve `null`.
export function readStoredTheme(storage) {
  if (typeof storage?.getItem !== 'function') {
    return null;
  }

  let raw = null;

  try {
    raw = storage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }

  if (raw === null || raw === undefined) {
    return null;
  }

  if (isTheme(raw)) {
    return raw;
  }

  // Valor corrupto: se usa el tema por defecto y se corrige lo guardado.
  writeStoredTheme(storage, DEFAULT_THEME);

  return DEFAULT_THEME;
}

// Nunca lanza. Devuelve `true` si pudo persistir la preferencia.
export function writeStoredTheme(storage, theme) {
  if (typeof storage?.setItem !== 'function') {
    return false;
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, resolveTheme(theme));
    return true;
  } catch {
    return false;
  }
}

// El atributo `data-theme` del documento es la fuente de verdad para la UI:
// dispara la variante `dark:` de Tailwind.
export function applyTheme(theme, root) {
  const resolved = resolveTheme(theme);

  root?.setAttribute?.('data-theme', resolved);

  return resolved;
}

export function getNextTheme(theme) {
  return resolveTheme(theme) === 'dark' ? 'light' : 'dark';
}
