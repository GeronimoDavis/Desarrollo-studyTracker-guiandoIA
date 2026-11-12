---
description: SDD · Crea una nueva spec por funcionalidad, planifica y divide en tareas sin tocar código
agent: plan
---
NO escribas ni modifiques código de la aplicación todavía.

Antes de hacer nada, lee obligatoriamente:
1. `AGENTS.md`
2. `docs/constitution.md`
3. `MEMORY.md`

Nueva funcionalidad solicitada: $ARGUMENTS

Sigue estrictamente este flujo SDD:
1. **Entrevista de aclaración:** Hazme preguntas de UNA en UNA (máximo 5) para eliminar ambigüedades, definir casos límite y qué queda fuera de alcance. Espera mis respuestas.
2. **Especificación (`specs/NNN-nombre/spec.md`):** Crea una carpeta nueva con el siguiente número correlativo (`002-`, `003-`, etc.). Redacta `spec.md` solo con el QUÉ y el POR QUÉ usando requisitos verificables en notación EARS (en español) y `Estado: borrador`.
3. **Planificación (`specs/NNN-nombre/plan.md`):** Una vez que apruebe la spec, genera `plan.md` detallando archivos a crear/modificar, funciones puras, pseudocódigo, decisiones técnicas y estrategia de pruebas, cubriendo cada RF y respetando `docs/constitution.md`.
4. **Tareas (`specs/NNN-nombre/tasks.md`):** Divide el plan en tareas pequeñas (máx. 20-30 min cada una) con checkboxes `- [ ] **Tn.**`, sus RF asociados y una línea `Hecho cuando:` verificable.
5. **Memoria:** Actualiza `MEMORY.md` (máximo 50 líneas) registrando la nueva spec creada y detente esperando mi orden para pasar a desarrollo.
