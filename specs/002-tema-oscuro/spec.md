# Especificación 002 — Modo oscuro

| Campo | Valor |
| --- | --- |
| ID | 002-tema-oscuro |
| Versión | 1.0 — aprobada |
| Fecha | 2026-11-13 |
| Estado | Aprobada |
| Stack | React 19 + Vite + Tailwind CSS 4 (variante `dark:` con atributo `data-theme`) |
| Documentos relacionados | `plan.md`, `tasks.md`, `AGENTS.md`, `docs/constitution.md`, `MEMORY.md`, `specs/001-sistema-estudio/spec.md` |

---

## 1. Objetivo

Permitir que cada estudiante alternate la interfaz del tracker entre un tema claro y
uno oscuro sin recargar la página, y que la preferencia se aplique a **toda** la
aplicación: login, registro, dashboard, materias, temporizador, reportes, ajustes y
los gráficos propios (barras, dona y heatmap).

Por qué: estudiar de noche con una pantalla blanca cansa la vista y los colores de
la app (fondos blancos y texto casi negro) fuerzan un brillo alto innecesario. El
tema oscuro no cambia datos ni reglas de negocio: es una capa de presentación, y
por eso **no** toca la base de datos ni la API.

Decisiones tomadas en la entrevista de aclaración (2026-11-13):

1. Dos estados: **claro** u **oscuro**, con un control interruptor.
2. La preferencia se guarda **en el navegador (`localStorage`)**, no en la cuenta:
   no se modifica el esquema de datos ni la API.
3. Alcance visual: **toda la app**, incluidos los gráficos SVG y el heatmap.
4. El tema se aplica **antes del primer pintado** (sin destello) leyendo la
   preferencia guardada.
5. El cambio de tema tiene **transición suave de 150–200 ms**, desactivada si el
   usuario pidió menos movimiento.

---

## 2. Alcance

### Incluido

- Control interruptor de tema en el encabezado (escritorio y móvil).
- Tema claro y oscuro completos en todas las pantallas y componentes.
- Paleta nocturna propia para el heatmap y adaptación legible para los gráficos SVG.
- Persistencia de la preferencia en `localStorage` por dispositivo y navegador.
- Aplicación del tema antes del primer pintado, sin destello ni parpadeo.
- Transición de color de 150–200 ms, desactivada con `prefers-reduced-motion`.
- Contraste mínimo AA en textos, controles y estados en ambos temas.

### Fuera de alcance

- Guardar el tema en la cuenta o sincronizarlo entre dispositivos (implica
  cambios de esquema de datos, que no se autorizaron).
- Seguir automáticamente la preferencia del sistema operativo
  (`prefers-color-scheme`): el usuario elige explícitamente.
- Elección de tema en las pantallas de login y registro (se respetan, pero el
  control sólo vive en el encabezado de la app autenticada).
- Tema por sección o por pantalla: es único para toda la aplicación.
- Impresión, exportación a PDF/CSV y vista de alto contraste (`forced-colors`).
- Cambiar los colores de las materias o la paleta de los umbrales del heatmap.

---

## 3. Glosario

| Término | Definición |
| --- | --- |
| **Tema** | Conjunto de colores de la interfaz: `light` (claro) u `oscuro` (dark). |
| **Preferencia de tema** | Valor `light` o `dark` almacenado en el navegador. |
| **Atributo de tema** | `data-theme` en el elemento `<html>`, que dispara la variante `dark:` de Tailwind. |
| **Destello (FOUC)** | Flash de tema incorrecto entre el primer pintado y la aplicación de la preferencia. |
| **Menos movimiento** | Preferencia del sistema `prefers-reduced-motion: reduce`. |

---

## 4. Reglas de negocio

| ID | Regla |
| --- | --- |
| **RN-01** | El tema sólo afecta la presentación. No modifica datos, cálculos, reglas de negocio ni el backend. |
| **RN-02** | La preferencia se guarda con una clave estable en `localStorage` y vale `light` por defecto. |
| **RN-03** | La preferencia es **por dispositivo y navegador**; no se sincroniza entre dispositivos ni entre pestañas. |
| **RN-04** | El atributo `data-theme` del documento es la única fuente de verdad para la interfaz; la UI no depende del estado de React para pintarse. |
| **RN-05** | Cambiar de tema no debe interrumpir el cronómetro en curso ni perder estado de ninguna pantalla. |
| **RN-06** | Los colores de las materias y los umbrales del heatmap no cambian con el tema. |
| **RN-07** | El estado del tema se aplica antes del primer pintado de la página. |

---

## 5. Requisitos funcionales (notación EARS)

| ID | Requisito |
| --- | --- |
| **RF-001** | La aplicación DEBE ofrecer un control para alternar entre el tema claro y el oscuro. |
| **RF-002** | Cuando el usuario activa el control de tema, el sistema DEBE alternar el tema activo entre `light` y `dark` sin recargar la página. |
| **RF-003** | El sistema DEBE persistir la preferencia de tema en `localStorage` bajo una clave estable y versionada por la app. |
| **RF-004** | Si no existe una preferencia guardada, el sistema DEBE usar el tema `light`. |
| **RF-005** | Si el valor guardado no es `light` ni `dark`, el sistema DEBE usar el tema `light` y corregir el valor almacenado. |
| **RF-006** | Si `localStorage` no está disponible (navegador privado, cookies bloqueadas), el sistema DEBE funcionar igual con el tema `light` sin mostrar errores. |
| **RF-007** | Al cargar cualquier página, el sistema DEBE aplicar la preferencia guardada **antes** del primer pintado, evitando el destello de tema. |
| **RF-008** | El control de tema DEBE estar disponible en el encabezado, tanto en escritorio como en móvil. |
| **RF-009** | El control de tema DEBE ser operable con teclado y anunciar su estado con `aria-pressed` y una etiqueta en español. |
| **RF-010** | Mientras el usuario alterna el tema, el sistema DEBE aplicar una transición de color de 150 a 200 ms. |
| **RF-011** | Si el usuario tiene activa la preferencia de menos movimiento (`prefers-reduced-motion: reduce`), el sistema DEBE desactivar la transición de tema. |
| **RF-012** | El sistema DEBE aplicar el tema a todas las pantallas: login, registro, dashboard, materias, detalle de materia, temporizador, reportes y ajustes. |
| **RF-013** | El heatmap DEBE usar una paleta legible en el tema oscuro, con contraste suficiente frente al fondo y entre niveles consecutivos. |
| **RF-014** | Los gráficos de barras y de dona DEBE conservar el color de cada materia y ser legibles en ambos temas. |
| **RF-015** | Textos, botones, campos, tablas, estados de carga, de error y vacíos DEBEN cumplir un contraste mínimo AA en los dos temas. |
| **RF-016** | Si el usuario alterna el tema con un cronómetro en curso, el sistema DEBE conservar el estado del temporizador y de la sesión en curso. |
| **RF-017** | El sistema NO DEBE modificar el backend, la base de datos ni el contrato de la API para implementar el tema. |

---

## 6. Requisitos no funcionales

| ID | Requisito |
| --- | --- |
| **RNF-01** | No se agregan dependencias: el tema se resuelve con Tailwind CSS 4, `localStorage` y una variables de atributo en el documento. |
| **RNF-02** | El impacto en el bundle es menor a 8 kB gzip. |
| **RNF-03** | El primer pintado no muestra el tema incorrecto (cero destello) en la navegación normal. |
| **RNF-04** | La conmutación de tema no dispara renderizados que bloqueen la interfaz más de 100 ms. |
| **RNF-05** | Las utilidades de tema se resuelven en funciones puras testeables, sin depender del DOM ni de React. |

---

## 7. Casos límite

| ID | Caso | Comportamiento esperado |
| --- | --- | --- |
| **CE-01** | `localStorage` contiene un valor corrupto (`"azul"`, `""`, un objeto) | Se usa `light` y el valor se corrige. |
| **CE-02** | `localStorage` lanza al leer o escribir (modo privado) | La app funciona en `light` y no registra errores en consola. |
| **CE-03** | El usuario abre dos pestañas y cambia el tema en una | Cada pestaña conserva su propio tema (no hay sincronización entre pestañas). |
| **CE-04** | El usuario cambia el tema con el cronómetro corriendo | El temporizador no se reinicia, no se pausa y la sesión en curso no se pierde. |
| **CE-05** | El usuario tiene `prefers-reduced-motion: reduce` | El cambio de tema es instantáneo. |
| **CE-06** | El usuario navega a `/login` con el tema `dark` guardado | La pantalla de login se muestra en oscuro. |
| **CE-07** | El sistema operativo está en modo oscuro pero la preferencia guardada es `light` | Se respeta `light`: el SO no manda. |
| **CE-08** | La primera visita (sin preferencia) | Se muestra `light` y no hay destello visible al cargar. |

---

## 8. Criterios de aceptación

1. El control de tema alterna la interfaz completa entre claro y oscuro sin recargar.
2. La preferencia sobrevive a una recarga del navegador y a un cierre de la app.
3. No hay destello de tema en la primera carga (verificable con el gate headless).
4. Todas las pantallas, incluidos heatmap y gráficos, son legibles en ambos temas.
5. El contraste de textos y controles cumple AA en ambos temas.
6. Los tests del cliente cubren la lógica de tema, el control y la persistencia.
7. `npm test`, `npm run lint` y `npm run build` quedan en verde.
8. No se modifican el backend, el esquema de datos ni el contrato de la API.

---

## 9. Trazabilidad con la spec 001

Esta spec **no modifica** ningún requisito de `specs/001-sistema-estudio/spec.md`:
agrega una capa de presentación opcional. Se mantienen intactos el idioma de la
interfaz (español), el aislamiento por usuario, el cálculo de tiempo efectivo, las
reglas de fechas locales y el resto de reglas de negocio.

Afecta de forma transversal a la interfaz de la spec 001 (BR-12, FR-DASH-01..12,
NFR-04, NFR-05) únicamente en la capa de color.
