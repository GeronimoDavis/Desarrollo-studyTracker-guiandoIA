# MEMORY.md — Estado del proyecto

## Estado actual
- Fases 1 a 6 de `specs/001-sistema-estudio/tasks.md` completas y aprobadas (T74–T103 en `[x]`): auth multiusuario, materias, sesiones, temporizador libre/fijo, dashboard, reportes, heatmap y ajustes.
- Spec 002 `002-tema-oscuro` **en desarrollo** (aprobada el 2026-11-13): modo oscuro de dos estados, persistido en `localStorage` y aplicado antes del pintado; tareas T1–T8 listas, falta el barrido visual de componentes (T9–T22). Sin cambios de backend ni de esquema.
- Backend Express + MySQL 8.0.46 (`study_tracker`, InnoDB, `utf8mb4_0900_ai_ci`) y cliente React 19 + Vite en `http://localhost:5173`; API en `http://localhost:4000`.
- Verificación actual: 53 tests de server + 93 de client, lint sin warnings, build OK y evidencia en `docs/QA.md`.
- Gobernanza SDD activa: `docs/constitution.md` (6 principios), este `MEMORY.md` (estado vivo, ~50 líneas) y los comandos `/sdd-feature` y `/sdd-implement` en `.opencode/commands/`.
- Regla de trabajo: **pedir confirmación al usuario antes de cada `git commit` / `git push`** (está en `AGENTS.md`).
- MVP `001` cerrado; la próxima funcionalidad arranca con `/sdd-feature` en `specs/002-*`.

## Decisiones (y por qué)
- **MySQL 8.x con `utf8mb4_0900_ai_ci`**: activa los `CHECK` constraints (8.0.16+) y mantiene el esquema aprobado.
- **Tiempo efectivo ≠ tiempo de reloj**: en modo fijo los descansos no suman efectivo; en modo libre las pausas tampoco. La base guarda segundos.
- **Abandonos**: una sesión fija abandonada se guarda como `abandoned` con el efectivo real; la racha sólo cuenta `completed`.
- **`session_date` la deriva el backend** desde `startedAt` + `users.timezone`; el cliente nunca la envía.
- **Sin librería de charts**: barras, dona y heatmap en SVG/CSS propios para no sumar peso al bundle.
- **Heatmap con cinco bandas y cuatro umbrales**: 0 sin actividad o bajo el primer umbral, 4 desde el cuarto.
- **Tema oscuro (spec 002)**: `localStorage` y no la cuenta, para no tocar el esquema; Tailwind 4 con `@custom-variant dark` disparado por `data-theme` en `<html>`; script inline en `index.html` para cero destello.
- **Tema oscuro por mapa de clases**: Tailwind 4 compila los colores a variables CSS, así que re-mapear `.bg-white` / `.text-slate-900` / `.border-slate-200` bajo `:root[data-theme="dark"]` tematiza toda la app desde `index.css`, sin editar ~45 componentes (el heatmap y la dona llevan `dark:` explícito).

## Aprendizajes y errores a evitar
- **Cotejaciones viejas (XAMPP / MySQL 5.x)**: `utf8mb4_0900_ai_ci` no existe y los `CHECK` no se aplican; usar MySQL 8.0.16+.
- **Día local**: nunca derivar la fecha con `toISOString()`; usar `client/src/lib/dates.js` y la zona IANA del usuario.
- **Vite con instancias duplicadas**: dos servidores (5173/5174) sirvieron módulos viejos y la UI mostró errores; usar siempre `http://localhost:5173` y reiniciar Vite tras cambios grandes.
- **Límite de registro (5/h por IP)**: en desarrollo, reiniciar la API limpia el contador en memoria.
- **Idempotencia y solapamiento**: reintentar con el mismo `clientId` devuelve la sesión existente; sesiones superpuestas devuelven 409 `SESSION_OVERLAP`.
- **`keyGenerator` de `express-rate-limit`**: todo `keyGenerator` propio debe pasar por `ipKeyGenerator` (normaliza IPv6 a /56); sin eso la librería avisa `ERR_ERL_KEY_GEN_IPV6` al arrancar y un /64 completo puede evadir el límite.

## Próximos pasos
1. Próxima funcionalidad: `/sdd-feature <idea>` crea `specs/002-*` con spec, plan y tareas; después `/sdd-implement 002-nombre Tn` tarea por tarea.
2. Definir entorno de despliegue (P-08) y sincronizar `DB.sql` con la base real (P-09).
3. E2E automatizado opcional: hoy la validación es gate headless + checklist manual en `docs/QA.md`.
