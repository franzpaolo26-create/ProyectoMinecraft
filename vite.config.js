// frontend/vite.config.js
// Config mínima de Vite para React.
// - plugin-react habilita JSX y Fast Refresh.
// - server.host permite acceder desde otros PCs en la misma Wi-Fi/LAN.
// - proxy (opcional) evita CORS en desarrollo: /api -> backend.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  server: {
    // Para que otros PCs de la red puedan abrir el panel:
    // http://IP_DEL_HOST:5173
    host: true,
    port: 5173,

    // Proxy en dev: si en el frontend haces fetch('/api/...'),
    // Vite lo redirige al backend (sin CORS).
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true
      }
    }
  }
});