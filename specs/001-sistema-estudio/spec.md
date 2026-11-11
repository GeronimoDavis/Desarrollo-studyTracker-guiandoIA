# Especificación 001 — Sistema de Seguimiento de Estudio

| Campo | Valor |
| --- | --- |
| ID | 001-sistema-estudio |
| Versión | 1.0 — multiusuario aprobada |
| Fecha | 2026-11-11 |
| Estado | Aprobada |
| Stack | Node.js + Express 5 + MySQL 8.x · React 19 + Vite + Tailwind CSS 4 + Recharts |
| Documentos relacionados | `plan.md`, `tasks.md`, `AGENTS.md` |

---

## 1. Objetivo

Construir una aplicación web multiusuario para registrar y analizar el tiempo de estudio por materia. Cada usuario debe poder crear su cuenta, iniciar sesión, organizar sus materias, usar un cronómetro libre o fijo y consultar su rendimiento diario, semanal, mensual y anual.

El producto debe responder rápidamente a estas preguntas:

1. ¿Cuánto estudié hoy y en qué materias?
2. ¿Cómo va mi semana, mi mes y mi año?
3. ¿Estoy manteniendo el hábito? (racha y heatmap).
4. ¿Qué materias concentran mi tiempo y cuándo fue mi última sesión?

---

## 2. Alcance

### Incluido

- Registro, login, refresh rotativo, logout y sesión persistente.
- Aislamiento estricto de datos por usuario.
- CRUD de materias con color, descripción y archivo lógico.
- Resumen por materia: semana, mes, año, último día y últimas sesiones.
- Cronómetro libre (ascendente) y fijo (descendente con descansos estructurados).
- Selección obligatoria de una materia activa antes de iniciar.
- Guardado de sesiones finalizadas con fecha local, timestamps UTC y tiempo efectivo.
- Reporte diario por materia.
- Reportes de período: serie por día, desglose por materia, totales y días extremos.
- Racha actual y mejor racha histórica.
- Heatmap anual con cinco niveles y umbrales configurables.
- Perfil: nombre, zona horaria y cambio de contraseña.
- Interfaz responsive en español.

### Fuera de alcance (v1)

- Roles administrativos, equipos o compartición de datos.
- Edición o borrado de sesiones ya guardadas.
- Notificaciones push, recordatorios o integración con calendario.
- Exportación a CSV/PDF.
- Modo offline completo o PWA instalable.
- Metas, tareas, apuntes o flashcards.
- Estadísticas por franja horaria o comparativas avanzadas.
- Despliegue en la nube y sincronización entre dispositivos.

---

## 3. Roles y acceso

| Rol | Permisos |
| --- | --- |
| Visitante | Registrarse e iniciar sesión. |
| Estudiante autenticado | Gestionar únicamente sus materias, sesiones, ajustes y reportes. |

Reglas de acceso:

- Toda ruta de datos requiere autenticación, salvo registro, login y health check.
- Toda consulta de `subjects`, `study_sessions`, `user_settings` y `refresh_tokens` incluye el `user_id` autenticado.
- Un recurso de otro usuario responde **404**, no 403, para no revelar su existencia.
- El frontend protege las rutas, pero la autorización real se valida siempre en el backend.

---

## 4. Glosario

| Término | Definición |
| --- | --- |
| **Usuario** | Cuenta con nombre, email único, contraseña, zona IANA y ajustes. |
| **Materia** | Categoría de estudio con nombre, color y descripción, archivabla lógicamente. |
| **Sesión** | Intervalo de estudio finalizado y guardado, asociado a una materia. |
| **Tiempo efectivo** | Segundos de estudio real. Excluye pausas, descansos y tiempo detenido. |
| **Pausa** | Detención manual del cronómetro en modo libre. No suma tiempo efectivo. |
| **Descanso** | Intervalo entre bloques de estudio en modo fijo. No suma tiempo efectivo. |
| **Día local** | Fecha `YYYY-MM-DD` en la zona horaria del usuario. |
| **Período** | Semana (lunes a domingo), mes calendario o año calendario. |
| **Racha** | Días consecutivos con al menos una sesión completada. |
| **Heatmap** | Matriz de 365/366 días donde el color representa el tiempo efectivo. |

---

## 5. Reglas de negocio

| ID | Regla |
| --- | --- |
| **BR-01** | Las fechas de negocio se calculan en la zona IANA del usuario. No se deriva un día con `toISOString().slice(0, 10)`. |
| **BR-02** | El backend deriva `session_date` desde el timestamp de inicio y la zona del usuario. El cliente no envía `session_date`. |
| **BR-03** | Una sesión que cruza medianoche se imputa al día local de su hora de inicio. |
| **BR-04** | El tiempo efectivo es la única métrica para reportes, rachas y heatmap. |
| **BR-05** | No se puede iniciar una sesión sin una materia activa seleccionada. Se valida en cliente y servidor. |
| **BR-06** | Solo se guardan sesiones con al menos 60 segundos efectivos. Las más cortas se descartan con aviso. |
| **BR-07** | La racha se calcula solo con sesiones `completed`. Si hoy no hay sesión pero ayer sí, la racha sigue viva hasta terminar el día. |
| **BR-08** | El heatmap usa el año calendario local, rellena días sin datos con 0 y deja neutros los días futuros. Umbrales por defecto: `[60, 120, 240, 480]` minutos. |
| **BR-09** | El nombre de materia es único por usuario sin distinguir mayúsculas. El índice incluye archivadas. |
| **BR-10** | Una materia con sesiones se archiva; sin sesiones puede borrarse físicamente. |
| **BR-11** | Las sesiones son inmutables en v1: no se editan ni se borran. |
| **BR-12** | La precisión interna es en segundos. La UI muestra horas y minutos; los reportes pueden redondear minutos. |

---

## 6. Requisitos funcionales

### 6.1 Autenticación y cuenta

| ID | Requisito |
| --- | --- |
| **FR-AUTH-01** | Registro con nombre 2–80, email válido único, contraseña 8–72, zona IANA y creación de ajustes por defecto. |
| **FR-AUTH-02** | Login con email y contraseña. Credenciales inválidas devuelven un error genérico `INVALID_CREDENTIALS`. |
| **FR-AUTH-03** | Access token de 15 minutos y refresh token de 7 días en cookies httpOnly `SameSite=Lax`, con rotación y detección de reutilización. |
| **FR-AUTH-04** | Logout revoca el refresh actual y limpia ambas cookies. |
| **FR-AUTH-05** | Rutas privadas sin sesión devuelven `UNAUTHENTICATED`; token vencido devuelve `TOKEN_EXPIRED` y el cliente refresca una sola vez. |
| **FR-AUTH-06** | Sesión persistente al recargar; redirección a login y retorno a la ruta solicitada. |
| **FR-AUTH-07** | Perfil editable: nombre y zona IANA; el email no se cambia en v1. |
| **FR-AUTH-08** | Cambio de contraseña con contraseña actual; al completarse se revocan todos los refresh y se cierra la sesión. |

### 6.2 Materias

| ID | Requisito |
| --- | --- |
| **FR-SUB-01** | Listar materias activas y, opcionalmente, archivadas. |
| **FR-SUB-02** | Crear y editar materia con nombre 2–80, color `#RRGGBB`, descripción ≤500. El color se normaliza. |
| **FR-SUB-03** | Ver el detalle de una materia propia con totales de semana, mes y año. |
| **FR-SUB-04** | Archivar, restaurar y borrar según las reglas de negocio. |
| **FR-SUB-05** | Mostrar `lastStudyDate`, `totalSessions` y últimas sesiones por materia. |
| **FR-SUB-06** | Validar pertenencia y unicidad; duplicado devuelve `DUPLICATE_NAME` 409. |
| **FR-SUB-07** | Devolver errores de validación por campo en español. |
| **FR-SUB-08** | La UI muestra una sección de archivadas con opción de restaurar. |
| **FR-SUB-09** | Todas las vistas tienen estados de carga, error con reintento y vacío. |

### 6.3 Sesiones y cronómetro

| ID | Requisito |
| --- | --- |
| **FR-SES-01** | Modo libre ascendente con pausas acumulativas y tiempo efectivo. |
| **FR-SES-02** | Modo fijo descendente con descansos de 5, 10 o 15 minutos según la duración, sin sumar descansos al tiempo efectivo. |
| **FR-SES-03** | Guardar sesión finalizada con materia, modo, estado, objetivo, descansos, timestamps ISO, tiempo efectivo y `clientId` UUID. |
| **FR-SES-04** | Idempotencia por `clientId`: repetir el envío devuelve la sesión existente sin duplicar. |
| **FR-SES-05** | Detectar solapamiento de sesiones del mismo usuario y devolver `SESSION_OVERLAP` 409. |
| **FR-SES-06** | Rechazar materias ajenas o archivadas y planes fijos inconsistentes. |
| **FR-SES-07** | Solo se guardan sesiones finalizadas; el cliente descarta sesiones menores a 60 segundos efectivos. |

### 6.4 Dashboard y reportes

| ID | Requisito |
| --- | --- |
| **FR-DASH-01** | Reporte diario con total, desglose por materia y cantidad de sesiones. |
| **FR-DASH-02** | Heatmap anual de 365/366 días con niveles según ajustes y días futuros neutros. |
| **FR-DASH-03** | Serie por día del período, incluyendo días sin sesiones en 0. |
| **FR-DASH-04** | Desglose por materia del período y totales. |
| **FR-DASH-05** | Día con más y menos estudio del período, solo días con ≥1 minuto; empate al más reciente y `null` sin datos. |
| **FR-DASH-06** | Racha actual y mejor racha histórica, con regla de racha viva. |
| **FR-DASH-07** | El dashboard obtiene hoy, período, extremos y racha en una llamada; el heatmap se consulta por separado. |

### 6.5 Ajustes

| ID | Requisito |
| --- | --- |
| **FR-SET-01** | Ajustes de perfil: nombre y zona IANA. |
| **FR-SET-02** | Umbrales del heatmap: cuatro valores ascendentes, defaults `[60,120,240,480]`, GET con fallback y PUT con upsert. |

---

## 7. Contrato de API

Prefijo `/api`. Las respuestas exitosas usan `{ "data": ... }`. Los errores usan:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revisá los datos ingresados.",
    "fields": { "name": "El nombre es obligatorio." }
  }
}
```

| Método | Ruta | Auth | Descripción |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | No | Registro y cookies |
| POST | `/api/auth/login` | No | Login y cookies |
| POST | `/api/auth/refresh` | Refresh | Rotar tokens |
| POST | `/api/auth/logout` | Sí/Refresh | Revocar y limpiar cookies |
| GET | `/api/auth/me` | Sí | Usuario actual |
| PATCH | `/api/auth/me` | Sí | Nombre y zona horaria |
| PATCH | `/api/auth/password` | Sí | Cambiar contraseña |
| GET | `/api/subjects` | Sí | Listar materias |
| POST | `/api/subjects` | Sí | Crear materia |
| GET | `/api/subjects/:id` | Sí | Detalle |
| PUT | `/api/subjects/:id` | Sí | Editar |
| DELETE | `/api/subjects/:id` | Sí | Archivar o borrar |
| POST | `/api/subjects/:id/restore` | Sí | Restaurar |
| GET | `/api/subjects/:id/stats` | Sí | Resumen por materia |
| POST | `/api/sessions` | Sí | Guardar sesión finalizada |
| GET | `/api/sessions` | Sí | Historial filtrado |
| GET | `/api/dashboard` | Sí | Hoy + período + extremos + racha |
| GET | `/api/stats/daily` | Sí | Reporte diario |
| GET | `/api/stats/period` | Sí | Serie y desglose del período |
| GET | `/api/stats/heatmap` | Sí | Heatmap anual |
| GET | `/api/settings` | Sí | Ajustes |
| PUT | `/api/settings` | Sí | Actualizar umbrales |

Códigos de error: `VALIDATION_ERROR` 422, `UNAUTHENTICATED` 401, `TOKEN_EXPIRED` 401, `INVALID_CREDENTIALS` 401, `EMAIL_IN_USE` 409, `DUPLICATE_NAME` 409, `SUBJECT_ARCHIVED` 422, `INVALID_SESSION` 422, `SESSION_OVERLAP` 409, `NOT_FOUND` 404, `RATE_LIMITED` 429, `INTERNAL_ERROR` 500.

---

## 8. Requisitos no funcionales

| ID | Requisito |
| --- | --- |
| **NFR-01** | Node.js 22 LTS, Express 5 y MySQL 8.x local en el puerto 3306. |
| **NFR-02** | Seguridad: bcryptjs coste 12, cookies httpOnly, secretos separados, rate limits, Helmet, CORS restringido y Origin validado en métodos mutantes. |
| **NFR-03** | Refresh single-flight en el cliente: una sola llamada ante `TOKEN_EXPIRED`, reintento único y logout si falla. |
| **NFR-04** | Interfaz responsive en español, accesible por teclado y con estados claros. |
| **NFR-05** | SQL parametrizado, sin ORM y con consultas filtradas por `user_id`. |
| **NFR-06** | `npm run dev` levanta API y cliente; `/api/health` verifica API y base. |
| **NFR-07** | README con instalación, variables, migración y troubleshooting. |
| **NFR-08** | Migraciones idempotentes y esquema congelado; cambios requieren aprobación. |
| **NFR-09** | Tests de servicios, endpoints y componentes con Vitest, Supertest y Testing Library. |
| **NFR-10** | Credenciales solo en `.env`; nunca en el código ni en logs. |
| **NFR-11** | Aislamiento entre usuarios verificado con tests de recursos ajenos. |

---

## 9. Criterios de aceptación globales

1. Un visitante puede registrarse, iniciar sesión, recargar y cerrar sesión.
2. Dos usuarios no pueden ver ni modificar datos del otro.
3. Un usuario puede crear, editar, archivar, restaurar y borrar materias según las reglas.
4. El temporizador libre y el fijo guardan únicamente tiempo efectivo.
5. Los reportes diario, semanal, mensual y anual coinciden con consultas SQL manuales.
6. La racha y el heatmap respetan la zona horaria local y las reglas de negocio.
7. Los errores de validación se muestran por campo y en español.
8. `npm test`, `npm run lint` y `npm run build` pasan antes de cerrar cada fase.
9. No hay credenciales versionadas.
10. La documentación (`spec.md`, `plan.md`, `tasks.md`) coincide con la implementación.

---

## 10. Trazabilidad

- `plan.md`: decisiones técnicas, esquema, arquitectura y contrato de API detallado.
- `tasks.md`: desglose verificable T1–T103 y gates por fase.
- `AGENTS.md`: convenciones, reglas de dominio y límites de cambio.
