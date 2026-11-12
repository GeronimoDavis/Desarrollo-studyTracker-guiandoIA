# Tasks 001 — Sistema de Seguimiento de Estudio

| Campo | Valor |
| --- | --- |
| Derivado de | `spec.md` (versión multiusuario aprobada) + `plan.md` + base MySQL 8.x |
| Versión | 1.1 — MySQL 8.x confirmado |
| Fecha | 2026-11-11 |
| Entorno confirmado | MySQL 8.x, puerto 3306, base `study_tracker`, InnoDB, `utf8mb4_0900_ai_ci`, CHECK activos |
| Ubicación de staging | `C:\Users\geron\.opencode\plan\001-sistema-estudio\tasks.md` |
| Destino en el repositorio | `specs/001-sistema-estudio/tasks.md` |

## Cómo usar este archivo

- `[ ]` pendiente · `[x]` completada · `[P]` se puede ejecutar en paralelo.
- Cada tarea indica dependencia, requisitos de referencia y criterio de “hecho”.
- No se pasa a la fase siguiente hasta completar el **gate** de la fase.
- Una tarea que requiera cambiar el esquema, agregar una dependencia pesada o cambiar una ruta de API se detiene y se pide aprobación (regla de `AGENTS.md`).
- Código, variables, tablas y endpoints en inglés; UI y mensajes en español.
- No se escriben credenciales en el repositorio. `.env` queda en `.gitignore`.
- La especificación multiusuario aprobada está en `spec.md`; `plan.md` y `tasks.md` son los documentos de implementación.
- `T1` es la primera tarea de implementación: **setup del servidor Express y conexión con MySQL**.

## Ruta crítica

```text
F0 Fundaciones
  T1 Servidor Express + MySQL
  T2 Cliente Vite + React + Tailwind
  T3 Migración/baseline + esquema real
  T4 Tooling, scripts raíz y documentación
  T5 Gate F0
    → F1 Autenticación (T6–T26)
      → F2 Materias (T27–T40)
        → F3 Sesiones + Estadísticas API (T41–T57)
          → F4 Temporizador (T58–T73)
            → F5 Dashboard + Reportes (T74–T89)
              → F6 Ajustes + QA (T90–T103)
```

El motor puro del temporizador (T59–T60) puede avanzar en paralelo con F2/F3. La integración de guardado (T68) depende de F3.

---

## Fase 0 — Fundaciones

### T1 · Setup del servidor Express y conexión con MySQL

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T1 | [x] | Crear el servidor Express y conectar con MySQL 8.x local. | — | NFR-01, NFR-06, NFR-10, D-10 | `npm --prefix server run dev` levanta en `:4000`; `GET /api/health` responde 200 y `SELECT 1` funciona contra `study_tracker`. |

**Checklist de T1:**

- [x] **T1.1** Crear `server/package.json` con `express`, `mysql2`, `dotenv`, `helmet`, `cors`, `cookie-parser`, `zod`; scripts `dev` (Nodemon) y `start`.
- [x] **T1.2** Crear `server/.env.example` y `server/.env` local con `PORT=4000`, `DB_HOST`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=study_tracker`, `NODE_ENV=development`. No versionar `.env`.
- [x] **T1.3** Implementar `src/config/env.js` con validación Zod de variables obligatorias.
- [x] **T1.4** Implementar `src/config/db.js`: pool `mysql2/promise`, `connectionLimit`, `timezone: 'Z'`, `dateStrings` para `DATE`, y `SET time_zone = '+00:00'` por conexión.
- [x] **T1.5** Implementar `src/app.js` y `src/server.js`: JSON con límite, Helmet, cookies, CORS restringido, logs de desarrollo, 404 y middleware central de errores.
- [x] **T1.6** Implementar `GET /api/health` con `SELECT 1` a MySQL; 200 si API y DB están OK, 503 si falla la DB, sin filtrar credenciales.
- [x] **T1.7** Verificar manualmente con `npm --prefix server run dev` y `curl http://localhost:4000/api/health`.

**Nota:** T1 no crea tablas ni ejecuta migraciones. La base ya existe; el objetivo es conectar y verificar.

### T2 · Setup del cliente Vite + React + Tailwind

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T2 | [x] | Crear cliente Vite + React + Tailwind 4 + React Router y proxy `/api`. | T1 | NFR-04, NFR-06 | `npm --prefix client run dev` levanta; Tailwind aplica; `/api/health` funciona desde React sin CORS. |

**Checklist de T2:**

- [x] **T2.1** Crear `client/` con Vite, React, `react-router-dom`, `tailwindcss` y `@tailwindcss/vite`.
- [x] **T2.2** Configurar `vite.config.js` con proxy `/api` a `http://localhost:4000`.
- [x] **T2.3** Crear layout mínimo, página `NotFound` y router base.
- [x] **T2.4** Crear `src/api/client.js` con `fetch('/api/...', { credentials: 'include' })`, JSON y normalización de errores.
- [x] **T2.5** Verificar una llamada de prueba a `/api/health` desde el cliente.

### T3 · Migración, baseline y esquema real

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T3 | [x] | Crear una migración reproducible que coincida con la base MySQL 8.x ya creada. | T1 | D-10, NFR-08 | `server/src/db/migrations/001_init.sql` coincide con `SHOW CREATE TABLE` de la base real; el runner es idempotente. |

**Checklist de T3:**

- [x] **T3.1** Ejecutar `SELECT VERSION();`, `SHOW CREATE TABLE` de las seis tablas y registrar collation, CHECK y defaults.
- [x] **T3.2** Comparar la base real con `DB.sql`; detectar diferencias (`utf8mb4_0900_ai_ci` vs `unicode_ci`, defaults JSON, CHECK).
- [x] **T3.3** Crear `server/src/db/migrations/001_init.sql` sincronizado con la base real, sin ejecutar DDL destructivo.
- [x] **T3.4** Implementar `server/src/db/migrate.js`: crea `schema_migrations`; si las tablas existen y no hay registro, registra baseline sin reejecutar; si la base está vacía, ejecuta la migración.
- [x] **T3.5** Verificar que `npm run db:migrate` sea idempotente y que no altere datos existentes.
- [x] **T3.6** Documentar que la app no ejecuta migraciones automáticamente al arrancar.

### T4 · Tooling, scripts raíz y documentación

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T4 | [x] | Configurar workspace raíz, tooling, documentación y conciliación de spec. | T1–T3 | AGENTS.md, NFR-07 | `npm install`, `npm run dev`, `npm test` y `npm run db:migrate` funcionan desde la raíz. |

**Checklist de T4:**

- [x] **T4.1** Crear `package.json` raíz con scripts `dev`, `dev:server`, `dev:client`, `test`, `lint`, `db:migrate`, usando `concurrently`.
- [x] **T4.2** Crear `.gitignore` con `node_modules`, `.env`, `dist`, logs y archivos temporales.
- [x] **T4.3** Configurar ESLint, Prettier y Vitest en server y client; un test trivial debe pasar.
- [x] **T4.4** Reemplazar la copia antigua de `spec.md` por la spec multiusuario aprobada y copiar `plan.md`/`tasks.md` a `specs/001-sistema-estudio/` al pasar a Build.
- [x] **T4.5** Crear `README.md` con instalación, variables, migración, `npm run dev`, puertos y troubleshooting de MySQL 8.x.

### T5 · Gate F0

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T5 | [x] | **Gate F0:** verificar fundaciones. | T1–T4 | — | `npm run db:migrate`, `npm run dev`, `GET /api/health`, cliente con proxy y `npm test` funcionan; sin secretos versionados. |

**Definition of Done F0:** servidor Express conectado a MySQL 8.x, cliente Vite/Tailwind, migración/baseline idempotente, tooling y README.

---

## Fase 1 — Autenticación multiusuario

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T6 | [x] | Crear esquemas Zod de registro, login, cambio de contraseña y perfil: email, contraseña 8–72, nombre 2–80, zona IANA. | T1 | FR-AUTH-01, FR-AUTH-07 | Payloads inválidos devuelven 422 con campos en español. |
| T7 | [x] | Implementar `password.service.js` con bcryptjs (coste 12) y comparación segura. | T1 | NFR-02 | Hash/verify funcionan; la contraseña nunca se loguea. |
| T8 | [x] | Implementar `token.service.js`: access JWT 15 min, refresh JWT 7 días, secretos separados, claims `sub` y `typ`. | T1 | FR-AUTH-03, NFR-02 | Tokens se firman/verifican; un tipo incorrecto se rechaza. |
| T9 | [x] | Implementar `refreshTokens.repository.js`: hash SHA-256, buscar, revocar, revocar todos y limpiar expirados. | T1 | FR-AUTH-03, FR-AUTH-04 | `token_hash` único; sin tokens en texto plano. |
| T10 | [x] | Implementar `users.repository.js`: crear, buscar por email, buscar por id, actualizar nombre/timezone/password. | T1 | FR-AUTH-01, FR-AUTH-02 | Email normalizado y único; consultas parametrizadas. |
| T11 | [x] | Implementar registro: transacción usuario + settings + refresh, cookies httpOnly y usuario público. | T6–T10 | FR-AUTH-01, FR-AUTH-03 | 201; settings `[60,120,240,480]`; cookies httpOnly. |
| T12 | [x] | Implementar login: comparar, emitir tokens, cookies y error genérico. | T7, T8, T10 | FR-AUTH-02 | Credenciales válidas 200; inválidas 401 `INVALID_CREDENTIALS`. |
| T13 | [x] | Implementar refresh con rotación transaccional y detección de reutilización. | T8, T9 | FR-AUTH-03, NFR-02 | Rota el token; reutilizar uno revocado invalida la familia. |
| T14 | [x] | Implementar logout: revocar refresh actual y limpiar cookies. | T9 | FR-AUTH-04 | 204; el refresh deja de servir. |
| T15 | [x] | Implementar `auth.middleware`: leer `st_access`, verificar JWT, cargar `req.user` y distinguir `UNAUTHENTICATED`/`TOKEN_EXPIRED`. | T8 | FR-AUTH-05, NFR-11 | Rutas privadas sin cookie 401; token vencido `TOKEN_EXPIRED`. |
| T16 | [x] | Implementar `GET/PATCH /api/auth/me` y `PATCH /api/auth/password`; cambio de contraseña revoca todos los refresh. | T10, T15 | FR-AUTH-07, FR-AUTH-08, FR-SET-01 | Perfil actualiza nombre/timezone; cambio exige contraseña actual. |
| T17 | [x] | Crear helper de pertenencia: toda consulta exige `user_id`; recurso ajeno = 404. | T15 | FR-AUTH-05, NFR-11 | Tests de aislamiento pasan. |
| T18 | [x] | Configurar rate limits de auth/API y `origin.middleware` para métodos mutantes. | T1 | NFR-02 | Login/registro limitados; Origin no permitido 403. |
| T19 | [x] | Tests de integración de auth: registro, duplicado, login, refresh, reutilización, logout, password, rate limit y aislamiento. | T11–T18 | FR-AUTH-01..08 | Suite de auth verde con base de test. |
| T20 | [x] | Crear `AuthContext` y `api/auth.js`: bootstrap `/auth/me`, login, register, logout, refresh. | T2, T15 | FR-AUTH-06 | El contexto carga el usuario y expone estados de carga/error. |
| T21 | [x] | Crear página Login en español con validación, errores y redirección a la ruta solicitada. | T20 | FR-AUTH-02, FR-AUTH-06 | Login exitoso navega al dashboard o ruta original. |
| T22 | [x] | Crear página Registro, detectar zona IANA del navegador y enviarla al backend. | T20 | FR-AUTH-01, FR-AUTH-07 | Registro crea usuario con timezone del navegador. |
| T23 | [x] | Implementar `ProtectedRoute`: sin usuario redirige a `/login`; con sesión renderiza el layout. | T20 | FR-AUTH-06 | Rutas privadas no muestran contenido sin auth. |
| T24 | [x] | Implementar refresh single-flight en `api/client.js`: un solo refresh ante `TOKEN_EXPIRED`, reintento una vez, logout si falla. | T20 | FR-AUTH-03, NFR-03 | Peticiones simultáneas no disparan múltiples refresh ni loops. |
| T25 | [x] | Tests de cliente para AuthContext y formularios de login/registro. | T20–T24 | FR-AUTH-01..06 | Tests de render, validación y redirección pasan. |
| T26 | [x] | **Gate F1:** registro → login → refresh → logout; ruta privada; aislamiento entre dos usuarios. | T6–T25 | — | Flujo manual y automatizado aprobado. |

**Definition of Done F1:** cuentas, cookies seguras, refresh rotativo, rutas protegidas, aislamiento por usuario y tests de auth.

---

## Fase 2 — Materias

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T27 | [x] | Crear esquemas Zod de materia: nombre 2–80, color `#RRGGBB`, descripción ≤500, IDs numéricos. | T6 | FR-SUB-02, FR-SUB-07 | Errores 422 por campo; color normalizado. |
| T28 | [x] | Implementar `subjects.repository.js`: listar activas/archivadas, buscar propia, crear, editar, archivar, restaurar, borrar y contar sesiones. | T1, T17 | FR-SUB-01..04 | Todas las consultas filtran `user_id`; SQL parametrizado. |
| T29 | [x] | Implementar `subjects.service.js`: unicidad, regla archivar/borrar, restaurar y pertenencia. | T28 | FR-SUB-04, FR-SUB-06, BR-10 | Duplicado 409; con sesiones archiva; sin sesiones borra. |
| T30 | [x] | Crear rutas/controladores: `GET`, `POST`, `GET/:id`, `PUT/:id`, `DELETE/:id`, `POST/:id/restore`. | T29 | FR-SUB-01..06 | 200/201/204/404/409 según corresponda. |
| T31 | [x] | Implementar resumen por materia: semana, mes, año, `lastStudyDate` y `totalSessions`. | T28, T42 | FR-SUB-05 | Totales coinciden con SQL manual. |
| T32 | [x] | Tests de integración de materias: crear, duplicado, editar, archivar, restaurar, borrar sin sesiones, aislamiento y resumen. | T30, T31 | FR-SUB-01..09 | Suite verde. |
| T33 | [x] | Crear `api/subjects.js` y hooks `useSubjects`/`useSubjectSummary` con carga, error y recarga tras mutaciones. | T2, T30 | FR-SUB-01..09 | La UI refleja cambios sin recargar la página. |
| T34 | [x] | Construir página de materias con tarjetas, color, descripción, archivo y acceso a detalle. | T33 | FR-SUB-01, FR-SUB-02 | Lista, vacío con CTA y navegación funcionan. |
| T35 | [x] | Construir formulario modal con paleta de colores, color personalizado y validaciones en español. | T34 | FR-SUB-02, FR-SUB-07 | Crear/editar refleja cambios; errores por campo. |
| T36 | [x] | Implementar archivar, restaurar y borrar con confirmación; sección de archivadas. | T34 | FR-SUB-04, FR-SUB-08 | Archivar conserva sesiones; restaurar vuelve al selector. |
| T37 | [x] | Construir detalle de materia con tarjetas semana/mes/año, último día y últimas sesiones. | T33 | FR-SUB-05 | Totales consistentes con dashboard; estados vacíos. |
| T38 | [x] | Agregar estados de carga, error, reintento y vacío en todas las vistas de materias. | T34–T37 | FR-SUB-09 | Sin pantallas en blanco; errores con reintento. |
| T39 | [x] | Tests de componentes de materias: formulario, color, lista, confirmación y detalle. | T34–T38 | FR-SUB-01..09 | Tests verdes. |
| T40 | [x] | **Gate F2:** crear/editar/archivar/restaurar/borrar desde la UI; dos usuarios aislados; totales correctos. | T27–T39 | — | Flujo manual y tests aprobados. |

**Definition of Done F2:** CRUD completo, archivo lógico, resumen por materia y UI en español.

---

## Fase 3 — Sesiones y estadísticas API

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T41 | [x] | Crear esquemas Zod de sesión: modo, estado, objetivo, descansos, `effectiveSeconds`, ISO start/end, `clientId` UUID. | T6 | FR-SES-01, FR-SES-02 | Payloads inválidos devuelven 422 con detalle. |
| T42 | [x] | Implementar `utils/dates.js`: hoy en zona IANA, `session_date` desde timestamp, rangos semana/mes/año, aritmética UTC. | T1 | BR-07 | Tests de medianoche, DST y cambio de año pasan. |
| T43 | [x] | Implementar `sessions.repository.js`: insertar, buscar por `clientId`, listar por rango/materia/estado, detectar solapamiento, sumas diarias y por rango. | T1, T17 | FR-SES-03..05 | Consultas parametrizadas; usan índices; sin SQL concatenado. |
| T44 | [x] | Implementar `sessions.service.js`: pertenencia, plan exacto, estados, tiempo efectivo, solapamiento e idempotencia. | T41–T43 | FR-SES-01..07 | Matriz de validación implementada; `clientId` repetido devuelve la sesión existente. |
| T45 | [x] | Crear `POST /api/sessions` y `GET /api/sessions` con filtros y paginación simple. | T44 | FR-SES-01..06 | 201 al crear; 200 idempotente; 409 solapamiento; 422 inválido. |
| T46 | [x] | Implementar reporte diario por materia: total, desglose, sesiones y vacío. | T43 | FR-DASH-01 | `/api/stats/daily?date=` coincide con SQL manual. |
| T47 | [x] | Implementar período: serie por día, desglose por materia y totales. | T43, T42 | FR-DASH-03, FR-DASH-04 | Semana lunes–domingo y mes calendario correctos; días sin datos en 0. |
| T48 | [x] | Implementar días extremos: solo días con ≥1 min, empate más reciente, `null` sin datos. | T47 | FR-DASH-05 | Casos con empate y sin sesiones testeados. |
| T49 | [x] | Implementar racha: solo `completed`, racha viva si ayer sí y hoy no, 0 si el último es anterior a ayer. | T43, T42 | FR-DASH-06, BR-06 | Tests de racha viva, rota y primer día pasan. |
| T50 | [x] | Implementar heatmap por año calendario: 365/366 días, zero-fill, niveles desde settings, días futuros neutros. | T43, T52, T42 | FR-DASH-07, BR-08 | Año bisiesto y umbrales exactos testeados. |
| T51 | [x] | Implementar `GET /api/dashboard`: hoy + período + extremos + racha. | T46–T49 | FR-DASH-01..06 | El dashboard obtiene todo con una llamada; heatmap separado. |
| T52 | [x] | Implementar settings: defaults `[60,120,240,480]`, GET con fallback, PUT con 4 umbrales ascendentes y upsert. | T9, T17 | FR-SET-02 | Registro crea settings; GET/PUT funcionan; JSON guardado como texto. |
| T53 | [x] | Tests de sesiones: 18 combinaciones, libre, abandonada, completada, solapamiento, idempotencia, materia ajena/archivada, TZ. | T44, T45 | FR-SES-01..07 | Suite verde y matriz cubierta. |
| T54 | [x] | Tests de estadísticas: daily, period, extremos, racha, heatmap, settings y datos vacíos. | T46–T52 | FR-DASH-01..07, FR-SET-02 | Suite verde con datos sembrados. |
| T55 | [x] | Crear `scripts/seed.js` para un usuario existente con materias y sesiones de varios días; sin credenciales hardcodeadas. | T43 | NFR-07 | Seed usable en desarrollo y tests; limpia antes de sembrar. |
| T56 | [x] | Documentar endpoints, payloads y códigos de error. | T45–T52 | — | Documentación coincide con la implementación. |
| T57 | [x] | **Gate F3:** probar todos los endpoints con dos usuarios; verificar sesiones, daily, period, racha, heatmap y settings. | T41–T56 | — | Respuestas coinciden con SQL manual; tests verdes. |

**Definition of Done F3:** API de sesiones y estadísticas completa, validada, idempotente y alineada con MySQL 8.x.

---

## Fase 4 — Temporizador

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T58 | [x] | Implementar utilidades de fecha/hora de cliente: formato local, `HH:MM:SS`, rangos y `crypto.randomUUID` para `clientId`. | T2 | FR-TIM-12, BR-07 | Tests de formato y fecha local; no se usa `toISOString()` para días. |
| T59 | [x] | Implementar `lib/timer/breakPlan.js`: 18 combinaciones, bloques, resto de segundos y tiempo de reloj. | T58 | FR-TIM-04, BR-02, BR-03 | Tests de las 18 combinaciones, suma exacta y sin descanso final. |
| T60 | [x] | Implementar `lib/timer/engine.js` puro: estados, pausa libre, transiciones fijas, saltar descanso, abandonar y completar. | T59 | FR-TIM-02..08 | Tests con reloj falso cubren todos los caminos. |
| T61 | [x] | Implementar `TimerContext`: estado, configuración, acumulación por timestamps, snapshot en `localStorage` por usuario cada 5 s. | T60 | FR-TIM-11, NFR-06 | Recargar no pierde estado; el gap cerrado no cuenta. |
| T62 | [x] | Implementar recuperación: modal Reanudar/Descartar, plan fijo vencido, snapshot inválido y sesión de otro usuario. | T61 | FR-TIM-11 | Reanudar continúa desde el snapshot; descartar limpia. |
| T63 | [x] | Construir configuración: selector de materia, modo libre/fijo y duración; Iniciar deshabilitado sin materia. | T33, T61 | FR-TIM-01..03 | Sin materia no inicia; el modo queda bloqueado al iniciar. |
| T64 | [x] | Construir selector de plan de descansos con resumen de bloques y tiempo total. | T59, T63 | FR-TIM-04, FR-TIM-13 | Solo combinaciones válidas; el resumen coincide con el plan. |
| T65 | [x] | Construir UI de modo libre: Iniciar, Pausar, Reanudar, Finalizar y confirmación. | T63 | FR-TIM-02, FR-TIM-07 | Pausa no suma; finalizar con <60 s ofrece descartar. |
| T66 | [x] | Construir UI de modo fijo: cuenta por bloque, descanso, saltar descanso, abandonar y completar automático. | T64 | FR-TIM-05, FR-TIM-06, FR-TIM-09 | Transiciones automáticas; abandonar guarda efectivo; completar guarda objetivo. |
| T67 | [x] | Construir display: tiempo efectivo, tiempo de reloj, fase, bloque actual, progreso y título de pestaña. | T65, T66 | FR-TIM-12, FR-TIM-13 | No se desincroniza al cambiar de pestaña. |
| T68 | [x] | Implementar `useSessionSave`: POST, resumen, reintento con mismo `clientId`, refresh si expiró, invalidación de dashboard. | T45, T61 | FR-TIM-08, FR-SES-03, NFR-03 | Guardado exitoso aparece en dashboard; fallo de red reintenta sin duplicar. |
| T69 | [x] | Implementar bloqueo de navegación y `beforeunload` mientras haya sesión activa. | T61 | FR-TIM-11 | Salir pide confirmación; recargar ofrece recuperar. |
| T70 | [x] | Implementar bloqueo multi-pestaña con `storage`/`BroadcastChannel`. | T61 | FR-TIM-11 | La segunda pestaña no inicia otra sesión. |
| T71 | [x] | Implementar señal visual/sonora al cambiar de fase y notificación opcional del navegador. | T66 | FR-TIM-10 | Cambio de bloque avisa; permiso denegado no rompe el flujo. |
| T72 | [x] | Tests de componentes y contexto: libre, fijo, abandonar, recuperar, saltar descanso. | T58–T71 | FR-TIM-01..15 | Tests verdes con timers falsos. |
| T73 | [x] | **Gate F4:** sesión libre y fija manual; abandonar; recargar; dos pestañas; verificar datos en MySQL. | T58–T72 | — | Tiempo efectivo correcto; sin descansos contabilizados; recuperación OK. |

**Definition of Done F4:** temporizador preciso, persistente y guardado idempotente, con UX completa en español.

---

## Fase 5 — Dashboard y reportes

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T74 | [x] | Construir `AppShell`: sidebar en escritorio, bottom nav en móvil, header con usuario y logout. | T23, T2 | NFR-04 | Navegación entre dashboard, materias, temporizador, reportes y ajustes. |
| T75 | [x] | Crear `api/dashboard.js`, `useDashboard`, `useHeatmap` con carga, error, reintento y recarga al guardar sesión. | T51, T50 | FR-DASH-01..07 | El dashboard refleja una sesión nueva sin recargar. |
| T76 | [x] | Construir reporte de hoy: total, cards por materia y detalle de sesiones. | T75 | FR-DASH-01 | Coincide con `/api/stats/daily`; vacío con CTA. |
| T77 | [x] | Construir selector semana/mes y navegación de períodos sin permitir futuro. | T75 | FR-DASH-02 | Cambiar período recarga y muestra el rango correcto. |
| T78 | [x] | Construir gráfico de barras apiladas por materia y día. | T75, T77 | FR-DASH-03 | Barras con colores, tooltip y total del período. |
| T79 | [x] | Construir gráfico de dona por materia con leyenda, tiempo y porcentaje. | T75, T77 | FR-DASH-04 | Dona coincide con el desglose; estado vacío. |
| T80 | [x] | Construir tarjetas de día con más/menos estudio. | T75 | FR-DASH-05 | Muestra fecha y horas; sin datos muestra vacío. |
| T81 | [x] | Construir tarjeta de racha actual y estado “estudiaste hoy”. | T75 | FR-DASH-06 | Racha viva y rota se muestran correctamente. |
| T82 | [x] | Construir heatmap anual: grid 7×~53, niveles, tooltip, días futuros, año bisiesto. | T75 | FR-DASH-07, FR-DASH-08 | 365/366 celdas; tooltip y niveles correctos. |
| T83 | [x] | Construir leyenda “Menos → Más” y selector de año del heatmap. | T82 | FR-DASH-07 | Leyenda visible; cambiar año recarga. |
| T84 | [x] | Construir página de reportes con tabla diaria por materia, totales y filtro por materia. | T75 | FR-DASH-09, FR-DASH-10 | Tabla coincide con la API; filtro funciona. |
| T85 | [x] | Agregar estados de carga, error, reintento y vacío en dashboard y reportes. | T76–T84 | FR-DASH-11 | Sin pantallas en blanco; vacíos con CTA. |
| T86 | [x] | Ajustar responsive: gráficos, heatmap con scroll horizontal, cards y navegación móvil. | T74–T85 | FR-DASH-12, NFR-04 | Usable a 360 px; sin overflow no intencional. |
| T87 | [x] | Accesibilidad: foco, teclado, contraste, `aria-label` del heatmap y tabla alternativa de gráficos. | T74–T86 | FR-DASH-12, NFR-05 | Auditoría básica sin blockers; tabla accesible disponible. |
| T88 | [x] | Tests de datos de gráficos, niveles del heatmap, extremos y estados vacíos. | T76–T87 | FR-DASH-01..12 | Tests verdes. |
| T89 | [x] | **Gate F5:** recorrido dashboard → período → reportes; consistencia con API; responsive y a11y. | T74–T88 | — | Criterios aprobados manualmente y con tests. |

**Definition of Done F5:** dashboard y reportes completos, consistentes, responsive y accesibles.

**Nota de implementación:** los gráficos de barras y dona se resuelven con SVG/CSS propios, sin agregar Recharts, para mantener el bundle liviano. Cada gráfico incluye una tabla accesible como alternativa textual.

---

## Fase 6 — Ajustes, pulido y QA

| ID | Estado | Tarea | Depende | Refs | Hecho cuando |
| --- | --- | --- | --- | --- | --- |
| T90 | [ ] | Construir página de ajustes: nombre, email de solo lectura, zona horaria y logout. | T16, T74 | FR-SET-01, FR-SET-04 | Cambios persisten; timezone validada. |
| T91 | [ ] | Construir editor de 4 umbrales del heatmap con validación ascendente y vista previa. | T52, T90 | FR-SET-02 | Guardar recarga el heatmap con los nuevos niveles. |
| T92 | [ ] | Construir cambio de contraseña con confirmación y cierre de sesión posterior. | T16, T90 | FR-AUTH-08 | Contraseña incorrecta 422; cambio exitoso redirige a login. |
| T93 | [ ] | Agregar ErrorBoundary, toasts consistentes y mensajes de error de red/reintento. | T74–T92 | NFR-03 | Errores inesperados no rompen la app; mensajes en español. |
| T94 | [ ] | Auditoría de seguridad: cookies, SameSite, Secure, rate limit, origen, SQL parametrizado, secretos y logs. | T90–T93 | NFR-02, NFR-06 | Checklist sin hallazgos críticos; secretos fuera del repo. |
| T95 | [ ] | Prueba de performance con 10 000 sesiones: dashboard < 2 s, API < 300 ms. | T55, T75 | NFR-01 | Tiempos medidos y documentados; índices usados. |
| T96 | [ ] | Regresión MySQL 8.x: verificar `utf8mb4_0900_ai_ci`, CHECK activos, default JSON, migración y `schema_migrations`. | T3, T57 | NFR-08, D-10 | Base real y migración coinciden; constraints activos. |
| T97 | [ ] | Ejecutar suite completa: unitarias, integración, componentes y lint. | T1–T96 | NFR-07 | Todo verde; sin warnings bloqueantes. |
| T98 | [ ] | Checklist manual de `AGENTS.md`: POST/GET de sesiones y materias, tiempo efectivo, racha y heatmap. | T97 | AGENTS.md | Checklist firmado. |
| T99 | [ ] | README final: instalación, `.env`, migración, scripts, API, pruebas y troubleshooting MySQL 8.x. | T97 | AGENTS.md | Un tercero puede levantar y probar la app. |
| T100 | [ ] | E2E opcional: registro → materia → sesión libre → dashboard y login → dashboard con seed. | T97 | NFR-07 | Flujo crítico automatizado o decisión de omitirlo registrada. |
| T101 | [ ] | Limpieza: `console.log`, código muerto, TODOs, dependencias sin usar y archivos temporales. | T97 | NFR-07 | Repo limpio; sin secretos ni artefactos. |
| T102 | [ ] | Sincronizar `spec.md`, `plan.md`, `tasks.md` y `README.md` con la implementación final. | T99–T101 | — | Documentos y código coinciden. |
| T103 | [ ] | **Gate final:** revisión de aceptación global, demo de 10 minutos y aprobación del usuario. | Todas | — | Release candidate aprobado. |

**Definition of Done F6:** ajustes completos, seguridad/performance verificadas, documentación final y aceptación del usuario.

---

## Definition of Done global

- [ ] Todos los requisitos P0 de la spec multiusuario implementados.
- [ ] Multiusuario con aislamiento total por `user_id`.
- [ ] Sesión libre y fija con tiempo efectivo correcto.
- [ ] Abandonar guarda `abandoned` con el efectivo real.
- [ ] `session_date` derivada en servidor con zona IANA.
- [ ] Dashboard, reportes, extremos, racha y heatmap consistentes.
- [ ] Validaciones backend alineadas con los CHECK activos de MySQL 8.x.
- [ ] MySQL 8.x verificado: InnoDB, `utf8mb4_0900_ai_ci`, CHECK, default JSON y migración reproducible.
- [ ] Suite de tests en verde.
- [ ] Checklist manual de `AGENTS.md` completo.
- [ ] Sin secretos en el repositorio; `.env` ignorado.
- [ ] UI en español; código/API/DB en inglés.
- [ ] README actualizado.
- [ ] Documentos `spec.md`, `plan.md` y `tasks.md` sincronizados.

## Reglas de bloqueo

- No modificar `DB.sql` ni agregar columnas/tablas sin aprobación.
- No agregar ORM, Redux, TanStack Query, axios ni E2E obligatorio sin aprobación.
- No cambiar rutas de API ya acordadas sin actualizar spec/plan/tasks.
- No avanzar de fase con tests rojos o un gate incompleto.
- No escribir credenciales, tokens ni datos personales en logs o en el repositorio.
