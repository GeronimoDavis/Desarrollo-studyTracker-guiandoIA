# Plan de implementación — 002 Modo oscuro

| Campo | Valor |
| --- | --- |
| ID | 002-tema-oscuro |
| Fecha | 2026-11-13 |
| Spec | `spec.md` (aprobada 2026-11-13) |
| Tareas | `tasks.md` |
| Restricciones | `docs/constitution.md`, `AGENTS.md`, `MEMORY.md` |

---

## 1. Enfoque técnico

El tema se resuelve **sin dependencias nuevas y sin tocar el backend**:

1. **Variante `dark:` por atributo.** Tailwind 4 usa por defecto
   `@media (prefers-color-scheme: dark)`. Como el usuario elige el tema
   explícitamente (fuera de alcance: seguir al SO), se redefine la variante:

   ```css
   @custom-variant dark (&:where([data-theme='dark'], [data-theme='dark'] *));
   ```

   Con esto, `dark:bg-slate-900` aplica exactamente cuando
   `<html data-theme="dark">`.

2. **Una sola fuente de verdad para la UI:** el atributo `data-theme` del
   documento. React no decide los colores; sólo dispara el atributo. Así el
   servidor y la UI nunca pueden discrepar.

3. **Cero destello (FOUC).** Un script **inline** en `index.html` (antes del
   bundle de React) lee la preferencia y setea `data-theme` en el primer pintado:

   ```html
   <script>
     (function () {
       try {
         var stored = localStorage.getItem('study-tracker:theme');
         var theme = stored === 'dark' || stored === 'light' ? stored : 'light';
         document.documentElement.dataset.theme = theme;
       } catch (error) {
         document.documentElement.dataset.theme = 'light';
       }
     })();
   </script>
   ```

4. **Estado en React para la UI del control** (qué ícono mostrar, qué
   `aria-pressed` anunciar), sin duplicar la verdad: `ThemeProvider` lee el
   atributo real del documento al montar y se sincroniza con `matchMedia` sólo
   para detectar cambios de preferencia del sistema **para actualizar el
   `color-scheme`**, nunca para cambiar el tema elegido.

5. **Transición 150–200 ms** con una regla global acotada a propiedades de color
   y desactivada bajo `prefers-reduced-motion: reduce`:

   ```css
   @media (prefers-reduced-motion: no-preference) {
     body * {
       transition-property: background-color, border-color, color, fill, stroke;
       transition-duration: 180ms;
       transition-timing-function: ease;
     }
   }
   ```

   Las utilidades `transition-*` de Tailwind siguen mandando en los elementos
   que las usan (especificidad de clase > `body *`).

6. **`color-scheme` nativo** para que scrollbars y controles del navegador
   acompañen al tema:

   ```css
   :root { color-scheme: light; }
   :root[data-theme='dark'] { color-scheme: dark; }
   ```

7. **Paleta del heatmap.** `HEATMAP_LEVEL_CLASSES` pasa a contener las dos
   variantes en la misma cadena (`'bg-emerald-100 dark:bg-emerald-900'`), de modo
   que un solo array sirve para el heatmap, la leyenda y la vista previa de
   Ajustes.

8. **Mapa de clases (mecanismo general).** Tailwind 4 compila los colores a
   variables CSS (`.bg-white{background-color:var(--color-white)}`), así que el
   tema oscuro se resuelve re-mapeando las clases **por rol** dentro de
   `index.css`, sin tocar los ~45 componentes:

   ```css
   :root[data-theme="dark"] {
     --surface-page: #020617;
     --surface-raised: #0f172a;
     --surface-sunken: #1e293b;
     --text-primary: #f8fafc;
     --text-secondary: #cbd5e1;
     --text-muted: #94a3b8;
     --border-subtle: #1e293b;
     --border-strong: #334155;
     --accent-text: #34d399;
     --accent-surface: #022c22;
     --danger-text: #fda4af;
     --warning-text: #fbbf24;
   }

   :root[data-theme="dark"] .bg-white { background-color: var(--surface-raised); }
   :root[data-theme="dark"] .text-slate-900 { color: var(--text-primary); }
   :root[data-theme="dark"] .border-slate-200 { border-color: var(--border-subtle); }
   ```

   Un test estático (`client/src/themeAudit.test.js`) verifica que toda clase de
   color usada en los componentes tenga su equivalente oscuro o esté en una
   allowlist documentada.

9. **Gráficos SVG.** El anillo de fondo de la dona deja de usar un hex fijo
   (`#E2E8F0`) y pasa a clases `stroke-slate-200`. Los colores por materia
   (`subject.color`) se mantienen: son del usuario y deben ser idénticos en
   ambos temas.

---

## 2. Archivos a crear

| Archivo | Responsabilidad |
| --- | --- |
| `client/src/lib/theme.js` | Funciones puras: clave de storage, valores válidos, lectura/escritura segura, resolución del tema. |
| `client/src/lib/theme.test.js` | Tests de las funciones puras (incluye `localStorage` roto y valores corruptos). |
| `client/src/context/themeContext.js` | Contexto React separado (patrón igual a `authContext.js`). |
| `client/src/context/ThemeContext.jsx` | Provider: expone `theme` y `toggleTheme`, aplica `data-theme`. |
| `client/src/context/useTheme.js` | Hook de consumo con error claro si falta el provider. |
| `client/src/components/theme/ThemeToggle.jsx` | Control interruptor con ícono, `aria-pressed` y tooltip en español. |
| `client/src/components/theme/ThemeToggle.test.jsx` | Test de componente: alterna, anuncia estado y es operable con teclado. |
| `client/src/themeAudit.test.js` | Auditoría estática: detecta clases de color fijas sin variante `dark:` en los archivos auditados. |

## 3. Archivos a modificar

| Archivo | Cambio |
| --- | --- |
| `client/index.html` | Script inline anti-FOUC + `data-theme` inicial en `<html>`. |
| `client/src/index.css` | `@custom-variant dark`, `color-scheme`, transición global y **mapa de clases del tema oscuro** (superficie, texto, borde y acento). |
| `client/src/main.jsx` | Envolver la app con `ThemeProvider`. |
| `client/src/lib/heatmap.js` | Paleta con variantes `dark:` y estilo del día futuro. |
| `client/src/components/theme/ThemeToggle.jsx` | Control interruptor (nuevo). |
| `client/src/components/layout/AppShell.jsx` | Header: montar `ThemeToggle` (escritorio y móvil). |
| `client/src/components/dashboard/SubjectDonut.jsx` | Anillo de fondo con clase en lugar de hex fijo. |
| `client/src/components/dashboard/Heatmap.jsx` | Rótulos de día con contraste suficiente en oscuro. |
| `client/src/themeAudit.test.js` | Auditoría estática de clases sin equivalente oscuro (nuevo). |
| `README.md` | Sección breve de tema claro/oscuro y estado de la spec 002. |
| `MEMORY.md` | Estado, decisiones y aprendizajes de la spec 002. |
| `docs/QA.md` | Evidencia del gate de contraste en modo oscuro. |
| `specs/001-sistema-estudio/tasks.md` | Registrar el cierre de la spec 001 y el inicio de la 002. |

> Los componentes de `layout`, `ui`, `subjects`, `timer`, `dashboard`, `settings`
> y `pages` **no se modifican**: el mapa de clases de `index.css` los cubre. Sólo
> se ajustan los casos con color propio (heatmap, dona, rótulos y toggle).
>
> Nota de esquema: **no hay cambios de base de datos**. `server/` no se toca
> (salvo `docs`), y la API queda intacta (RF-017).

---

## 4. Funciones puras y pseudocódigo

### 4.1 `client/src/lib/theme.js`

```js
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

// Nunca lanza: si localStorage no existe o está bloqueado, devuelve null.
export function readStoredTheme(storage) {
  try {
    const raw = storage?.getItem?.(THEME_STORAGE_KEY) ?? null;
    return raw === null ? null : resolveTheme(raw);
  } catch {
    return null;
  }
}

// Nunca lanza. Devuelve true si pudo persistir.
export function writeStoredTheme(storage, theme) {
  try {
    storage?.setItem?.(THEME_STORAGE_KEY, resolveTheme(theme));
    return true;
  } catch {
    return false;
  }
}

// Aplica el atributo que dispara la variante `dark:` de Tailwind.
export function applyTheme(theme, root) {
  const resolved = resolveTheme(theme);
  root?.setAttribute?.('data-theme', resolved);
  return resolved;
}

export function getNextTheme(theme) {
  return resolveTheme(theme) === 'dark' ? 'light' : 'dark';
}
```

### 4.2 `client/src/context/ThemeContext.jsx`

```jsx
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    resolveTheme(document.documentElement.dataset.theme)
  );

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
```

### 4.3 `client/src/components/theme/ThemeToggle.jsx`

```jsx
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={isDark ? 'Tema claro' : 'Tema oscuro'}
      className="rounded-xl border border-slate-300 bg-white p-2 text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
```

### 4.4 Script inline de `index.html`

```html
<script>
  (function () {
    var theme = 'light';
    try {
      var stored = window.localStorage.getItem('study-tracker:theme');
      if (stored === 'dark' || stored === 'light') {
        theme = stored;
      }
    } catch (error) {
      theme = 'light';
    }
    document.documentElement.setAttribute('data-theme', theme);
  })();
</script>
```

### 4.5 Paleta del heatmap (`client/src/lib/heatmap.js`)

```js
export const HEATMAP_LEVEL_CLASSES = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-emerald-100 dark:bg-emerald-900',
  'bg-emerald-300 dark:bg-emerald-700',
  'bg-emerald-500 dark:bg-emerald-500',
  'bg-emerald-700 dark:bg-emerald-300'
];

export function getHeatmapLevelClass(day) {
  if (day?.isFuture) {
    return 'border border-dashed border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900';
  }
  // ...misma lógica de nivel, devuelve la cadena con ambas variantes
}
```

> Nota: el nivel 4 en oscuro usa un verde claro para mantener el contraste
> sobre fondo oscuro; la escala se lee "más estudio = más claro" en ambos temas.

---

## 5. Decisiones técnicas

| ID | Decisión | Alternativa descartada | Por qué |
| --- | --- | --- | --- |
| **D-01** | Variante `dark:` por atributo `data-theme` | `prefers-color-scheme` | El usuario elige el tema; el SO no debe mandar (fuera de alcance). |
| **D-02** | Preferencia en `localStorage` | Columna en `user_settings` | Evita cambio de esquema y de API; el usuario lo pidió así en la entrevista. |
| **D-03** | Script inline anti-FOUC | Aplicar el tema desde React | React monta después del primer pintado: se vería el destello. |
| **D-04** | `ThemeProvider` mínimo (estado + toggle) | Librería de theming o store global | La constitución pide la solución más simple; no hay dependencias nuevas. |
| **D-05** | Tema oscuro por **mapa de clases en `index.css`**: Tailwind 4 compila los colores a variables CSS, así que se re-mapean `.bg-white`, `.text-slate-900`, `.border-slate-200`, etc. bajo `:root[data-theme="dark"]` | Variante `dark:` literal en cada uno de los ~45 componentes | Tematiza toda la app desde un archivo, sin reescribir componentes; las excepciones con color propio (heatmap, dona) llevan `dark:` explícito. |
| **D-06** | Transición global acotada a colores | Transición por componente | Menos trabajo y resultado uniforme; se desactiva con `prefers-reduced-motion`. |
| **D-07** | Conservar `subject.color` en ambos temas | Re-mapear la paleta por materia | El color es elección del usuario y su identidad no depende del tema. |
| **D-08** | Sin sincronización entre pestañas | Escuchar el evento `storage` | Fuera de alcance (CE-03) y agrega complejidad. |

---

## 6. Estrategia de pruebas

| Nivel | Qué se prueba | Dónde |
| --- | --- | --- |
| Unitario (puro) | `isTheme`, `resolveTheme`, `readStoredTheme`, `writeStoredTheme`, `applyTheme`, `getNextTheme`, valor corrupto, storage que lanza | `client/src/lib/theme.test.js` |
| Unitario (paleta) | Cada nivel del heatmap expone variantes clara y oscura; el día futuro usa bordes neutros | `client/src/lib/heatmap.test.js` (ampliar) |
| Componente | `ThemeToggle` alterna, expone `aria-pressed` y la etiqueta en español, responde al teclado | `client/src/components/theme/ThemeToggle.test.jsx` |
| Contexto | `ThemeProvider` expone `theme`/`toggleTheme` y escribe en `localStorage` | `client/src/context/ThemeContext.test.jsx` |
| Estático (auditoría) | Ningún archivo auditado conserva una clase de color de superficie sin su variante `dark:` (con allowlist explícita) | `client/src/themeAudit.test.js` |
| Visual (gate) | Capturas del dashboard, reportes, temporizador, ajustes y login en ambos temas; sin destello | Script headless + `docs/QA.md` |

Criterio de cierre por fase: `npm test`, `npm run lint` y `npm run build` en verde.

---

## 7. Trazabilidad RF → implementación → prueba

| RF | Implementación | Prueba |
| --- | --- | --- |
| RF-001, RF-002 | `ThemeToggle` + `ThemeProvider` | `ThemeToggle.test.jsx`, `ThemeContext.test.jsx` |
| RF-003, RF-006 | `lib/theme.js` (`writeStoredTheme`) | `theme.test.js` |
| RF-004, RF-005 | `resolveTheme` + script inline | `theme.test.js` |
| RF-007 | script inline en `index.html` | gate headless (captura del primer pintado) + `themeAudit.test.js` |
| RF-008 | `AppShell` | `ThemeToggle.test.jsx` + gate |
| RF-009 | `ThemeToggle` (`aria-pressed`, `aria-label`) | `ThemeToggle.test.jsx` |
| RF-010, RF-011 | `index.css` | gate + revisión manual |
| RF-012 | tareas T6–T12 | `themeAudit.test.js` + gate |
| RF-013 | `lib/heatmap.js` | `heatmap.test.js` |
| RF-014 | `SubjectDonut`, `PeriodBarChart` | `heatmap.test.js` + gate |
| RF-015 | tareas T6–T12 | gate visual |
| RF-016 | `ThemeProvider` sólo toca `data-theme` | `Timer.test.jsx` (no se rompe el temporizador) |
| RF-017 | sin cambios en `server/` | revisión del diff + `npm --prefix server run test` |

---

## 8. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Quedan clases de color sin variante `dark:` (textos ilegibles) | Medio | Tarea de auditoría estática con allowlist + gate visual por pantalla. |
| El script inline se cachea y no refleja una preferencia nueva | Bajo | La clave es estable y el script sólo lee; el toggle escribe siempre. |
| Transición global interfiere con animaciones existentes (`animate-spin`) | Bajo | Sólo se transicionan propiedades de color; las animaciones de transform no se ven afectadas. |
| `localStorage` no disponible | Bajo | Todas las operaciones van envueltas en `try/catch` (CE-02). |
| El cambio de tema interrumpe el temporizador | Alto | `ThemeProvider` sólo escribe un atributo del documento; no toca el estado del timer (RF-016). |
| Scope grande (~45 archivos) | Medio | Tareas por grupo de componentes, cada una con verificación propia. |
