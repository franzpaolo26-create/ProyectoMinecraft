// frontend/src/pages/Players.jsx
// Página de Jugadores: carga datos al montar (useEffect) y los muestra en una tabla.


import React from 'react';
import { useEffect, useState } from 'react';
import { apiGet } from '../api.js';
import Table from '../components/Table.jsx';

export default function Players() {
  // Estados básicos: loading (spinner), error (mensaje), rows (datos)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);

  // useEffect: se ejecuta al montar el componente para cargar la lista
  useEffect(() => {
    let alive = true; // evita setState si el componente se desmonta

    async function load() {
      setLoading(true);
      setError('');

      try {
        const data = await apiGet('/api/players');
        if (!alive) return;
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Error cargando jugadores');
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
    { key: 'player_name', header: 'Jugador' },
    { key: 'kills', header: 'Kills' },
    { key: 'deaths', header: 'Deaths' },
    { key: 'wins', header: 'Wins' },
    { key: 'games_played', header: 'Games' },
    {
      key: 'last_update',
      header: 'Última actualización',
      render: (v) => {
        if (!v) return '';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
      },
    },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 12px 0' }}>Jugadores</h2>

      {loading && <div>Cargando...</div>}

      {!loading && error && (
        <div style={{ padding: 10, border: '1px solid #f3c6c6', background: '#fff5f5', borderRadius: 8 }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <Table
          columns={columns}
          rows={rows}
          rowKey="player_uuid"
          emptyText="No hay jugadores todavía."
        />
      )}
    </div>
  );
}