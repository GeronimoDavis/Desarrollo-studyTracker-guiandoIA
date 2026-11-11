import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabase } from './config/db.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(
    `[server] API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`
  );
});

async function shutdown(signal) {
  console.log(`[server] ${signal} recibido, cerrando...`);

  server.close(async () => {
    try {
      await closeDatabase();
      process.exit(0);
    } catch (error) {
      console.error('[server] Error al cerrar la base:', error.message);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('[server] Cierre forzado por timeout.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
