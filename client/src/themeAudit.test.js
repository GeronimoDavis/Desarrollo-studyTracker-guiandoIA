import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(srcDir, 'index.css');

// Clases de color que se usan sin equivalente oscuro a propósito:
// - acentos (verde/rojo) que ya contrastan sobre fondo oscuro;
// - superficies used como overlay (`bg-slate-900/40`) o dentro de variantes
//   `dark:` que la auditoría excluye;
// - `text-white` y `border-white`, que se usan sobre botones verdes, overlays
//   oscuros y muestras de color.
const ALLOWED_WITHOUT_DARK = new Set([
  'bg-emerald-300',
  'bg-emerald-500',
  'bg-emerald-600',
  'bg-emerald-700',
  'bg-rose-600',
  'bg-rose-700',
  'bg-slate-800',
  'bg-slate-900',
  'bg-slate-900/40',
  'bg-slate-900/45',
  'border-slate-700',
  'border-white',
  'text-white'
]);

const COLOR_CLASS =
  /((?:[a-z-]+:)*)(bg|text|border|ring|divide|stroke|fill|placeholder)-(white|black|slate|emerald|rose|amber|red|green|sky|indigo|gray|zinc|neutral|stone)(-\d{2,3})?(\/\d{1,3})?/g;

function collectFiles(dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath));
      continue;
    }

    if (!/\.(js|jsx)$/.test(entry.name) || /\.test\.[jt]sx?$/.test(entry.name)) {
      continue;
    }

    files.push(fullPath);
  }

  return files;
}

function escapeForCss(className) {
  return className.replace('/', '\\/');
}

describe('auditoría de tema oscuro', () => {
  it('toda clase de color tiene equivalente oscuro en index.css', () => {
    const css = readFileSync(cssPath, 'utf8');
    const darkBlock = css.slice(css.indexOf(':root[data-theme="dark"] {'));
    const missing = new Map();

    for (const file of collectFiles(srcDir)) {
      const content = readFileSync(file, 'utf8');
      let match;

      COLOR_CLASS.lastIndex = 0;

      while ((match = COLOR_CLASS.exec(content)) !== null) {
        const [, variants, utility, color, shade, opacity] = match;

        // Las variantes `dark:` son el equivalente oscuro: no se auditan.
        if (variants.includes('dark:')) {
          continue;
        }

        const className = `${utility}-${color}${shade ?? ''}${opacity ?? ''}`;

        if (ALLOWED_WITHOUT_DARK.has(className)) {
          continue;
        }

        if (darkBlock.includes(`.${escapeForCss(className)}`)) {
          continue;
        }

        if (!missing.has(className)) {
          missing.set(className, path.relative(srcDir, file));
        }
      }
    }

    expect(
      [...missing.entries()].map(
        ([className, file]) => `${className} (${file})`
      )
    ).toEqual([]);
  });
});
