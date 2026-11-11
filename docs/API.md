# API del Sistema de Seguimiento de Estudio

Base URL en desarrollo: `http://localhost:4000/api`.

- Las respuestas exitosas usan el sobre `{ "data": ... }`.
- Los errores usan `{ "error": { "code", "message", "fields"? } }`.
- La autenticación usa cookies httpOnly: `st_access` (15 min) y `st_refresh` (7 días).
- Los endpoints marcados con **Auth** requieren la cookie de acceso.
- Las fechas de calendario usan `YYYY-MM-DD` en la zona IANA del usuario.
- Los timestamps `startedAt` y `endedAt` son ISO 8601 con `Z` u offset.
- `session_date` nunca se envía desde el cliente: el backend la deriva desde `startedAt` y `users.timezone`.

## Autenticación

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Crea usuario, settings y cookies. |
| POST | `/auth/login` | No | Inicia sesión y setea cookies. |
| POST | `/auth/refresh` | Refresh | Rota el refresh token. |
| POST | `/auth/logout` | No | Revoca el refresh token y limpia cookies. |
| GET | `/auth/me` | Sí | Devuelve el usuario actual. |
| PATCH | `/auth/me` | Sí | Actualiza nombre y/o zona horaria. |
| PATCH | `/auth/password` | Sí | Cambia la contraseña y cierra la sesión. |

### POST `/auth/register`

```json
{
  "name": "Ana Pérez",
  "email": "ana@example.com",
  "password": "Password1!",
  "timezone": "America/Argentina/Buenos_Aires"
}
```

Respuesta `201`:

```json
{
  "data": {
    "user": {
      "id": 1,
      "name": "Ana Pérez",
      "email": "ana@example.com",
      "timezone": "America/Argentina/Buenos_Aires",
      "createdAt": "2026-11-11T12:00:00.000Z",
      "updatedAt": "2026-11-11T12:00:00.000Z"
    }
  }
}
```

### PATCH `/auth/me`

```json
{
  "name": "Ana María Pérez",
  "timezone": "Europe/Madrid"
}
```

### PATCH `/auth/password`

```json
{
  "currentPassword": "Password1!",
  "newPassword": "NewPassword2!"
}
```

Respuesta `204` sin cuerpo.

## Materias

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/subjects` | Sí | Lista materias activas. `?includeArchived=1` incluye archivadas. |
| POST | `/subjects` | Sí | Crea una materia. |
| GET | `/subjects/:id` | Sí | Detalle de una materia propia. |
| PUT | `/subjects/:id` | Sí | Edita nombre, color o descripción. |
| DELETE | `/subjects/:id` | Sí | Archiva si tiene sesiones; si no, elimina. |
| POST | `/subjects/:id/restore` | Sí | Restaura una materia archivada. |
| GET | `/subjects/:id/stats` | Sí | Semana, mes, año y últimas sesiones. |

### POST `/subjects`

```json
{
  "name": "Matemática",
  "color": "#6366F1",
  "description": "Álgebra y análisis"
}
```

Respuesta `201`:

```json
{
  "data": {
    "subject": {
      "id": 3,
      "name": "Matemática",
      "color": "#6366F1",
      "description": "Álgebra y análisis",
      "isArchived": false,
      "createdAt": "2026-11-11T12:00:00.000Z",
      "updatedAt": "2026-11-11T12:00:00.000Z"
    }
  }
}
```

El nombre es único por usuario sin distinguir mayúsculas. El color se normaliza a `#RRGGBB` en mayúsculas.

### DELETE `/subjects/:id`

- Si la materia no tiene sesiones: `204` y se elimina físicamente.
- Si tiene sesiones: `200` con `{ "data": { "subject": {...}, "deleted": false } }` y queda archivada.

### GET `/subjects/:id/stats`

Devuelve totales de semana, mes y año, última fecha de estudio, total de sesiones y las 5 sesiones más recientes.

## Sesiones

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/sessions` | Sí | Guarda una sesión finalizada. |
| GET | `/sessions` | Sí | Historial filtrado y paginado. |

### POST `/sessions`

```json
{
  "clientId": "7a5f0f4e-9c1a-4f0e-9a4e-2f7c1d3b8e11",
  "subjectId": 3,
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

- `clientId` debe ser un UUID y es idempotente por usuario.
- `mode`: `free` o `fixed`.
- `status`: `completed` o `abandoned`.
- `effectiveSeconds`: entero de hasta 86400; debe ser al menos 60 o la sesión se rechaza con `INVALID_SESSION`. No incluye descansos.
- En modo libre, `targetMinutes`, `breakMinutes` y `breakCount` deben ser `null` u omitirse.
- En modo fijo, el plan debe coincidir exactamente con la tabla de descansos.
- `completed` fijo exige `effectiveSeconds` ≈ `targetMinutes * 60` (±5 s).
- `abandoned` fijo exige `effectiveSeconds < targetMinutes * 60`.
- No se permiten solapamientos con otras sesiones del mismo usuario.

Respuesta `201` (nueva) o `200` (idempotente):

```json
{
  "data": {
    "session": {
      "id": 10,
      "clientId": "7a5f0f4e-9c1a-4f0e-9a4e-2f7c1d3b8e11",
      "subjectId": 3,
      "subject": {
        "id": 3,
        "name": "Matemática",
        "color": "#6366F1"
      },
      "mode": "fixed",
      "status": "completed",
      "targetMinutes": 60,
      "breakMinutes": 5,
      "breakCount": 3,
      "effectiveSeconds": 3600,
      "effectiveMinutes": 60,
      "startedAt": "2026-11-11T13:00:00.000Z",
      "endedAt": "2026-11-11T14:15:00.000Z",
      "sessionDate": "2026-11-11",
      "createdAt": "2026-11-11T14:16:00.000Z"
    },
    "created": true
  }
}
```

### Planes fijos válidos

| Objetivo | 5 min | 10 min | 15 min |
| ---: | ---: | ---: | ---: |
| 30 min | 1 | 1 | 1 |
| 60 min | 3 | 2 | 1 |
| 120 min | 6 | 4 | 2 |
| 180 min | 9 | 6 | 3 |
| 240 min | 12 | 8 | 4 |
| 300 min | 15 | 10 | 5 |

### GET `/sessions`

Filtros opcionales:

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `from` | `YYYY-MM-DD` | Desde `session_date` (inclusive). |
| `to` | `YYYY-MM-DD` | Hasta `session_date` (inclusive). |
| `subjectId` | entero | Filtra por materia. |
| `status` | `completed` o `abandoned` | Filtra por estado. |
| `mode` | `free` o `fixed` | Filtra por modo. |
| `limit` | 1–100, default 50 | Tamaño de página. |
| `offset` | ≥ 0, default 0 | Desplazamiento. |

Respuesta:

```json
{
  "data": {
    "sessions": [],
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 0
    }
  }
}
```

## Estadísticas

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/dashboard` | Sí | Hoy + semana + racha en una llamada. |
| GET | `/stats/daily` | Sí | Reporte diario por materia. |
| GET | `/stats/period` | Sí | Serie diaria, materias y extremos. |
| GET | `/stats/streak` | Sí | Racha actual y mejor histórica. |
| GET | `/stats/heatmap` | Sí | Matriz anual de 365/366 días. |

### GET `/stats/daily?date=YYYY-MM-DD`

`date` es opcional; por defecto usa hoy en la zona del usuario. Incluye sesiones `completed` y `abandoned`.

```json
{
  "data": {
    "date": "2026-11-11",
    "totalSeconds": 780,
    "totalMinutes": 13,
    "sessions": 3,
    "subjects": [
      {
        "subjectId": 4,
        "name": "Historia",
        "color": "#F59E0B",
        "effectiveSeconds": 600,
        "effectiveMinutes": 10,
        "sessions": 1
      }
    ]
  }
}
```

### GET `/stats/period?period=week|month|year&date=YYYY-MM-DD`

- `period` por defecto es `week`.
- `date` por defecto es hoy en la zona del usuario.
- La semana va de lunes a domingo.
- Los días sin sesiones se devuelven con `effectiveSeconds: 0`.
- Los extremos solo consideran días con al menos 60 segundos. En empate gana la fecha más reciente. Sin datos, ambos son `null`.

```json
{
  "data": {
    "period": "week",
    "startDate": "2026-11-09",
    "endDate": "2026-11-15",
    "totalSeconds": 300,
    "totalMinutes": 5,
    "sessions": 3,
    "days": [
      { "date": "2026-11-09", "effectiveSeconds": 60, "effectiveMinutes": 1 }
    ],
    "subjects": [
      {
        "subjectId": 3,
        "name": "Matemática",
        "color": "#6366F1",
        "effectiveSeconds": 300,
        "effectiveMinutes": 5,
        "sessions": 3
      }
    ],
    "extremes": {
      "most": { "date": "2026-11-11", "effectiveSeconds": 120, "effectiveMinutes": 2 },
      "least": { "date": "2026-11-09", "effectiveSeconds": 60, "effectiveMinutes": 1 }
    }
  }
}
```

### GET `/stats/streak?date=YYYY-MM-DD`

`date` es opcional y permite calcular la racha como si fuera ese día.

```json
{
  "data": {
    "current": 3,
    "best": 5,
    "today": "2026-11-11",
    "lastCompletedDate": "2026-11-11"
  }
}
```

Reglas:

- Solo cuentan sesiones `completed`.
- Si hoy tiene actividad, se cuenta desde hoy.
- Si hoy no tiene y ayer sí, la racha sigue viva y se cuenta desde ayer.
- Si la última fecha completada es anterior a ayer, la racha actual es `0`.

### GET `/stats/heatmap?year=YYYY`

`year` es opcional; por defecto es el año actual en la zona del usuario.

```json
{
  "data": {
    "year": 2026,
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "thresholds": [60, 120, 240, 480],
    "totalSeconds": 54060,
    "totalMinutes": 901,
    "activeDays": 5,
    "days": [
      {
        "date": "2026-01-01",
        "effectiveSeconds": 60,
        "effectiveMinutes": 1,
        "level": 1,
        "isFuture": false
      }
    ]
  }
}
```

Niveles:

- `0`: sin actividad.
- `1`: al menos 1 minuto y menos que el primer umbral.
- `2`: desde el primer umbral y menos que el segundo.
- `3`: desde el segundo umbral y menos que el tercero.
- `4`: desde el tercer umbral.

Los días futuros tienen `level: null` y `isFuture: true`.

### GET `/dashboard`

```json
{
  "data": {
    "today": { "...": "reporte diario" },
    "period": { "...": "reporte semanal" },
    "streak": { "...": "racha actual" }
  }
}
```

## Ajustes

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| GET | `/settings` | Sí | Lee los ajustes; si no existe fila, usa defaults. |
| PUT | `/settings` | Sí | Upsert de los cuatro umbrales. |

### PUT `/settings`

```json
{
  "heatmapThresholds": [30, 60, 120, 240]
}
```

- Deben ser exactamente cuatro enteros positivos.
- Deben estar en orden estrictamente ascendente.
- Defaults: `[60, 120, 240, 480]`.

Respuesta:

```json
{
  "data": {
    "settings": {
      "heatmapThresholds": [30, 60, 120, 240]
    }
  }
}
```

## Códigos de error

| Código | HTTP | Cuándo |
| --- | --- | --- |
| `VALIDATION_ERROR` | 422 | Payload o query inválidos; incluye `fields`. |
| `UNAUTHENTICATED` | 401 | Falta la cookie de acceso o no es válida. |
| `TOKEN_EXPIRED` | 401 | El access token expiró. |
| `INVALID_CREDENTIALS` | 401 | Email o contraseña incorrectos. |
| `EMAIL_IN_USE` | 409 | El email ya está registrado. |
| `DUPLICATE_NAME` | 409 | Ya existe una materia con ese nombre. |
| `SUBJECT_ARCHIVED` | 422 | La materia está archivada. |
| `INVALID_SESSION` | 422 | Reglas de sesión, plan, tiempos o fechas inválidas. |
| `SESSION_OVERLAP` | 409 | La sesión se superpone con otra del usuario. |
| `NOT_FOUND` | 404 | El recurso no existe o pertenece a otro usuario. |
| `RATE_LIMITED` | 429 | Se superó el límite de intentos. |
| `INTERNAL_ERROR` | 500 | Error inesperado del servidor. |

Ejemplo de error de validación:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisá los datos ingresados.",
    "fields": {
      "effectiveSeconds": "La sesión debe tener al menos 60 segundos efectivos."
    }
  }
}
```
