import express from 'express';
import cors from 'cors';
import routes from './routes.js';
import adminRoutes from './admin.js';

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: 'https://servicelmbarcelona.es' }));

app.get('/', (req, res) => res.type('text/plain').send('SkyWars API running'));
app.use('/api', routes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'not_found' }));

app.use((err, req, res, next) => {
  console.error('[API ERROR]', err);
  res.status(500).json({ error: 'server_error', message: String(err?.message || 'Unexpected error') });
});

export default app;
