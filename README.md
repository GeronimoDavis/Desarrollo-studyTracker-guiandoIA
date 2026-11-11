# Sistema de Seguimiento de Estudio

Aplicación web multiusuario para registrar y analizar el tiempo de estudio por materia, con temporizador libre/fijo, rachas, reportes y heatmap anual.

## Stack

- **Backend:** Node.js + Express 5 + MySQL 8.x (`mysql2`).
- **Frontend:** React 19 + Vite + Tailwind CSS 4 + React Router.
- **Base de datos:** `study_tracker` en MySQL 8.x, InnoDB, `utf8mb4_0900_ai_ci`.
- **Autenticación:** JWT de acceso + refresh token rotativo en cookies httpOnly.

## Requisitos

- Node.js 22 o superior.
- MySQL 8.0.16 o superior (las `CHECK` constraints se aplican desde esa versión).
- Base `study_tracker` creada.

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
```

`server/.env` no se versiona.

## Base de datos y migraciones

La base ya existe. El runner registra un baseline si las tablas están creadas y no vuelve a ejecutar DDL destructivo:

```bash
npm run db:migrate
```

La migración reproducible está en `server/src/db/migrations/001_init.sql` y usa `utf8mb4_0900_ai_ci`.

## Desarrollo

```bash
npm run dev
```

- API: <http://localhost:4000>
- Cliente: <http://localhost:5173>
- Health check: <http://localhost:4000/api/health>

El cliente usa el proxy de Vite para `/api`, así que las cookies funcionan en mismo origen durante el desarrollo.

## Scripts útiles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta API y cliente con `concurrently`. |
| `npm run dev:server` | Solo API con Nodemon. |
| `npm run dev:client` | Solo cliente con Vite. |
| `npm run db:migrate` | Ejecuta el runner de migraciones/baseline. |
| `npm --prefix server run seed -- --email=tu@email.com` | Limpia y siembra materias y sesiones de desarrollo para un usuario existente. |
| `npm run build` | Compila el cliente. |
| `npm test` | Ejecuta las pruebas de ambos workspaces. |
| `npm run lint` | Ejecuta los linters configurados. |

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

## Estado

Fases 1–3 completadas: autenticación multiusuario, materias, sesiones, reportes diarios/periódicos, extremos, racha y heatmap anual. La siguiente fase es el temporizador.

## Documentación

- [`docs/API.md`](docs/API.md)
- `specs/001-sistema-estudio/plan.md`
- `specs/001-sistema-estudio/tasks.md`
