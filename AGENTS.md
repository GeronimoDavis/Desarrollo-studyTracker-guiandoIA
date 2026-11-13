# AGENTS.md — Sistema de Seguimiento de Estudio

Aplicación web simple para estudiantes: registrar tiempo de estudio por materia, usar un cronómetro libre/fijo y ver rachas, reportes y heatmap.

## Inicio de Sesión (obligatorio)
- Leer `docs/constitution.md` y `MEMORY.md` **antes** de planificar o tocar código: son los principios y el estado real del proyecto.
- `MEMORY.md` se actualiza **automáticamente al terminar cada tarea o funcionalidad**, manteniéndolo en ~50 líneas (resumir en lugar de crecer).
- La spec activa es `specs/001-sistema-estudio/`; si un requisito no está ahí, primero se escribe la spec.

## Alcance y Simplicidad
- Esto es una app de estudio para estudiantes, **no un sistema empresarial ni una app para la NASA**.
- Implementar solo lo acordado en `specs/001-sistema-estudio/spec.md`, `plan.md` y `tasks.md`.
- No agregar features, capas, servicios, colas, microservicios, estado global complejo ni abstracciones prematuras.
- Preferir la solución más pequeña que cumpla el requisito. Si algo se puede resolver con un componente, un hook y SQL directo, hacerlo así.
- Evitar optimizaciones, patrones o dependencias que no resuelvan un problema actual y concreto.
- Ante una duda de alcance, elegir lo simple y preguntar antes de expandir.

## Stack y Estructura
- **Backend:** Node.js, Express 5 y MySQL 8.x con `mysql2`.
- **Frontend:** React 19, Vite, Tailwind CSS 4 y React Router 7; gráficos en SVG/CSS propios (sin librería de charts).
- **Estructura:**
  - `/server`: API REST, controladores, rutas, servicios, repositorios y esquemas Zod.
  - `/client`: React, vistas, hooks, servicios API y lógica del cronómetro.
  - `/specs`: especificación, plan y checklist de tareas.
  - `/docs`: documentación de la API (`API.md`), constitución (`constitution.md`) y evidencia de QA (`QA.md`).
  - `/MEMORY.md`: estado real del proyecto; se actualiza al cerrar cada tarea.

## Comandos
- `npm run dev`: Inicia servidor y cliente.
- `npm --prefix server run dev`: API con Nodemon.
- `npm --prefix client run dev`: Cliente con Vite.
- `npm test`: Tests de server y client.
- `npm run lint`: Lint de ambos workspaces.
- `npm run build`: Build del cliente.
- `npm --prefix server run seed -- --email=...`: Datos de desarrollo para un usuario existente.

## Convenciones
- **Idioma:** Código, variables y comentarios en inglés; interfaz y mensajes de usuario en español.
- **Backend:** Validar con Zod, separar controlador/servicio/repositorio y parametrizar todo SQL.
- **Frontend:** Componentes funcionales y modulares; hooks para datos y estado del cronómetro; sin librerías de estado innecesarias.
- **Respuestas API:** Éxito `{ data: ... }`; error `{ error: { code, message, fields? } }`.

## Reglas de Dominio / Trampas Conocidas
- **Fechas:** Usar la zona horaria local del usuario. No usar `toISOString()` para calcular el día local.
- **`session_date`:** La deriva el backend desde `startedAt` y `users.timezone`; el cliente nunca la envía.
- **Rachas:** Solo cuentan sesiones `completed`. Si hoy no hay sesión pero ayer sí, la racha sigue viva hasta terminar el día.
- **Cronómetro libre:** Conteo ascendente; las pausas no suman tiempo efectivo.
- **Cronómetro fijo:** Conteo descendente por bloques con descansos de 5, 10 o 15 min. El tiempo efectivo excluye descansos.
- **Idempotencia:** Reintentar el guardado con el mismo `clientId` debe devolver la sesión existente, no duplicarla.
- **Solapamiento:** El backend rechaza sesiones superpuestas del mismo usuario con `SESSION_OVERLAP`.
- **Heatmap:** Año calendario local, 365/366 días, días futuros neutros y cinco bandas según los cuatro umbrales de settings.
- **Rate limit:** todo `keyGenerator` propio debe usar `ipKeyGenerator` (IPv6 a /56) o la librería avisa `ERR_ERL_KEY_GEN_IPV6` al arrancar.

## Forma de Trabajar
- Planificar primero la estructura del módulo antes de implementar.
- Hacer cambios pequeños e iterativos: primero backend/datos, luego integración React.
- No reescribir archivos completos si alcanza con un cambio puntual.
- Mantener la UI clara, en español y sin sobrecargar de opciones.
- Cerrar cada fase actualizando `tasks.md`, ejecutando tests/lint/build y documentando lo necesario.

## Git y Entrega
- Repositorio remoto: `origin` (`GeronimoDavis/Desarrollo-studyTracker-guiandoIA`).
- Trabajar sobre `main`.
- Hacer commits pequeños y descriptivos por bloque de trabajo.
- Pushear al finalizar cada fase o bloque importante.
- **Preguntar antes de commitear:** no ejecutar `git commit` ni `git push` sin autorización explícita del usuario en la sesión. Informar qué archivos entran, el mensaje del commit y esperar el OK.
- **Nunca** commitear `server/.env`, secretos, tokens ni credenciales.

## Límites
- ✅ **Siempre:** Validar en backend, usar `.env`, mantener el alcance simple, actualizar tests cuando cambie el comportamiento.
- ⚠ **Pregunta antes:** Alterar el esquema de base de datos, agregar dependencias pesadas, cambiar rutas de API existentes o sumar features no pedidas.
- 🚫 **Nunca:** Credenciales en el código, `ALTER TABLE` sin acordar, sobreingeniería o funcionalidades fuera de la spec.

## Verificación
- Probar endpoints de auth, materias, sesiones, estadísticas y settings.
- Verificar tiempo efectivo, idempotencia, solapamiento, racha y heatmap contra SQL manual.
- Antes de cerrar una fase: `npm test`, `npm run lint` y `npm run build`.
