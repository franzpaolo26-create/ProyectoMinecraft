import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => console.error('[PG POOL ERROR]', err));

export async function query(text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[PG QUERY ERROR]', { text, params, err });
    throw err;
  }
}
