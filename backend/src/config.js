// backend/src/config.js
// Config centralizada del backend (Node.js + Express) usando dotenv.
// - ESM: package.json con "type": "module"
// - Proyecto local en LAN: por defecto escuchamos en 0.0.0.0

import dotenv from 'dotenv';

// Carga variables de entorno desde .env (si existe) a process.env
dotenv.config();

/**
 * Lee una variable de entorno como string (con default opcional).
 * Devuelve string (o undefined si no existe y no hay default).
 */
function envStr(key, defaultValue) {
  const v = process.env[key];
  if (v === undefined || v === null || String(v).trim() === '') {
    return defaultValue;
  }
  return String(v);
}

/**
 * Lee una variable de entorno requerida (string).
 * Lanza Error claro si falta.
 */
function envRequired(key) {
  const v = envStr(key, undefined);
  if (v === undefined) {
    throw new Error(`[CONFIG] Falta la variable de entorno obligatoria: ${key}`);
  }
  return v;
}

/**
 * Lee una variable de entorno como número entero (con default).
 * Valida NaN y valores fuera de rango básico de puertos.
 */
function envPort(key, defaultValue) {
  const raw = envStr(key, String(defaultValue));
  const n = Number(raw);

  // Validación: debe ser número finito e integer
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(
      `[CONFIG] ${key} debe ser un número entero válido. Recibido: "${raw}"`
    );
  }

  // Validación básica de rango de puertos (1-65535)
  if (n < 1 || n > 65535) {
    throw new Error(
      `[CONFIG] ${key} fuera de rango (1-65535). Recibido: ${n}`
    );
  }

  return n;
}

// Entorno: "development" por defecto
const NODE_ENV = envStr('NODE_ENV', 'development');

// Host de escucha: en LAN conviene 0.0.0.0 para aceptar conexiones de la red
const HOST = envStr('HOST', '0.0.0.0');

// Puerto del servidor Express (número). Default: 4000
const PORT = envPort('PORT', 4000);

// URL de conexión a Postgres (obligatoria). Ej: postgres://user:pass@host:5432/db
const DATABASE_URL = envRequired('DATABASE_URL');

// Clave del plugin (obligatoria). Se validará contra el header: X-Plugin-Key
const PLUGIN_KEY = envRequired('PLUGIN_KEY');

// Origen permitido para CORS.
// - En dev: default "*"
// - En prod: se recomienda restringir (p.ej. "http://192.168.1.50:5173")
const CORS_ORIGIN =
  envStr('CORS_ORIGIN', NODE_ENV === 'development' ? '*' : undefined) ?? undefined;

// Exportamos un único objeto config para usarlo en todo el backend
export const config = {
  NODE_ENV,
  HOST,
  PORT,
  DATABASE_URL,
  PLUGIN_KEY,
  CORS_ORIGIN,
};

export default config;