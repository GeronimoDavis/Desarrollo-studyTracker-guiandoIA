# Constitución — Sistema de Seguimiento de Estudio

1. **Stack fijo.** MySQL 8.x, Express 5, React 19 y Node.js. No se cambian tecnologías ni se agregan dependencias pesadas sin permiso explícito.
2. **La spec manda.** Nada se implementa si no está en la spec activa (`specs/NNN-*/`); si falta un requisito, primero se escribe la spec.
3. **Lógica separada de la interfaz.** Rachas, tiempos efectivos, estadísticas y fechas viven en los servicios del servidor y en `client/src/lib`; los componentes solo muestran.
4. **Tests antes de cerrar.** Cada tarea se cierra con `npm test`, `npm run lint` y `npm run build` en verde; sin validación no hay tarea cerrada.
5. **Integridad de datos y fechas.** Zona horaria local del usuario en todo el negocio (nunca `toISOString()` para el día local) y solo tiempo efectivo de estudio.
6. **Un idioma por capa.** Código, base de datos y API en inglés; interfaz de usuario y documentación en español.
