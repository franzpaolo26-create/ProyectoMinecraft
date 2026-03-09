// backend/src/db.js
// Capa mínima de acceso a PostgreSQL usando `pg`.
// - pool: gestiona conexiones reutilizables (mejor que conectar/desconectar en cada query)
// - query(): helper sencillo para ejecutar SQL con parámetros

import { Pool } from 'pg';
import config from './config.js';

// Pool de conexiones a Postgres usando DATABASE_URL (obligatorio en config)
export const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

// Log de errores del pool (útil para ver resets, auth, caídas de red, etc.)
pool.on('error', (err) => {
  console.error('[PG POOL ERROR]', err);
});

/**
 * Ejecuta una consulta SQL.
 * @param {string} text - SQL con placeholders $1, $2, ...
 * @param {any[]} [params] - valores para los placeholders
 * @returns {Promise<import("pg").QueryResult>}
 */
export async function query(text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[PG QUERY ERROR]', { text, params, err });
    throw err;
  }
}

/**
 * Comprobación rápida de salud de la BD.
 * Si esto falla, Postgres no está accesible o la URL/credenciales son incorrectas.
 */
export async function healthCheck() {
  await query('SELECT 1');
  return true;
}