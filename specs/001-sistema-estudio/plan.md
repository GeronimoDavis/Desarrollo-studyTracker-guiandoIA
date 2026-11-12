# Plan técnico 001 — Sistema de Seguimiento de Estudio

| Campo | Valor |
| --- | --- |
| Especificación | 001-sistema-estudio (versión multiusuario aprobada) |
| Esquema aprobado | `DB.sql` (base `study_tracker`, MySQL 8.x, InnoDB, `utf8mb4_0900_ai_ci`) |
| Versión | 1.1 — MySQL 8.x confirmado |
| Fecha | 2026-11-11 |
| Documento derivado | `tasks.md` |
| Ubicación de staging | `C:\Users\geron\.opencode\plan\001-sistema-estudio\` |
| Destino en el repositorio | `specs/001-sistema-estudio/plan.md` |

> **Nota de consistencia:** la especificación multiusuario aprobada está en `spec.md` y es la fuente de verdad funcional. Este plan desarrolla sus decisiones técnicas sobre el esquema MySQL 8.x aprobado (`DB.sql`, `session_date`, `is_archived`, autenticación y aislamiento por usuario).

---

## 1. Objetivo del plan

Construir una aplicación web multiusuario para registrar tiempo de estudio por materia, con:

- Registro, login y sesión persistente.
- CRUD de materias con archivo lógico.
- Temporizador libre y fijo con descansos estructurados.
- Persistencia del tiempo efectivo en MySQL.
- Dashboard diario, semanal y mensual.
- Gráficos de barras y de dona.
- Días extremos, racha y heatmap anual.
- Ajustes de perfil, zona horaria y umbrales del heatmap.

La implementación se divide en fases pequeñas y verificables. Ninguna fase comienza sin que la anterior cumpla su Definition of Done.

---

## 2. Principios y restricciones

1. **AGENTS.md manda:** código, variables, tablas y endpoints en inglés; interfaz y mensajes en español.
2. **El servidor es la fuente de verdad:** toda escritura se valida en backend antes de tocar MySQL.
3. **SQL parametrizado:** prohibido concatenar entradas del usuario.
4. **Fechas locales:** se guardan timestamps UTC y una columna `session_date` calculada con la zona IANA del usuario. Nunca se deriva un día con `toISOString().slice(0, 10)`.
5. **Sin ORM:** `mysql2/promise` con SQL explícito y repositorios.
6. **Sin sobreingeniería:** no Redux, no TanStack Query, no microservicios, no colas.
7. **Iteraciones pequeñas:** esquema/endpoint primero, integración React después.
8. **MySQL 8.x:** el esquema aprobado usa InnoDB, `utf8mb4_0900_ai_ci` y `CHECK` constraints activos. El backend igualmente valida todo para devolver errores claros y defender la integridad.
9. **Dependencias nuevas:** se aprueban antes de instalar las que no sean estándar.
10. **Esquema congelado:** no se agregan columnas ni tablas sin aprobación explícita.

---

## 3. Stack técnico

| Área | Elección |
| --- | --- |
| Runtime | Node.js 22 LTS |
| API | Express 5 |
| Base de datos | MySQL 8.x (servidor local confirmado, puerto 3306) |
| Driver | `mysql2/promise`, pool, SQL parametrizado |
| Validación | Zod |
| Auth | JWT de acceso + refresh token rotativo en cookies httpOnly |
| Hash de contraseña | `bcryptjs` (sin compilación nativa en Windows) |
| Cliente | React 19 + Vite |
| Routing | React Router |
| Estilos | Tailwind CSS 4 con `@tailwindcss/vite` |
| Gráficos | SVG/CSS propios, sin librería de charts |
| Fechas | Utilidades propias en cliente + `Intl` en servidor |
| Pruebas | Vitest, Supertest, React Testing Library |
| Tooling | ESLint, Prettier, Nodemon, `concurrently`, `dotenv` |

**Nota:** el entorno local confirmado es MySQL 8.x en el puerto 3306, con la base `study_tracker` creada en InnoDB y collation `utf8mb4_0900_ai_ci`. Se recomienda MySQL 8.0.16+ (o 8.4 LTS) para que las `CHECK` constraints se apliquen de verdad.

---

## 4. Base de datos MySQL 8.x

La base `study_tracker` ya existe y fue creada con MySQL 8.x, InnoDB, `utf8mb4_0900_ai_ci` y las restricciones `CHECK` activas. El plan se adapta a ese entorno:

| Tema | MySQL 8.x | Implicación |
| --- | --- | --- |
| `CHECK` constraints | Se aplican desde 8.0.16 | El DDL protege la integridad; además, Zod/servicios validan para dar errores claros y evitar 500 por constraint. |
| `DEFAULT (JSON_ARRAY(...))` | Soportado desde 8.0.13 | El default existe, pero el backend igualmente inserta `heatmap_thresholds` explícito al registrar. |
| CTEs y window functions | Disponibles | No son necesarias para el volumen del MVP; se prefieren `GROUP BY` simples e índices. |
| Collation | `utf8mb4_0900_ai_ci` | Búsquedas y unicidad case-insensitive; los nombres de materia no distinguen mayúsculas. |
| Timestamps | `DATETIME(3)` UTC | El backend controla la zona y deriva `session_date` con la zona IANA del usuario. |

**Sincronización de esquema:** el `DB.sql` versionado en el repositorio todavía declara `utf8mb4_unicode_ci`; la base real usa `utf8mb4_0900_ai_ci`. Antes de generar la migración `001_init.sql` hay que sincronizar ambos para evitar diferencias entre la base local y el repo. No se altera la base ni el DDL sin aprobación.

**Regla de oro:** la tabla `user_settings` se crea/actualiza desde el backend con:

- `heatmap_thresholds = [60, 120, 240, 480]` por defecto.
- Inserción explícita en el registro del usuario.
- `GET /api/settings` devuelve los valores por defecto si no existe fila.
- `PUT /api/settings` hace upsert.

No se modifica `DB.sql` sin aprobación. Cualquier ajuste de collation o del default JSON se hace como tarea explícita y con revisión.

---

## 5. Arquitectura

```text
┌──────────────────────────────────────────────────────────────────┐
│ Navegador                                                        │
│                                                                  │
│  React 19 + Vite + Tailwind CSS 4 + SVG propio                    │
│  AuthContext · TimerContext · ToastContext · hooks de datos        │
│  fetch('/api', credentials: 'include')                           │
└──────────────────────────────┬───────────────────────────────────┘
                               │ proxy /api en desarrollo
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ API Express                                                      │
│                                                                  │
│  routes → middlewares → controllers → services → repositories   │
│  auth · Zod · rate limit · origin check · error handler          │
│  cookies httpOnly · JWT acceso/refresh                           │
└──────────────────────────────┬───────────────────────────────────┘
                               │ mysql2 pool (UTC)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│ MySQL 8.x — study_tracker (InnoDB, utf8mb4_0900_ai_ci)           │
│  users · subjects · study_sessions · user_settings               │
│  refresh_tokens · schema_migrations                              │
└──────────────────────────────────────────────────────────────────┘
```

### Decisiones de arquitectura

- **Capas backend:** las rutas no contienen SQL ni reglas de negocio; los controladores solo traducen HTTP; los servicios concentran reglas y transacciones; los repositorios contienen SQL parametrizado.
- **Autenticación:** cookies httpOnly para evitar tokens en `localStorage`. El cliente nunca manipula el JWT.
- **Desarrollo:** Vite proxy `/api` hacia `http://localhost:4000`; evita CORS y mantiene cookies same-origin.
- **Producción:** el cliente compilado se sirve desde el mismo origen que la API (Express estático o reverse proxy). Si se separan dominios, hay que configurar CORS con credenciales y cookies `SameSite=None; Secure`.
- **Errores:** middleware central con `HttpError`, códigos de dominio y mensajes en español.
- **Sin migraciones automáticas al arrancar:** `npm run db:migrate` es explícito. El servidor solo verifica la conexión.

---

## 6. Estructura de archivos

```text
tracker-estudiante/
├── AGENTS.md
├── DB.sql                           # esquema aprobado (referencia)
├── README.md
├── package.json                     # workspaces + scripts raíz
├── .gitignore
├── .env.example                     # variables de la raíz si hacen falta
├── specs/
│   └── 001-sistema-estudio/
│       ├── spec.md                  # reemplazar por la versión multiusuario aprobada
│       ├── plan.md
│       └── tasks.md
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── .env                         # ignorado por git
│   ├── src/
│   │   ├── server.js                # arranque del proceso
│   │   ├── app.js                   # express, middlewares, rutas
│   │   ├── config/
│   │   │   ├── env.js               # validación de entorno con Zod
│   │   │   └── db.js                # pool mysql2, UTC, dateStrings
│   │   ├── db/
│   │   │   ├── migrate.js           # runner + baseline
│   │   │   └── migrations/
│   │   │       └── 001_init.sql     # copia adaptada de DB.sql
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── auth.routes.js
│   │   │   ├── subjects.routes.js
│   │   │   ├── sessions.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── stats.routes.js
│   │   │   ├── settings.routes.js
│   │   │   └── health.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── subjects.controller.js
│   │   │   ├── sessions.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── stats.controller.js
│   │   │   ├── settings.controller.js
│   │   │   └── health.controller.js
│   │   ├── services/
│   │   │   ├── auth.service.js
│   │   │   ├── token.service.js
│   │   │   ├── password.service.js
│   │   │   ├── subjects.service.js
│   │   │   ├── sessions.service.js
│   │   │   ├── dashboard.service.js
│   │   │   ├── stats.service.js
│   │   │   ├── streak.service.js
│   │   │   ├── heatmap.service.js
│   │   │   └── settings.service.js
│   │   ├── repositories/
│   │   │   ├── users.repository.js
│   │   │   ├── refreshTokens.repository.js
│   │   │   ├── subjects.repository.js
│   │   │   ├── sessions.repository.js
│   │   │   ├── stats.repository.js
│   │   │   └── settings.repository.js
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validate.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── rateLimit.middleware.js
│   │   │   └── origin.middleware.js
│   │   ├── validators/
│   │   │   ├── auth.schema.js
│   │   │   ├── subject.schema.js
│   │   │   ├── session.schema.js
│   │   │   ├── stats.schema.js
│   │   │   └── settings.schema.js
│   │   ├── utils/
│   │   │   ├── dates.js             # session_date, rangos, hoy en TZ
│   │   │   ├── duration.js          # segundos/minutos, formato
│   │   │   ├── breakPlan.js         # tabla de descansos y validación
│   │   │   ├── httpError.js
│   │   │   └── asyncHandler.js
│   │   └── tests/
│   │       ├── auth.test.js
│   │       ├── subjects.test.js
│   │       ├── sessions.test.js
│   │       ├── stats.test.js
│   │       ├── streak.test.js
│   │       ├── heatmap.test.js
│   │       └── helpers/
│   └── scripts/
│       └── seed.js                  # datos de desarrollo, sin credenciales
    └── client/
        ├── package.json
        ├── vite.config.js
        ├── vitest.config.js
        ├── index.html
        └── src/
            ├── main.jsx                 # ErrorBoundary + providers + router
            ├── index.css
            ├── router.jsx               # rutas con errorElement en español
            ├── api/
            │   ├── client.js            # fetch, cookies, refresh single-flight
            │   ├── auth.js
            │   ├── subjects.js
            │   ├── sessions.js          # POST + GET paginado
            │   ├── dashboard.js         # dashboard, período y heatmap
            │   └── settings.js          # umbrales del heatmap
            ├── context/
            │   ├── AuthContext.jsx
            │   ├── TimerContext.jsx
            │   ├── ToastContext.jsx      # avisos consistentes
            │   ├── authContext.js
            │   ├── timerContext.js
            │   ├── toastContext.js
            │   ├── useAuth.js
            │   ├── useTimer.js
            │   └── useToast.js
            ├── hooks/
            │   ├── useSubjects.js
            │   ├── useSubjectSummary.js
            │   ├── useDashboard.js       # hoy, período, racha y sesiones
            │   ├── useHeatmap.js
            │   ├── useSettings.js
            │   └── useSessionSave.js
            ├── components/
            │   ├── ErrorBoundary.jsx
            │   ├── layout/
            │   │   ├── AppShell.jsx      # sidebar en desktop, bottom nav en móvil
            │   │   ├── Sidebar.jsx
            │   │   ├── BottomNav.jsx
            │   │   ├── NavIcon.jsx
            │   │   ├── navItems.js
            │   │   ├── AuthLayout.jsx
            │   │   ├── GuestRoute.jsx
            │   │   ├── ProtectedRoute.jsx
            │   │   └── RouteErrorElement.jsx
            │   ├── ui/
            │   │   ├── Button.jsx
            │   │   ├── EmptyState.jsx
            │   │   ├── ErrorBanner.jsx
            │   │   ├── FormField.jsx
            │   │   └── Spinner.jsx
            │   ├── subjects/
            │   │   ├── SubjectCard.jsx
            │   │   ├── SubjectFormModal.jsx
            │   │   └── ConfirmDialog.jsx
            │   ├── timer/
            │   │   ├── SubjectSelector.jsx
            │   │   ├── ModeTabs.jsx
            │   │   ├── DurationPicker.jsx
            │   │   ├── BreakPlanPicker.jsx
            │   │   ├── TimerDisplay.jsx
            │   │   ├── TimerControls.jsx
            │   │   ├── ProgressPanel.jsx
            │   │   ├── RecoveryDialog.jsx
            │   │   ├── SessionSummaryDialog.jsx
            │   │   └── TimerNavigationGuard.jsx
            │   ├── dashboard/
            │   │   ├── TodayReport.jsx
            │   │   ├── PeriodSelector.jsx
            │   │   ├── PeriodBarChart.jsx
            │   │   ├── SubjectDonut.jsx
            │   │   ├── ExtremesCards.jsx
            │   │   ├── StreakCard.jsx
            │   │   ├── Heatmap.jsx
            │   │   ├── HeatmapLegend.jsx
            │   │   └── ChartDataTable.jsx
            │   └── settings/
            │       ├── ProfileForm.jsx
            │       ├── ThresholdEditor.jsx
            │       └── PasswordForm.jsx
            ├── lib/
            │   ├── dates.js               # claves de día local, sin toISOString
            │   ├── timeFormat.js
            │   ├── dashboard.js           # matriz por día/materia y semanas
            │   ├── heatmap.js             # niveles y colores
            │   ├── settings.js            # validación de umbrales y bandas
            │   ├── timezones.js           # zonas IANA
            │   ├── events.js              # sesión guardada y ajustes actualizados
            │   └── timer/
            │       ├── breakPlan.js
            │       ├── engine.js
            │       └── snapshot.js
            ├── pages/
            │   ├── Login.jsx
            │   ├── Register.jsx
            │   ├── Dashboard.jsx
            │   ├── Timer.jsx
            │   ├── Subjects.jsx
            │   ├── SubjectDetail.jsx
            │   ├── Reports.jsx
            │   ├── Settings.jsx
            │   └── NotFound.jsx
            ├── utils/
            │   └── format.js
            └── test/
                └── setup.js

```

**Nota sobre `DB.sql`:** se conserva en la raíz como referencia aprobada. La migración `server/src/db/migrations/001_init.sql` debe ser una copia adaptada y versionada. Si la base ya existe, el runner registra un baseline en `schema_migrations` en lugar de volver a ejecutar el DDL.

---

## 7. Modelo de datos y acceso

El esquema está aprobado. No se agregan tablas ni columnas en la v1.

| Tabla | Uso principal |
| --- | --- |
| `users` | Cuenta, email único, hash de contraseña, zona IANA. |
| `subjects` | Materias por usuario, color, descripción, archivo lógico. |
| `study_sessions` | Sesiones finalizadas, tiempo efectivo, plan fijo, fecha local. |
| `user_settings` | Umbrales del heatmap. |
| `refresh_tokens` | Refresh tokens hasheados, expiración y revocación. |
| `schema_migrations` | Control de migraciones. |

### Equivalencias de negocio

| Concepto | Columna / API |
| --- | --- |
| Duración objetivo | `target_minutes` / `targetMinutes` |
| Duración real efectiva | `effective_seconds`; la API expone `effectiveMinutes` |
| Estado | `status`: `completed` / `abandoned` |
| Fecha de la sesión | `session_date` / `sessionDate` |
| Materia archivada | `subjects.is_archived` |

### Reglas de acceso a datos

- Toda consulta de `subjects`, `study_sessions`, `user_settings` y `refresh_tokens` incluye `user_id` del usuario autenticado.
- Un recurso de otro usuario responde **404** (no 403) para no revelar existencia.
- `session_date` se deriva en el servidor; el cliente no la envía.
- `study_sessions` es inmutable: no hay `UPDATE` ni `DELETE` en la v1.
- Las materias con sesiones se archivan; sin sesiones se pueden borrar físicamente.
- El nombre de materia es único por usuario; el índice incluye archivadas, por lo que la UI debe ofrecer restaurar en lugar de reutilizar el nombre.

### Estrategia de migraciones y baseline

1. `npm run db:migrate` crea `schema_migrations` si no existe.
2. Si `schema_migrations` está vacío y las tablas principales ya existen, registra `001_init.sql` como aplicado sin ejecutar DDL destructivo.
3. Si la base está vacía, ejecuta `001_init.sql`.
4. El servidor no ejecuta migraciones al arrancar.
5. Cualquier cambio futuro de esquema requiere aprobación explícita según `AGENTS.md`.

### Patrones SQL para MySQL 8.x

- Agrupaciones simples con `GROUP BY` e índices existentes.
- CTEs y window functions disponibles, pero se evitan para mantener las consultas simples y portables.
- Fechas de reporte como cadenas `YYYY-MM-DD` comparadas contra `session_date` (`DATE`).
- La racha y los extremos se calculan en JavaScript a partir de filas agregadas.
- `dateStrings` para `DATE` y timestamps UTC controlados por el pool.
- Las `CHECK` constraints están activas; aun así, los servicios capturan y traducen errores de constraint a respuestas 422/409.

---

## 8. Autenticación y seguridad

### 8.1 Registro

1. Validar nombre, email, contraseña y zona IANA con Zod.
2. Normalizar email a minúsculas.
3. Verificar email único; si existe, `409 EMAIL_IN_USE`.
4. Hash con bcryptjs (coste 12).
5. Transacción:
   - Insertar `users`.
   - Insertar `user_settings` con `heatmap_thresholds = [60,120,240,480]` explícito.
   - Emitir tokens y guardar el hash del refresh.
6. Setear cookies y devolver el usuario público (sin hash).

### 8.2 Login

1. Buscar por email normalizado.
2. Comparar hash con bcryptjs.
3. Error genérico `401 INVALID_CREDENTIALS` para email o contraseña incorrectos.
4. Emitir tokens nuevos.
5. Aplicar rate limit por IP + email.

### 8.3 Tokens y cookies

| Token | Duración | Cookie | Path | Contenido |
| --- | --- | --- | --- | --- |
| Acceso | 15 min | `st_access` | `/api` | `sub`, `typ=access` |
| Refresco | 7 días | `st_refresh` | `/api/auth` | `sub`, `typ=refresh`, `jti` |

- Cookies `httpOnly`, `SameSite=Lax`, `Secure` en producción.
- El refresh token se guarda hasheado (SHA-256) en `refresh_tokens`.
- En cada refresh se revoca el token anterior y se inserta uno nuevo (rotación).
- Si se detecta reutilización de un token revocado, se revocan todos los refresh del usuario.
- Logout revoca el token actual y limpia ambas cookies.
- Cambio de contraseña revoca todos los refresh del usuario y obliga a iniciar sesión de nuevo.

### 8.4 Middleware y autorización

- `auth.middleware`: lee `st_access`, verifica JWT, carga `req.user = { id }`.
- Si el access token expiró: `401 TOKEN_EXPIRED`; el cliente llama a `/api/auth/refresh` una vez y reintenta.
- `origin.middleware`: en métodos mutantes, valida `Origin` contra `CLIENT_ORIGIN`.
- `validate.middleware`: aplica esquemas Zod y devuelve `422` con campos.
- Rate limits:
  - Registro: 5 por hora por IP.
  - Login: 10 por 15 minutos por IP + email.
  - Refresh: 30 por minuto por IP.
  - API general: 300 por 15 minutos por IP.
- Helmet, `express.json({ limit: '100kb' })`, CORS restringido en desarrollo.
- Logs sin contraseñas, tokens ni cookies.

### 8.5 Reglas de contraseña

- 8 a 72 caracteres (límite de bcrypt).
- No se exige complejidad en v1, pero se recomienda al menos una letra y un número en la UI.
- Cambio de contraseña requiere la actual.

---

## 9. Contrato de API

Prefijo `/api`. Respuestas exitosas: `{ "data": ... }`. Errores:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisá los datos ingresados.",
    "fields": { "name": "El nombre es obligatorio." }
  }
}
```

### 9.1 Endpoints

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Registro + cookies |
| POST | `/api/auth/login` | No | Login + cookies |
| POST | `/api/auth/refresh` | Refresh | Rotar tokens |
| POST | `/api/auth/logout` | Sí/Refresh | Revocar y limpiar cookies |
| GET | `/api/auth/me` | Sí | Usuario actual |
| PATCH | `/api/auth/me` | Sí | Nombre y zona horaria |
| PATCH | `/api/auth/password` | Sí | Cambiar contraseña |
| GET | `/api/subjects` | Sí | Listar activas (`includeArchived=1` opcional) |
| POST | `/api/subjects` | Sí | Crear |
| GET | `/api/subjects/:id` | Sí | Detalle |
| PUT | `/api/subjects/:id` | Sí | Editar |
| DELETE | `/api/subjects/:id` | Sí | Archivar o borrar |
| POST | `/api/subjects/:id/restore` | Sí | Restaurar |
| GET | `/api/subjects/:id/stats` | Sí | Semana/mes/año + últimas sesiones |
| POST | `/api/sessions` | Sí | Guardar sesión finalizada |
| GET | `/api/sessions` | Sí | Historial filtrado |
| GET | `/api/dashboard` | Sí | Hoy + período + extremos + racha |
| GET | `/api/stats/daily` | Sí | Reporte diario por materia |
| GET | `/api/stats/period` | Sí | Serie por día y por materia |
| GET | `/api/stats/streak` | Sí | Racha actual |
| GET | `/api/stats/heatmap` | Sí | Matriz anual |
| GET | `/api/settings` | Sí | Ajustes |
| PUT | `/api/settings` | Sí | Upsert de ajustes |
| GET | `/api/health` | No | API + conexión MySQL |

### 9.2 Payload de sesión

```json
{
  "clientId": "7a5f0f4e-9c1a-4f0e-9a4e-2f7c1d3b8e11",
  "subjectId": 12,
  "mode": "fixed",
  "status": "completed",
  "targetMinutes": 60,
  "breakMinutes": 5,
  "breakCount": 3,
  "effectiveSeconds": 3600,
  "startedAt": "2026-11-11T13:00:00.000Z",
  "endedAt": "2026-11-11T14:15:00.000Z"
}
```

- `startedAt` / `endedAt` son ISO 8601 con `Z` u offset.
- El servidor normaliza a UTC para `DATETIME(3)` y deriva `session_date` con la zona del usuario.
- `effectiveMinutes` se calcula en la respuesta; no se envía.
- `clientId` es idempotente por usuario.

### 9.3 Validaciones de sesión

| Regla | Error |
| --- | --- |
| Materia existente, propia y no archivada | `404 NOT_FOUND` / `422 SUBJECT_ARCHIVED` |
| `endedAt > startedAt` | `422 INVALID_SESSION` |
| `effectiveSeconds >= 60` | `422 INVALID_SESSION` |
| `effectiveSeconds <= reloj + 5 s` | `422 INVALID_SESSION` |
| Modo fijo: objetivo en `{30,60,120,180,240,300}` | `422 INVALID_SESSION` |
| Modo fijo: plan exacto de la tabla | `422 INVALID_SESSION` |
| `completed` fijo: efectivo ≈ objetivo (±5 s) | `422 INVALID_SESSION` |
| `abandoned` fijo: efectivo < objetivo | `422 INVALID_SESSION` |
| Modo libre: `status=completed` y plan nulo | `422 INVALID_SESSION` |
| Sin solapamiento con otra sesión del usuario | `409 SESSION_OVERLAP` |
| `clientId` repetido | Devuelve la sesión existente (idempotente) |

### 9.4 Códigos de error

| Código | HTTP |
| --- | --- |
| `VALIDATION_ERROR` | 422 |
| `UNAUTHENTICATED` | 401 |
| `TOKEN_EXPIRED` | 401 |
| `INVALID_CREDENTIALS` | 401 |
| `EMAIL_IN_USE` | 409 |
| `DUPLICATE_NAME` | 409 |
| `SUBJECT_ARCHIVED` | 422 |
| `INVALID_SESSION` | 422 |
| `SESSION_OVERLAP` | 409 |
| `NOT_FOUND` | 404 |
| `RATE_LIMITED` | 429 |
| `INTERNAL_ERROR` | 500 |

---

## 10. Diseño del temporizador

### 10.1 Estados

| Estado | Descripción | Transiciones |
| --- | --- | --- |
| `setup` | Selección de materia, modo y plan | `START → study` |
| `study` | Bloque de estudio activo | Libre: `PAUSE → paused`, `FINISH → finished`. Fijo: fin de bloque `→ break` o `→ finished` |
| `paused` | Solo modo libre; no acumula | `RESUME → study`, `FINISH → finished` |
| `break` | Solo modo fijo; descanso | Fin o `SKIP → study`; `ABANDON → finished` |
| `finished` | Resumen y guardado | `SAVE → saved`, `RETRY → saving`, `DISCARD → setup` |

### 10.2 Modo libre

- Conteo ascendente del tiempo efectivo.
- `PAUSE` detiene la acumulación; `RESUME` la reanuda.
- `FINISH` confirma y guarda con `status=completed`.
- Si el tiempo efectivo es menor a 60 s, se ofrece descartar.
- El tiempo de pausa no se envía ni se guarda (el esquema no tiene columna de pausas reales).

### 10.3 Modo fijo y plan de descansos

| Objetivo | 5 min | 10 min | 15 min |
| --- | ---: | ---: | ---: |
| 30 min | 1 | 1 | 1 |
| 1 h | 3 | 2 | 1 |
| 2 h | 6 | 4 | 2 |
| 3 h | 9 | 6 | 3 |
| 4 h | 12 | 8 | 4 |
| 5 h | 15 | 10 | 5 |

- Bloques de estudio = descansos + 1.
- El objetivo se reparte en segundos iguales; el último bloque absorbe el resto.
- Descansos entre bloques; nunca después del último.
- `totalWallSeconds = objetivo + descansos × minutosDescanso`.
- El tiempo efectivo guardado es el objetivo si se completa; si se abandona, es la suma de bloques completos más la parte estudiada del bloque actual.

Ejemplos:

| Plan | Bloques | Tiempo de reloj |
| --- | --- | --- |
| 30 min + 1×10 | 2×15 min | 40 min |
| 1 h + 3×5 | 4×15 min | 1 h 15 min |
| 1 h + 2×10 | 3×20 min | 1 h 20 min |
| 2 h + 2×15 | 3×40 min | 2 h 30 min |
| 5 h + 15×5 | 16×18:45 | 6 h 15 min |

### 10.4 Precisión y recuperación

- Todo se calcula por diferencias de timestamps; el intervalo solo repinta.
- `visibilitychange` y ticks atrasados recalculan desde la marca de tiempo.
- Snapshot en `localStorage` por usuario en cada transición y cada 5 s:
  - `clientId`, `subjectId`, `mode`, plan, `startedAt`, fase, `phaseStartedAt`, segundos efectivos acumulados, `lastTickAt`.
- Al reabrir: modal “Reanudar / Descartar”. El tiempo con la app cerrada no se cuenta.
- Si el plan fijo venció mientras estaba cerrada, no se acredita ese tiempo; se ofrece guardar lo acumulado o descartar.
- `beforeunload` y bloqueo de navegación mientras haya sesión activa.
- Multi-pestaña: clave de storage + evento `storage`/`BroadcastChannel`; la segunda pestaña no puede iniciar otra sesión.

### 10.5 Guardado

1. Generar `clientId` al iniciar (`crypto.randomUUID()`).
2. Al finalizar/abandonar, calcular `effectiveSeconds` y `endedAt`.
3. `POST /api/sessions`.
4. Si falla la red, mantener el resumen y permitir reintentar con el mismo `clientId`.
5. Si el access token expiró, refrescar y reintentar una vez.
6. Si el servidor responde 409 por solapamiento, mostrar error y ofrecer descartar.
7. Al guardar, invalidar caché de dashboard/racha/heatmap.

---

## 11. Estadísticas, fechas y rachas

### 11.1 `session_date`

- `started_at` y `ended_at` se guardan en UTC.
- `session_date` se calcula con la zona IANA de `users.timezone`:
  - `Intl.DateTimeFormat('en-CA', { timeZone, year, month, day }).formatToParts(...)`.
  - Se arma `YYYY-MM-DD` manualmente para no depender del formato del locale.
- Una sesión que cruza medianoche se imputa al día local de inicio.
- Los cambios de zona horaria afectan solo a sesiones nuevas; las antiguas conservan su `session_date`.

### 11.2 Rangos

- Semana: lunes a domingo, según la fecha local del usuario.
- Mes: primer al último día del mes.
- Año: 1 de enero al 31 de diciembre.
- Los rangos se representan como `YYYY-MM-DD` y se comparan contra `session_date`.
- Aritmética de días con `Date.UTC(año, mes-1, día)` para evitar DST.

### 11.3 Reporte diario

- Total de segundos efectivos del día.
- Desglose por materia: nombre, color, segundos, sesiones.
- Incluye sesiones `completed` y `abandoned`.
- Orden descendente por tiempo.

### 11.4 Período

- Serie por día: `[{ date, effectiveSeconds }]`, con días sin sesiones en 0.
- Desglose por materia: `[{ subjectId, name, color, effectiveSeconds, sessions }]`.
- Totales del período.
- Extremos:
  - Solo días con al menos 1 minuto efectivo.
  - Máximo y mínimo.
  - Empate: fecha más reciente.
  - Sin datos: `null`.

### 11.5 Racha

- Solo sesiones `completed`.
- Fechas distintas con actividad, ordenadas.
- Si hoy tiene sesión completada: contar hacia atrás desde hoy.
- Si hoy no tiene y ayer sí: racha viva, contar desde ayer.
- Si el último día completado es anterior a ayer: 0.
- La racha actual se calcula en JavaScript sobre `session_date`.
- La mejor racha histórica también se calcula en JavaScript sobre las fechas distintas con sesiones completadas.

### 11.6 Heatmap

- Año calendario seleccionado (por defecto el año actual en la zona del usuario).
- 365/366 días, rellenando con 0.
- Niveles según `user_settings.heatmap_thresholds`:
  - Nivel 0: 0 min.
  - Nivel 1: 1 min a menos que el umbral 1.
  - Nivel 2: >= umbral 1 y < umbral 2.
  - Nivel 3: >= umbral 2 y < umbral 3.
  - Nivel 4: >= umbral 3 (el cuarto umbral define el inicio del nivel 4; se usa [60,120,240,480] por defecto).
- 4 intensidades verdes + vacío. Leyenda “Menos → Más”.
- Días futuros y fuera del año: neutros.
- Tooltip con fecha larga y tiempo legible.
- Semana comienza lunes.

> **Aclaración:** la spec antigua mencionaba 5 niveles y una ventana móvil de 365 días. La versión aprobada usa año calendario y 4 niveles + vacío, coherente con los 4 umbrales de `user_settings`.

### 11.7 Consultas y rendimiento

- Daily: una consulta agrupada por materia.
- Period: una consulta por día y una por materia (o una agrupada y agregación en JS).
- Streak: una consulta de fechas distintas.
- Heatmap: una consulta por rango de año.
- Subject stats: tres consultas de rango o una con agregados condicionales; con 10 000 sesiones es suficiente.
- Índices existentes cubren `(user_id, session_date)`, `(user_id, status, session_date)`, `(user_id, subject_id, session_date)`.

---

## 12. Frontend

### 12.1 Rutas

| Ruta | Página | Protegida |
| --- | --- | --- |
| `/login` | Login | No |
| `/register` | Registro | No |
| `/` | Dashboard | Sí |
| `/subjects` | Materias | Sí |
| `/subjects/:id` | Detalle de materia | Sí |
| `/timer` | Temporizador | Sí |
| `/reports` | Reportes | Sí |
| `/settings` | Ajustes | Sí |
| `*` | NotFound | — |

### 12.2 Estado

- `AuthContext`: usuario, login, register, logout, refresh, carga inicial.
- `TimerContext`: máquina de estados, snapshot, recuperación, guardado.
- `SettingsContext`: zona horaria, umbrales, preferencias de UI.
- `ToastContext`: confirmaciones y errores.
- Hooks de datos: fetch con `AbortController`, estados `loading/error/data`, invalidación manual después de mutaciones.
- Sin estado global de servidor; los datos se recargan al volver a la vista o al guardar una sesión.

### 12.3 Cliente API

- `fetch('/api/...', { credentials: 'include' })`.
- Normalización de errores a `{ code, message, fields }`.
- Refresh single-flight:
  - Ante `401 TOKEN_EXPIRED`, una sola llamada a `/api/auth/refresh`.
  - Reintentar la petición original una vez.
  - Si falla, limpiar auth y redirigir a `/login`.
- No refrescar en login, register ni refresh.

### 12.4 Temporizador UI

- Selector de materia obligatorio; botón Iniciar deshabilitado sin materia.
- Modo libre/fijo.
- Duración fija y plan de descansos con resumen de bloques y tiempo total.
- Display grande `HH:MM:SS` o `MM:SS` para bloques.
- Indicadores: tiempo efectivo, tiempo de reloj, fase actual, bloque actual, progreso.
- Botones: Iniciar, Pausar/Reanudar (libre), Saltar descanso (fijo), Finalizar/Abandonar.
- Confirmaciones para abandonar y descartar.
- Resumen final con materia, efectivo, descansos, fecha y estado.
- Reintento de guardado.
- Responsive: una columna en móvil, panel lateral de resumen en escritorio.

### 12.5 Dashboard y reportes

- Reporte de hoy con total y cards por materia.
- Selector semana/mes y navegación de períodos (no futuro).
- Barras apiladas por materia y día.
- Dona por materia con leyenda y porcentaje.
- Tarjetas de día con más/menos estudio.
- Tarjeta de racha.
- Heatmap anual con tooltip y leyenda.
- Página de reportes con tabla diaria por materia y filtro por materia.
- Estados vacíos con CTA al temporizador.
- Tabla accesible alternativa para gráficos.

### 12.6 Estilos y accesibilidad

- Tailwind CSS 4; tokens de color para heatmap.
- Colores de materia aplicados con estilos inline (no clases dinámicas de Tailwind).
- Contraste AA, foco visible, navegación por teclado, `aria-label` en celdas del heatmap.
- Heatmap con scroll horizontal en móvil.
- Gráficos con `ResponsiveContainer`.
- No depender solo del color: leyendas, tooltips y tabla alternativa.

---

## 13. Fases de implementación

| Fase | Contenido | Entregable verificable |
| --- | --- | --- |
| **F0. Fundaciones** | Workspaces, entorno, pool MySQL, migración/baseline, Express base, Vite + Tailwind, health check. | `npm run dev` levanta API y cliente; `/api/health` responde 200 y valida MySQL. |
| **F1. Autenticación** | Registro, login, refresh, logout, middleware, cookies, rate limit, AuthContext y páginas. | Registro/login/logout funcionan; rutas privadas protegidas; tests de auth en verde. |
| **F2. Materias** | CRUD, archivo/restauración, detalle con totales, UI. | Materias propias aisladas; duplicados 409; archivadas conservan historial. |
| **F3. Sesiones y estadísticas API** | Validación de sesiones, idempotencia, solapamiento, daily/period/streak/heatmap/dashboard/settings. | Endpoints responden con datos sembrados y coinciden con SQL manual. |
| **F4. Temporizador** | Plan de descansos, motor puro, TimerContext, UI libre/fijo, recuperación y guardado. | Sesión libre y fija correctas; abandonar guarda efectivo; recarga ofrece reanudar. |
| **F5. Dashboard y reportes** | Shell, reporte diario, barras, dona, extremos, racha, heatmap, reportes. | Dashboard completo y consistente con la API; responsive y accesible. |
| **F6. Ajustes y QA** | Perfil, zona horaria, umbrales, contraseña, performance, seguridad, documentación. | Checklist de `AGENTS.md` completo; suite y revisión manual aprobadas. |

**Dependencias:** F0 → F1 → F2 → F3 → F4 → F5 → F6. El motor puro del temporizador (F4) puede desarrollarse en paralelo con F3, pero la integración de guardado requiere F3.

---

## 14. Estrategia de pruebas

### 14.1 Unitarias

| Módulo | Casos |
| --- | --- |
| `breakPlan` | Las 18 combinaciones; suma exacta; sin descanso final; resto de segundos. |
| `engine` | Libre con pausas; fijo con transiciones; saltar descanso; abandonar; completar; recuperación. |
| `dates` | `session_date` con TZ; semana lunes; mes; año; medianoche; DST. |
| `streak` | Racha viva; racha rota; primer día; sin sesiones. |
| `heatmap` | Umbrales exactos; 365/366; días futuros; año bisiesto. |
| Validadores | Sesión libre/fija; plan inválido; estado; fechas; settings. |

### 14.2 Integración (Supertest)

- Auth: registro, email duplicado, login, refresh, logout, password change, rate limit.
- Aislamiento: usuario A no accede a datos de B.
- Materias: CRUD, duplicado, archivo, restauración, borrado físico sin sesiones.
- Sesiones: matriz de validación, idempotencia, solapamiento, zona horaria.
- Estadísticas: daily, period, extremos, racha, heatmap, settings.

### 14.3 Componentes

- Formularios de auth y materias.
- Timer controls y resumen.
- Dashboard con estados vacíos y datos.
- Heatmap con umbrales y leyenda.

### 14.4 E2E (opcional)

- Registro → materia → sesión libre → dashboard.
- Login → dashboard con datos sembrados.
- No se automatiza una sesión fija completa de 1 h; se cubre con unitarias.

### 14.5 Manual

- `AGENTS.md`: POST/GET de sesiones y materias.
- Cronómetro: efectivo sin pausas/descansos.
- Recarga a mitad de sesión.
- Dos pestañas.
- Zona horaria y medianoche.
- Móvil 360 px.
- MySQL 8.x: CHECK activos, settings explícito, collation `utf8mb4_0900_ai_ci`, sin diferencias entre la base y la migración.

---

## 15. Dependencias

**Requieren aprobación antes de instalar** (regla de `AGENTS.md`):

| Paquete | Lado | Uso | Nota |
| --- | --- | --- | --- |
| `express`, `mysql2`, `dotenv`, `cors`, `helmet` | server | Base | Estándar. |
| `zod` | server | Validación | Ligero. |
| `jsonwebtoken`, `bcryptjs`, `cookie-parser` | server | Auth | `bcryptjs` evita compilación nativa. |
| `express-rate-limit` | server | Rate limit | Estándar. |
| `morgan` | server | Logs de desarrollo | Dev. |
| `nodemon`, `vitest`, `supertest` | server | Desarrollo/pruebas | Dev. |
| `react`, `react-dom`, `react-router-dom` | client | Base | Estándar. |
| `tailwindcss`, `@tailwindcss/vite` | client | Estilos | Tailwind 4. |
| `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` | client | Pruebas | Dev. |
| `concurrently` | raíz | `npm run dev` | Ligero. |

No se propone: ORM, Redux, TanStack Query, axios, PWA, E2E obligatorio.

---

## 16. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Diferencia entre spec antigua y aprobada | Retrabajo | Reemplazar `spec.md` por la versión multiusuario antes de F1. |
| `DB.sql` desincronizado de la base real | Migración distinta al entorno local | Sincronizar collation a `utf8mb4_0900_ai_ci` y verificar el DDL antes de generar `001_init.sql`. |
| CHECK activos pero errores 500 | Mala experiencia | Validar en Zod/servicio antes de insertar y traducir errores de constraint. |
| Desplazamiento de días por UTC/DST | Rachas y heatmap incorrectos | `session_date` server-side con IANA; aritmética UTC; tests. |
| Deriva del cronómetro | Tiempo efectivo erróneo | Timestamps, no ticks; recalcular en `visibilitychange`. |
| Pérdida de sesión al recargar | Frustración/datos perdidos | Snapshot local + modal de recuperación + reintento idempotente. |
| Refresh token race | Sesión inválida | Rotación transaccional + refresh single-flight en cliente. |
| Solapamiento de sesiones | Doble conteo | Validación en servicio + índice + 409. |
| Materia archivada en sesión activa | Guardado rechazado | Avisar en UI; el servidor rechaza con `SUBJECT_ARCHIVED`. |
| Heatmap de 365 celdas en móvil | Layout roto | Scroll horizontal, celdas compactas, tooltip. |
| 10 000 sesiones | Lentitud | Índices, agregaciones simples, cache de vista. |
| Alcance creciente | Retraso | Fuera de alcance explícito y tareas cerradas. |

---

## 17. Definition of Done

- Todos los requisitos P0 de la spec multiusuario implementados.
- Autenticación multiusuario funcional y datos aislados por `user_id`.
- Sesión libre y fija con tiempo efectivo correcto.
- `session_date` derivada en servidor con zona IANA.
- Dashboard, reportes, extremos, racha y heatmap consistentes con la API.
- Validaciones backend equivalentes a los CHECK del DDL.
- Suite unitaria e integración en verde.
- Checklist manual de `AGENTS.md` completo.
- MySQL 8.x verificado: InnoDB, `utf8mb4_0900_ai_ci`, CHECK activos y settings insertado explícitamente.
- Sin secretos en el repositorio; `.env` ignorado; `.env.example` documentado.
- UI en español; código, API y base en inglés.
- README con instalación, migración, ejecución y pruebas.

---

## 18. Decisiones y pendientes

### Decisiones registradas

| ID | Decisión |
| --- | --- |
| D-01 | Multiusuario con login (JWT + refresh en cookies httpOnly). |
| D-02 | Los descansos suman tiempo de reloj, no tiempo efectivo. |
| D-03 | Una sesión fija abandonada se guarda como `abandoned` con el efectivo real. |
| D-04 | Reportes/heatmap incluyen `completed` y `abandoned`; la racha solo `completed`. |
| D-05 | No hay pausa manual en modo fijo en v1; se usa Abandonar. |
| D-06 | Los días extremos se calculan solo entre días con >= 1 min efectivo. |
| D-07 | Heatmap de año calendario, 4 niveles verdes + vacío, umbrales configurables. |
| D-08 | En modo libre, Finalizar guarda `completed`. |
| D-09 | La sesión pertenece al día local de inicio. |
| D-10 | MySQL 8.x local (puerto 3306, InnoDB, `utf8mb4_0900_ai_ci`, CHECK activos); validación fuerte en backend. |
| D-11 | Sin ORM; SQL explícito con `mysql2`. |
| D-12 | Sin librería de charts: barras, dona y heatmap se resuelven con SVG/CSS propios para no sumar peso al bundle. |
| D-13 | Sin `date-fns`: las claves de día local se calculan con utilidades propias para no derivar el día con `toISOString()`. |
| D-14 | El heatmap tiene cinco bandas: los cuatro umbrales ascendentes definen los cortes y un día por debajo del primer umbral se muestra como nivel 0. |
| D-15 | La contraseña actual incorrecta responde `422 INVALID_CURRENT_PASSWORD`. |

### Pendientes de aprobación

| ID | Tema | Propuesta | Estado |
| --- | --- | --- | --- |
| P-01 | Librería de gráficos | SVG/CSS propios, sin dependencia extra. | Resuelto (D-12). |
| P-02 | `date-fns` vs utilidades propias | Utilidades propias en el cliente; `Intl` para zonas horarias. | Resuelto (D-13). |
| P-03 | Tailwind 4 vs 3.4 | Tailwind 4 con plugin de Vite. | Resuelto. |
| P-04 | `bcryptjs` vs `bcrypt` nativo | `bcryptjs` por portabilidad en Windows. | Resuelto. |
| P-05 | Racha histórica máxima | Fuera de la v1. | Fuera de alcance. |
| P-06 | Recuperación de contraseña por email | Fuera de la v1. | Fuera de alcance. |
| P-07 | Borrado de cuenta | Fuera de la v1. | Fuera de alcance. |
| P-08 | Entorno de despliegue | Definir antes de publicar. | Pendiente. |
| P-09 | Sincronizar `DB.sql` con la base real | Actualizar collation a `utf8mb4_0900_ai_ci` y conservar CHECK/default JSON; el backend igualmente inserta settings explícito. | Pendiente. |
| P-10 | Cuarto umbral del heatmap | El backend ya usa los cuatro umbrales para las cinco bandas (D-14). | Resuelto por decisión del usuario. |

---

## 19. Próximo paso

1. Aprobar este plan y el `tasks.md` derivado.
2. Pasar al agente **Build**.
3. Copiar `plan.md` y `tasks.md` a `specs/001-sistema-estudio/`.
4. Reemplazar la copia antigua de `spec.md` por la versión multiusuario aprobada.
5. Ejecutar `T1` (setup del servidor Express y conexión con MySQL) antes de escribir el resto del código.
