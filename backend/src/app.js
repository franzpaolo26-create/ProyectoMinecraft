// backend/src/app.js
// App Express principal (ESM). Simple, clara y lista para montar rutas bajo /api.

import express from 'express';
import cors from 'cors';

import config from './config.js';
import routes from './routes.js';

// Creamos la instancia de Express
const app = express();

// ------------------------------------------------------------
// Middlewares base
// ------------------------------------------------------------

// Parseo JSON con límite para evitar payloads gigantes
app.use(express.json({ limit: '1mb' }));

// CORS simple:
// - Si config.CORS_ORIGIN viene definido, se usa.
// - Si no, en dev permitimos "*" (cualquier origen).
const corsOrigin =
  config.CORS_ORIGIN ?? (config.NODE_ENV === 'development' ? '*' : undefined);

app.use(
  cors({
    origin: corsOrigin,
  })
);

// ------------------------------------------------------------
// Rutas
// ------------------------------------------------------------

// Health check básico
app.get('/', (req, res) => {
  res.type('text/plain').send('SkyWars API running');
});

// Montamos las rutas de la API bajo /api
app.use('/api', routes);

// ------------------------------------------------------------
// 404 específico para /api/*
// ------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'not_found', path: req.path });
});

// ------------------------------------------------------------
// Error handler final (siempre al final)
// ------------------------------------------------------------
app.use((err, req, res, next) => {
  // Log en servidor para depurar
  console.error('[API ERROR]', err);

  const message = String(err?.message || 'Unexpected server error');

  // En dev incluimos stack, en prod no.
  const payload =
    config.NODE_ENV === 'development'
      ? { error: 'server_error', message, stack: String(err?.stack || '') }
      : { error: 'server_error', message };

  res.status(500).json(payload);
});

// Export default (requisito)
export default app;