# QA y auditorías — Fase 6

Fecha de la verificación: 2026-11-11.

Entorno usado: Windows 11, Node 26, MySQL 8.0.46 (InnoDB, `utf8mb4_0900_ai_ci`),
cliente Vite en `http://localhost:5173` y API Express en `http://localhost:4000`.
Las verificaciones se hicieron contra la base real `study_tracker`, con usuarios
temporarios que se eliminan al terminar.

---

## T94 — Auditoría de seguridad

| Punto | Estado | Evidencia |
| --- | --- | --- |
| Cookies de sesión | OK | `st_access` (path `/api`) y `st_refresh` (path `/api/auth`) con `httpOnly`, `SameSite=Lax` y `secure` según `COOKIE_SECURE`. Se borran al logout y al cambiar la contraseña. |
| Tokens | OK | Access JWT de 15 min, refresh JWT de 7 días rotativo. En la base solo se guarda el hash SHA-256 del refresh token, con `revoked_at` y expiración. |
| Contraseñas | OK | `bcryptjs` con coste 12. El login de un email inexistente responde igual que uno con contraseña incorrecta (hash señuelo). |
| Rate limiting | OK | API 300 req/15 min, registro 5/h, login 10/15 min por `ip + email`, refresh 30/min. El `keyGenerator` del login usa `ipKeyGenerator` de la librería, que normaliza IPv6 a un /56 para que un /64 completo no evada el límite. Respuesta `429 RATE_LIMITED`. |
| Origen y CORS | OK | `cors` con `origin: CLIENT_ORIGIN` y `credentials: true`; además `originCheck` rechaza con `403 ORIGIN_NOT_ALLOWED` los métodos mutantes enviados desde otro origen. |
| Cabeceras y cuerpo | OK | `helmet()` activo, `x-powered-by` deshabilitado y body JSON limitado a 100 kB. |
| SQL parametrizado | OK | Todos los valores viajan como placeholders `?`. Los fragmentos interpolados son listas de columnas y condiciones construidas con valores fijos, nunca datos del usuario. |
| Errores al cliente | OK | `errorHandler` sólo expone `message` cuando el error es público; los 500 se registran en el servidor sin stack para el cliente. |
| Secretos | OK | `server/.env` está en `.gitignore`; en el repositorio sólo existe `server/.env.example`. No hay credenciales en el código ni en los logs. |
| Logs | OK | `morgan` sólo en desarrollo. No se registran contraseñas, tokens ni cookies. |
| Aislamiento por usuario | OK | Todos los repositorios filtran por `user_id`; un recurso ajeno responde `404 NOT_FOUND` (verificado con dos usuarios). |

Sin hallazgos críticos.

---

## T95 — Performance con 10 000 sesiones

Se generaron 10 000 sesiones para un usuario temporal (4 materias, 365 días) y se
midieron 5 iteraciones de cada endpoint.

| Endpoint | Promedio | Máximo | Objetivo |
| --- | --- | --- | --- |
| `GET /api/dashboard` | 27,0 ms | 32,8 ms | < 2000 ms |
| `GET /api/stats/period?period=week` | 12,9 ms | 19,0 ms | < 300 ms |
| `GET /api/stats/period?period=month` | 15,5 ms | 16,6 ms | < 300 ms |
| `GET /api/stats/heatmap` | 24,0 ms | 31,2 ms | < 300 ms |
| `GET /api/stats/daily` | 13,4 ms | 18,6 ms | < 300 ms |
| `GET /api/subjects` | 12,3 ms | 16,4 ms | < 300 ms |
| `GET /api/sessions?limit=100` | 51,7 ms | 73,8 ms | < 300 ms |

Índices usados por las consultas del dashboard (`EXPLAIN`):

| Consulta | Índice | Tipo | Filas |
| --- | --- | --- | --- |
| Suma por día (heatmap y período) | `idx_sessions_user_date` | range | 840 |
| Días completados (racha) | `idx_sessions_user_date` | ref | 5001 |
| Desglose por materia | `idx_subjects_user_archived` + `idx_sessions_user_subject_date` | ref | 4 |

Los objetivos de NFR-01 se cumplen con margen.

---

## T96 — Regresión MySQL 8.x

| Comprobación | Resultado |
| --- | --- |
| Versión | 8.0.46 |
| Motor de las 6 tablas | InnoDB |
| Collation | `utf8mb4_0900_ai_ci` en todas las tablas |
| `CHECK` activos | 10 (`users`, `subjects`, `study_sessions`, `user_settings`) |
| `user_settings.heatmap_thresholds` | tipo `json`, default `json_array(60,120,240,480)` |
| `schema_migrations` | `001_init.sql` registrada |
| Violaciones rechazadas por la base | nombre de usuario corto, color inválido, `effective_seconds` fuera de rango, plan fijo inconsistente, umbrales con cantidad incorrecta y umbrales que no son un array |

La regla de "umbrales ascendentes" no está en el `CHECK` (sólo valida que sea un
array JSON de 4 elementos): se valida en la API con Zod, que responde `422`.

---

## T98 — Checklist manual de `AGENTS.md`

28 comprobaciones ejecutadas contra la API y contrastadas con SQL manual. Todas
pasaron:

| Comprobación | Resultado |
| --- | --- |
| `POST /auth/register` | 201 |
| `GET /auth/me` devuelve la zona horaria del usuario | OK |
| `POST /subjects` | 201 |
| Materia con nombre duplicado (case-insensitive) | 409 `DUPLICATE_NAME` |
| `POST /sessions` (libre y fija) | 201 |
| `session_date` derivada de `startedAt` y de la zona del usuario | `2026-11-07` para una sesión iniciada a las 23:30 (-03:00) |
| Tiempo efectivo guardado en segundos | 120 s |
| Idempotencia por `clientId` | 200, `created: false`, 1 fila en la base |
| Solapamiento | 409 `SESSION_OVERLAP` |
| Sesión menor a 60 s | 422 |
| `GET /sessions` coincide con SQL | 4 = 4 |
| `GET /stats/daily` coincide con SQL | 3600 s / 1 sesión |
| `GET /stats/period` (semana y mes) coincide con SQL | 420 s y 4620 s |
| `GET /stats/heatmap` coincide con SQL ylevels correctos | 4620 s, nivel 2 para 60 min |
| `GET /dashboard` racha coincide con los días completados | 4 días |
| `GET`/`PUT /settings` | default `[60,120,240,480]`, update `[30,60,120,240]` |
| `GET /subjects/:id/stats` | 200 |
| `DELETE /subjects/:id` archiva y conserva las sesiones | `is_archived = 1`, 2 sesiones intactas |
| Sesión sobre materia archivada | 422 `SUBJECT_ARCHIVED` |
| `DELETE /subjects/:id` sin sesiones | 204 y fila eliminada |
| Aislamiento entre usuarios | 404 para un recurso ajeno |
| `POST /auth/logout` invalida la sesión | 204 y luego 401 |

Además, la Fase 6 se validó en navegador (Edge headless): dashboard, reportes,
temporizador y ajustes renderizan, el perfil se guarda, los umbrales se guardan y
recalculan la vista previa, un umbral no ascendente muestra el error en español y
una contraseña actual incorrecta muestra `La contraseña actual no es correcta.`

---

## Tema oscuro (spec 002)

| Comprobación | Resultado |
| --- | --- |
| Preferencia guardada en `localStorage` (`study-tracker:theme`) | Se lee y escribe sin excepciones; valor corrupto → tema claro y se corrige |
| Tema aplicado antes del primer pintado | `data-theme` en `<html>` desde el script inline de `index.html`; sin destello |
| Valores computados en modo oscuro | fondo `rgb(2, 6, 23)`, tarjeta `rgb(15, 23, 42)`, texto `rgb(248, 250, 252)`, borde `rgb(30, 41, 59)` |
| Alternancia y persistencia | El toggle alterna, guarda y sobrevive a la recarga; sin errores de consola |
| Contraste WCAG AA en modo oscuro | **0 textos por debajo del mínimo** en login, dashboard, reportes, temporizador, ajustes, materias y detalle de materia (gate headless que mide el color de cada texto sobre su fondo real) |
| Auditoría estática de clases | `client/src/themeAudit.test.js` verifica que toda clase de color usada tenga equivalente oscuro en `index.css` (allowlist documentada de acentos y overlays) |
| Backend, base de datos y API | Sin cambios: la spec 002 es sólo presentación |

Evidencia: capturas por pantalla en modo oscuro y medición de contraste en el
gate headless (Edge + CDP) con usuario de prueba y datos sembrados.

---

## Observaciones

1. **Cuarto umbral del heatmap (resuelto).** El backend calcula las cinco bandas
   con los cuatro umbrales: 0 sin actividad o por debajo del primer umbral, 1
   hasta el segundo, 2 hasta el tercero, 3 hasta el cuarto y 4 a partir del
   cuarto. Un día con actividad pero por debajo del primer umbral se ve igual
   que un día sin actividad (sigue contando como día activo). La vista previa de
   Ajustes replica ese mismo cálculo.
2. **Límite de registro.** El registro permite 5 cuentas por hora y por IP. En
   desarrollo puede frenar las pruebas; reiniciar el servidor (los contadores
   viven en memoria) libera el contador.
3. **Servidor de desarrollo duplicado.** Si queda un segundo Vite levantado en
   otro puerto, el navegador puede mostrar una versión vieja del código. Se debe
   usar siempre `http://localhost:5173`.
