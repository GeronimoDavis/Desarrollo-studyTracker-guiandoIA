# Sistema de Seguimiento de Estudio

Aplicación web multiusuario para registrar y analizar el tiempo de estudio por
materia: temporizador libre y fijo, rachas, reportes por período, heatmap anual y
ajustes de cuenta.

## Stack

- **Backend:** Node.js + Express 5 + MySQL 8.x (`mysql2`), validación con Zod.
- **Frontend:** React 19 + Vite + Tailwind CSS 4 + React Router 7.
- **Base de datos:** `study_tracker` en MySQL 8.x, InnoDB, `utf8mb4_0900_ai_ci`.
- **Autenticación:** JWT de acceso + refresh token rotativo en cookies httpOnly.
- **Pruebas:** Vitest, Supertest y React Testing Library.

## Requisitos

- Node.js 22 o superior.
- MySQL 8.0.16 o superior (las `CHECK` constraints se aplican desde esa versión).
- Base `study_tracker` creada en MySQL.

## Instalación

```bash
npm install
npm --prefix server install
npm --prefix client install
```

## Variables de entorno

Copiar `server/.env.example` a `server/.env` y completar los datos locales:

```env
NODE_ENV=development
PORT=4000

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=study_tracker
DB_CONNECTION_LIMIT=10

CLIENT_ORIGIN=http://localhost:5173
COOKIE_SECURE=false

# Generar valores largos y distintos, por ejemplo: openssl rand -hex 48
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
```

Los dos secretos deben tener al menos 32 caracteres: el servidor no arranca con
valores cortos o vacíos. `server/.env` no se versiona.

## Base de datos y migraciones

La migración reproducible está en `server/src/db/migrations/001_init.sql` y usa
`utf8mb4_0900_ai_ci` con `CHECK` constraints activas. El runner registra un
baseline si las tablas ya están creadas y no vuelve a ejecutar DDL destructivo:

```bash
npm run db:migrate
```

Para crear la base vacía:

```sql
CREATE DATABASE study_tracker
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
```

## Desarrollo

```bash
npm run dev
```

- API: <http://localhost:4000>
- Cliente: <http://localhost:5173>
- Health check: <http://localhost:4000/api/health>

El cliente usa el proxy de Vite para `/api`, así que las cookies funcionan en
mismo origen durante el desarrollo. Usá siempre el puerto 5173: si queda otro
Vite levantado en otro puerto, el navegador puede mostrar una versión vieja del
código.

## Scripts

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta API y cliente con `concurrently`. |
| `npm run dev:server` | Solo API con Nodemon. |
| `npm run dev:client` | Solo cliente con Vite. |
| `npm run db:migrate` | Ejecuta el runner de migraciones/baseline. |
| `npm --prefix server run seed -- --email=tu@email.com` | Limpia y siembra materias y sesiones de desarrollo para un usuario existente. |
| `npm run build` | Compila el cliente para producción. |
| `npm test` | Ejecuta las pruebas de ambos workspaces. |
| `npm run lint` | Ejecuta ESLint (server) y oxlint (client). |

### Datos de desarrollo

El seed requiere un usuario ya registrado y no contiene credenciales:

```bash
npm --prefix server run seed -- --email=ana@example.com
```

Opcionalmente se puede limitar la ventana de días:

```bash
npm --prefix server run seed -- --email=ana@example.com --days=60
```

El script elimina las sesiones y materias previas de ese usuario antes de sembrar.

## Tema claro y oscuro

La app tiene dos temas: **claro** y **oscuro**. El control está en el encabezado
(al lado de "Cerrar sesión"), tanto en escritorio como en móvil.

- La preferencia se guarda en el navegador (`localStorage`, clave
  `study-tracker:theme`) y se aplica **antes del primer pintado**, por eso no
  hay destello al recargar.
- Es **por dispositivo**: no se sincroniza entre equipos ni navegadores.
- El tema oscuro se define en `client/src/index.css` con un mapa de clases
  (superficie, texto, borde y acento); el heatmap y la dona llevan su propia
  variante.
- Si el navegador no permite `localStorage` (modo privado), la app funciona
  igual en tema claro.

Detalle completo en [`specs/002-tema-oscuro/spec.md`](specs/002-tema-oscuro/spec.md).

## Pruebas

```bash
npm test        # 49 pruebas del server (Supertest + Vitest) y 78 del cliente
npm run lint    # sin warnings
npm run build   # build de producción del cliente
```

Los tests del cliente usan Vitest con jsdom y React Testing Library; los del
server levantan la app Express contra la base real de desarrollo.

## API

La referencia completa está en [`docs/API.md`](docs/API.md). Resumen:

| Método | Ruta | Descripción |
| --- | --- | --- |
| POST | `/api/auth/register` | Crea usuario, settings y cookies. |
| POST | `/api/auth/login` | Inicia sesión. |
| POST | `/api/auth/refresh` | Rota el refresh token. |
| POST | `/api/auth/logout` | Revoca el refresh y limpia cookies. |
| GET/PATCH | `/api/auth/me` | Perfil (nombre y zona horaria). |
| PATCH | `/api/auth/password` | Cambia la contraseña y cierra la sesión. |
| GET/POST | `/api/subjects` | Materias del usuario. |
| GET/PUT/DELETE | `/api/subjects/:id` | Detalle, edición y archivado. |
| POST | `/api/subjects/:id/restore` | Restaura una materia archivada. |
| GET | `/api/subjects/:id/stats` | Resumen por semana, mes y año. |
| POST | `/api/sessions` | Guarda una sesión (idempotente por `clientId`). |
| GET | `/api/sessions` | Lista sesiones con filtros y paginación. |
| GET | `/api/dashboard` | Hoy, período, extremos y racha. |
| GET | `/api/stats/daily` | Reporte de un día. |
| GET | `/api/stats/period` | Reporte de un período (semana o mes). |
| GET | `/api/stats/streak` | Racha actual y mejor racha. |
| GET | `/api/stats/heatmap` | Heatmap anual con niveles. |
| GET/PUT | `/api/settings` | Umbrales del heatmap. |

Las respuestas usan `{ "data": ... }` y los errores `{ "error": { "code", "message", "fields"? } }`.

## Troubleshooting

**`Variables de entorno inválidas` al arrancar**
Faltan `JWT_ACCESS_SECRET` o `JWT_REFRESH_SECRET`, o tienen menos de 32 caracteres.

**`ER_NOT_SUPPORTED_YET` o `CHECK` ignorado en MySQL**
La versión de MySQL es anterior a 8.0.16. Actualizá a 8.0.16+ (recomendado 8.0.36
o 8.4 LTS) y volvé a correr `npm run db:migrate`.

**`Access denied for user`**
Revisá `DB_USER`, `DB_PASSWORD` y `DB_HOST` de `server/.env` y que el usuario
tenga permisos sobre la base `study_tracker`.

**El login o el registro devuelven `429 RATE_LIMITED`**
El límite es de 5 registros por hora y 10 intentos de login por 15 minutos y por
IP. En desarrollo se puede reiniciar la API para limpiar el contador (vive en
memoria) o esperar la ventana.

**El navegador muestra una versión vieja o una pantalla en blanco**
Hay un segundo servidor de Vite levantado en otro puerto. Cerralo y usá
`http://localhost:5173` con una recarga forzada (`Ctrl+Shift+R`).

**Las cookies no llegan a la API**
Verificá que `CLIENT_ORIGIN` coincida con la URL del cliente y que el navegador
esté en `http://localhost:5173` (el proxy de Vite reenvía `/api` al puerto 4000).

## Estado

Fases 1 a 6 completadas: autenticación multiusuario, CRUD de materias,
temporizador libre y fijo con recuperación y guardado idempotente, dashboard
diario, reportes por semana y mes, extremos, racha, heatmap anual responsive y
ajustes de cuenta (perfil, zona horaria, umbrales del heatmap y cambio de
contraseña). Incluye toasts, manejo de errores en español y auditoría de
seguridad, performance y regresión MySQL documentadas en
[`docs/QA.md`](docs/QA.md).

## Documentación

- [`docs/constitution.md`](docs/constitution.md) — principios innegociables del proyecto.
- [`MEMORY.md`](MEMORY.md) — estado real del proyecto, decisiones y próximos pasos.
- [`docs/API.md`](docs/API.md) — referencia de la API.
- [`docs/QA.md`](docs/QA.md) — auditorías de seguridad, performance y regresión MySQL.
- [`specs/001-sistema-estudio/spec.md`](specs/001-sistema-estudio/spec.md) — requisitos.
- [`specs/001-sistema-estudio/plan.md`](specs/001-sistema-estudio/plan.md) — plan de implementación.
- [`specs/001-sistema-estudio/tasks.md`](specs/001-sistema-estudio/tasks.md) — checklist de tareas.
