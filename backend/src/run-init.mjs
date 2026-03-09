import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';

const { Client } = pg;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[INIT] Falta DATABASE_URL en .env');
  process.exit(1);
}

const sql = fs.readFileSync(new URL('./src/sql/init.sql', import.meta.url), 'utf8');

const client = new Client({ connectionString: url });

try {
  console.log('[INIT] Conectando a:', url);
  await client.connect();
  console.log('[INIT] Ejecutando init.sql...');
  await client.query(sql);
  console.log('[INIT] OK. Tablas creadas.');
} catch (err) {
  console.error('[INIT] ERROR ejecutando init.sql:', err);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}