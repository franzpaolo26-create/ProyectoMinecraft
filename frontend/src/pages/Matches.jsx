// frontend/src/pages/Matches.jsx
// Página de Historial de partidas: carga /api/matches y muestra una tabla simple.

import React from 'react';
import { useEffect, useState } from 'react';
import { apiGet } from '../api.js';
import Table from '../components/Table.jsx';

export default function Matches() {
  // Estados básicos: loading (cargando), error (mensaje), data (items)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  // useEffect: se ejecuta al montar para pedir el historial (page 1, pageSize 20)
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await apiGet('/api/matches?page=1&pageSize=20');
        if (!alive) return;

        const nextItems = Array.isArray(res?.items) ? res.items : [];
        setItems(nextItems);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Error cargando partidas');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const columns = [
    {
      key: 'ended_at',
      header: 'Finalizada',
      render: (v) => {
        if (!v) return '';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
      },
    },
    { key: 'arena_name', header: 'Arena' },
    { key: 'winner_name', header: 'Ganador' },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 12px 0' }}>Historial de partidas</h2>

      {loading && <div>Cargando...</div>}

      {!loading && error && (
        <div
          style={{
            padding: 10,
            border: '1px solid #f3c6c6',
            background: '#fff5f5',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <Table
          columns={columns}
          rows={items}
          rowKey="id"
          emptyText="No hay partidas todavía."
        />
      )}
    </div>
  );
}