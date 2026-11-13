# Tareas — 002 Modo oscuro

| Campo | Valor |
| --- | --- |
| ID | 002-tema-oscuro |
| Fecha | 2026-11-13 |
| Spec | `spec.md` (aprobada 2026-11-13) |
| Plan | `plan.md` |
| Regla | Cada tarea dura 20–30 min, se cierra con sus tests en verde y se marca `[x]` al completarse. |

> **Nota de implementación (2026-11-13):** el tema oscuro se resolvió con un
> **mapa de clases en `client/src/index.css`** (Tailwind 4 compila los colores a
> variables CSS, así que re-mapear `.bg-white`, `.text-slate-900`, etc. bajo
> `:root[data-theme="dark"]` tematiza toda la app sin editar cada componente).
> Por eso las tareas de barrido (T11–T19) son de **verificación por grupo** con
> el gate de contraste, y no de escritura de variantes `dark:` en cada archivo.
> Sólo llevan `dark:` explícito los casos con color propio: heatmap, dona y el
> control de tema.

---

## Fase A — Base técnica del tema

- [x] **T1.** Crear `client/src/lib/theme.js` con las funciones puras `THEME_STORAGE_KEY`, `DEFAULT_THEME`, `THEMES`, `TRANSITION_MS`, `isTheme`, `resolveTheme`, `readStoredTheme`, `writeStoredTheme`, `applyTheme` y `getNextTheme`. | — | RF-003, RF-004, RF-005, RF-006 | Hecho cuando: el módulo existe, no importa React ni el DOM y todas las operaciones sobre `localStorage` capturan excepciones.
- [x] **T2.** Escribir `client/src/lib/theme.test.js` cubriendo: valor por defecto `light`, valor corrupto (`"azul"`, `""`, objeto) → `light`, `localStorage` que lanza al leer y al escribir, `applyTheme` fija `data-theme` y `getNextTheme` alterna. | T1 | RF-003..RF-006 | Hecho cuando: los tests pasan y `npm --prefix client run test` queda en verde.
- [x] **T3.** Crear `client/src/context/themeContext.js`, `client/src/context/ThemeContext.jsx` y `client/src/context/useTheme.js`: provider que lee `document.documentElement.dataset.theme` al montar, expone `theme` y `toggleTheme`, escribe la preferencia y aplica el atributo. Envolver la app en `client/src/main.jsx`. | T1 | RF-002, RF-003, RF-007, RF-016 | Hecho cuando: la app monta sin errores y el contexto expone `theme`/`toggleTheme`.
- [x] **T4.** Escribir `client/src/context/ThemeContext.test.jsx`: el provider inicializa con el tema del documento, `toggleTheme` alterna y persiste en `localStorage`, y `useTheme` fuera del provider lanza un error claro. | T3 | RF-002, RF-003 | Hecho cuando: los tests pasan sin depender del servidor.
- [x] **T5.** Modificar `client/index.html` con el script inline anti-destello y `data-theme` inicial en `<html>`; modificar `client/src/index.css` con `@custom-variant dark`, `color-scheme` por tema y la transición global de 180 ms acotada a colores y desactivada con `prefers-reduced-motion: reduce`. | T1 | RF-007, RF-010, RF-011 | Hecho cuando: al cargar con `dark` guardado, el primer pintado ya es oscuro y no hay destello.

## Fase B — Control de tema

- [x] **T6.** Crear `client/src/components/theme/ThemeToggle.jsx`: botón interruptor con ícono de sol/luna, `aria-pressed`, `aria-label` en español y tooltip; estilos con variante `dark:`. | T3 | RF-001, RF-002, RF-009 | Hecho cuando: el control alterna el tema y anuncia su estado a lectores de pantalla.
- [x] **T7.** Escribir `client/src/components/theme/ThemeToggle.test.jsx`: alterna al hacer clic, responde al teclado (Enter/Espacio), expone `aria-pressed` y la etiqueta correcta en cada estado. | T6 | RF-001, RF-002, RF-009 | Hecho cuando: los tests pasan.
- [x] **T8.** Montar `ThemeToggle` en el header de `client/src/components/layout/AppShell.jsx` (visible en escritorio y en móvil, junto al logout). | T6 | RF-008 | Hecho cuando: el control aparece en el encabezado en ambos tamaños de pantalla.

## Fase C — Paleta de datos y gráficos

- [x] **T9.** Actualizar `client/src/lib/heatmap.js` para que `HEATMAP_LEVEL_CLASSES` incluya las variantes clara y oscura de los cinco niveles y el estilo del día futuro sea neutro en ambos temas; ampliar `client/src/lib/heatmap.test.js` para verificar que cada nivel expone ambas variantes. | T5 | RF-013 | Hecho cuando: los tests verifican que ninguna cadena de nivel queda sin variante `dark:`.
- [x] **T10.** Ajustar `client/src/components/dashboard/SubjectDonut.jsx` (anillo de fondo con clases `stroke-slate-200` en lugar de hex fijo) y `PeriodBarChart.jsx` (ejes, etiquetas y tooltips legibles en oscuro), conservando el color de cada materia. | T5 | RF-014, RF-015 | Hecho cuando: la dona y las barras se leen igual en ambos temas y el color de la materia no cambia.

## Fase D — Verificación por grupo de pantallas

- [x] **T11.** Layout: verificar en oscuro `AppShell`, `Sidebar`, `BottomNav`, `NavIcon`, `RouteErrorElement` y `ErrorBoundary` (fondos, textos, bordes y estados). | T5 | RF-012, RF-015 | Hecho cuando: el esqueleto de la app se ve correcto en claro y en oscuro.
- [x] **T12.** Base de UI: verificar en oscuro `Button`, `EmptyState`, `ErrorBanner`, `FormField`, `Spinner` y `AuthLayout` (variantes de botón, estados, campos y foco). | T5 | RF-012, RF-015 | Hecho cuando: botones, campos, banners y estados vacíos son legibles en ambos temas.
- [x] **T13.** Login y registro: verificar en oscuro `pages/Login.jsx`, `pages/Register.jsx` y `components/layout/AuthLayout.jsx`, respetando el tema aplicado antes del pintado. | T12 | RF-006, RF-012 | Hecho cuando: login y registro se ven en oscuro si la preferencia guardada es `dark`.
- [x] **T14.** Materias: verificar en oscuro `pages/Subjects.jsx`, `pages/SubjectDetail.jsx`, `SubjectCard`, `SubjectFormModal` y `ConfirmDialog`, sin cambiar el color elegido por el usuario. | T11, T12 | RF-012, RF-015 | Hecho cuando: listado, detalle, formulario y confirmación son legibles en ambos temas.
- [x] **T15.** Temporizador (controles): verificar en oscuro `TimerDisplay`, `TimerControls`, `ProgressPanel`, `SubjectSelector`, `ModeTabs`, `DurationPicker` y `BreakPlanPicker`. | T11, T12 | RF-012, RF-015, RF-016 | Hecho cuando: la pantalla del temporizador es legible en ambos temas sin tocar la lógica del cronómetro.
- [x] **T16.** Temporizador (diálogos): verificar en oscuro `RecoveryDialog`, `SessionSummaryDialog`, `TimerNavigationGuard` y `pages/Timer.jsx`. | T15 | RF-012, RF-016 | Hecho cuando: banners y diálogos son legibles y el cambio de tema no reinicia ni pausa el cronómetro.
- [x] **T17.** Dashboard (primera parte): verificar en oscuro `TodayReport`, `PeriodSelector`, `PeriodBarChart`, `SubjectDonut`, `StreakCard` y `ExtremesCards`. | T10, T11, T12 | RF-012, RF-014, RF-015 | Hecho cuando: resumen diario, selector, gráficos y extremos son legibles en ambos temas.
- [x] **T18.** Dashboard y reportes (segunda parte): verificar en oscuro `Heatmap`, `HeatmapLegend`, `ChartDataTable`, `pages/Dashboard.jsx` y `pages/Reports.jsx`. | T9, T17 | RF-012, RF-013, RF-015 | Hecho cuando: heatmap, leyenda y tabla de reportes se leen en ambos temas.
- [x] **T19.** Ajustes y resto: verificar en oscuro `ProfileForm`, `ThresholdEditor`, `PasswordForm`, `pages/Settings.jsx` y `pages/NotFound.jsx`, incluida la vista previa de bandas del heatmap. | T9, T11, T12 | RF-012, RF-013, RF-015 | Hecho cuando: la página de ajustes y la vista previa de umbrales son legibles en ambos temas.

## Fase E — Calidad y cierre

- [x] **T20.** Crear `client/src/themeAudit.test.js`: auditoría estática de los archivos de componente para detectar clases de color sin equivalente oscuro en `index.css`, con una allowlist explícita y documentada de excepciones justificadas. | T11..T19 | RF-012, RF-015 | Hecho cuando: la auditoría pasa en verde y no quedan clases de superficie sin equivalente salvo las de la allowlist.
- [x] **T21.** Gate visual en navegador headless: recorrer login, dashboard, reportes, temporizador, ajustes, materias y detalle de materia en modo oscuro, medir el contraste real de cada texto sobre su fondo (mínimo AA) y capturar pantallas; registrar la evidencia en `docs/QA.md`. | T20 | RF-007, RF-012, RF-015 | Hecho cuando: el gate reporta 0 textos por debajo del contraste AA y la evidencia queda en `docs/QA.md`.
- [x] **T22.** Documentación y cierre: actualizar `README.md` (sección de tema y estado de la spec 002), `MEMORY.md` (estado, decisiones y aprendizajes) y `specs/001-sistema-estudio/tasks.md` (cierre de la 001). | T21 | — | Hecho cuando: los documentos reflejan la implementación y `npm test`, `npm run lint` y `npm run build` quedan en verde.

---

## Definition of Done — 002

- [x] Todos los RF de `spec.md` implementados y verificados.
- [x] Sin cambios en `server/`, sin cambios de esquema y sin contrato de API alterado.
- [x] Cero destello de tema en el primer pintado.
- [x] Toda la app legible en claro y en oscuro, con contraste AA.
- [x] Tests del cliente en verde y auditoría estática en verde.
- [x] `npm test`, `npm run lint` y `npm run build` en verde.
- [x] Documentos (`README.md`, `MEMORY.md`, `docs/QA.md`) actualizados.
