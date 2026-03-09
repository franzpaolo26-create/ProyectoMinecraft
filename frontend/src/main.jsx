// frontend/src/main.jsx
// Entry point de Vite + React 18.
// - Monta la app en #root.
// - BrowserRouter habilita React Router.
// - StrictMode ayuda a detectar problemas en desarrollo.

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App.jsx';

const rootEl = document.getElementById('root');

if (!rootEl) {
  console.error('[BOOT] No se encontró el elemento #root. Revisa index.html.');
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}