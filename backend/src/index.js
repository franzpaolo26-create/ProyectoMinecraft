// backend/src/index.js
// Punto de entrada del backend (ESM).
// - Arranca Express en HOST/PORT para que funcione en LAN.
// - Cierre limpio: libera el puerto y cierra el pool de Postgres.

import app from './app.js';
import config from './config.js';
import 'dotenv/config';
import { pool } from './db.js';

// Arrancamos el servidor HTTP (escucha en 0.0.0.0 para aceptar conexiones LAN)
const server = app.listen(config.PORT, config.HOST, () => {
  console.log(
    `API listening on http://${config.HOST}:${config.PORT} (NODE_ENV=${config.NODE_ENV})`
  );
});

let shuttingDown = false;

/**
 * Cierre limpio del proceso:
 * - server.close() deja de aceptar nuevas conexiones y espera a las actuales.
 * - pool.end() cierra conexiones a Postgres para no dejar sockets colgados.
 */
async function shutdown(reason, err) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (err) console.error(`[SHUTDOWN] ${reason}`, err);
  else console.log(`[SHUTDOWN] ${reason}`);

  // Promisify de server.close
  const closeServer = () =>
    new Promise((resolve) => {
      if (!server) return resolve();
      server.close(() => resolve());
    });

  try {
    await closeServer();
  } catch (e) {
    console.error('[SHUTDOWN] Error closing HTTP server', e);
  }

  try {
    // Cierra el pool de Postgres (si está inicializado)
    if (pool?.end) await pool.end();
  } catch (e) {
    console.error('[SHUTDOWN] Error closing PG pool', e);
  }
}

// Señales típicas:
// - SIGINT: Ctrl+C en terminal
// - SIGTERM: apagado “normal” en Docker/systemd/hosting
process.on('SIGINT', () => {
  shutdown('SIGINT received').finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM received').finally(() => process.exit(0));
});

// Promesas rechazadas sin catch: mejor log + cierre limpio
process.on('unhandledRejection', (reason) => {
  shutdown('unhandledRejection', reason).finally(() => process.exit(1));
});

// Excepciones no capturadas: log + cierre limpio (estado inconsistente)
process.on('uncaughtException', (err) => {
  shutdown('uncaughtException', err).finally(() => process.exit(1));
});