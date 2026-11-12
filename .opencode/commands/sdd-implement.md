---
description: SDD · Implementa UNA tarea apegándose estrictamente al plan de la spec y actualiza MEMORY.md
agent: build
---
Antes de tocar código, lee obligatoriamente `AGENTS.md`, `docs/constitution.md`, `MEMORY.md` y los archivos de `specs/$1/` (`spec.md`, `plan.md` y `tasks.md`).

Tu objetivo es implementar ÚNICAMENTE la tarea `$2` de `specs/$1/tasks.md`.

Reglas obligatorias:
1. Apégate al 100% a lo definido en `specs/$1/plan.md` y `specs/$1/spec.md`. Si algo no está en la spec o en el plan, NO lo inventes ni lo agregues: detente y pregunta.
2. Sigue el ciclo de pruebas: escribe o actualiza los tests primero, implementa el código para que pasen y verifica que todo funcione.
3. Marca la tarea `$2` como completada (`- [x]`) en `specs/$1/tasks.md`.
4. Actualiza `MEMORY.md` (manteniéndolo en ~50 líneas) con el estado actual, decisiones tomadas y errores a evitar. Si detectas una regla permanente nueva, propón moverla a `AGENTS.md`.
5. DETENTE al terminar esta tarea y muéstrame el resumen de verificación antes de continuar con la siguiente.
