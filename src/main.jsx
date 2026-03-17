import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/theme.css';
import App from './App.jsx';

const rootEl = document.getElementById('root');
if (!rootEl) {
  console.error('[BOOT] No se encontró #root. Revisa index.html.');
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter basename="/Skywars">
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
