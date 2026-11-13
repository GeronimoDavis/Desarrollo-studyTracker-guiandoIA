import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  DEFAULT_THEME,
  applyTheme,
  getNextTheme,
  resolveTheme,
  writeStoredTheme
} from '../lib/theme.js';
import { ThemeContext } from './themeContext.js';

function readDocumentTheme() {
  if (typeof document === 'undefined') {
    return DEFAULT_THEME;
  }

  return resolveTheme(document.documentElement.getAttribute('data-theme'));
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readDocumentTheme);

  useEffect(() => {
    applyTheme(theme, document.documentElement);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = getNextTheme(current);

      writeStoredTheme(window.localStorage, next);

      return next;
    });
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
