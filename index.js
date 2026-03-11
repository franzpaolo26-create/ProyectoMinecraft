import app from './app.js';
import { pool } from './db.js';

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});

let shuttingDown = false;
async function shutdown(reason, err) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (err) console.error(`[SHUTDOWN] ${reason}`, err);
  else console.log(`[SHUTDOWN] ${reason}`);
  server.close(() => {});
  if (pool?.end) await pool.end();
}

process.on('SIGINT',  () => shutdown('SIGINT').finally(() => process.exit(0)));
process.on('SIGTERM', () => shutdown('SIGTERM').finally(() => process.exit(0)));
process.on('unhandledRejection', (r) => shutdown('unhandledRejection', r).finally(() => process.exit(1)));
process.on('uncaughtException',  (e) => shutdown('uncaughtException', e).finally(() => process.exit(1)));
