// frontend/src/pages/Dashboard.jsx
// Dashboard simple: carga resumen global + últimas 5 partidas.

import React from 'react';

import { useEffect, useState } from 'react';
import { apiGet } from '../api.js';
import Table from '../components/Table.jsx';

export default function Dashboard() {
  // Estados: loading (ambos endpoints), error, summary, latest matches
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [latest, setLatest] = useState([]);

  // useEffect: al montar, pedimos summary y últimas partidas en paralelo
  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [summaryRes, matchesRes] = await Promise.all([
          apiGet('/api/stats/summary'),
          apiGet('/api/matches?page=1&pageSize=5'),
        ]);

        if (!alive) return;

        setSummary(summaryRes ?? null);
        setLatest(Array.isArray(matchesRes?.items) ? matchesRes.items : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Error cargando dashboard');
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

  const summaryBox = (label, value) => (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: 12,
        background: '#fff',
        minWidth: 140,
      }}
    >
      <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value ?? 0}</div>
    </div>
  );

  const columns = [
    { key: 'arena_name', header: 'Arena' },
    { key: 'winner_name', header: 'Ganador' },
    {
      key: 'ended_at',
      header: 'Finalizada',
      render: (v) => {
        if (!v) return '';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString();
      },
    },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 12px 0' }}>Dashboard</h2>

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
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
            {summaryBox('Players', summary?.players)}
            {summaryBox('Total Kills', summary?.totalKills)}
            {summaryBox('Total Deaths', summary?.totalDeaths)}
            {summaryBox('Total Wins', summary?.totalWins)}
            {summaryBox('Total Games', summary?.totalGames)}
          </div>

          <h3 style={{ margin: '10px 0' }}>Últimas 5 partidas</h3>
          <Table columns={columns} rows={latest} rowKey="id" emptyText="No hay partidas todavía." />
        </>
      )}
    </div>
  );
}