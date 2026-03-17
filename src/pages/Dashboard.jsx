import React, { useEffect, useState } from 'react';
import { apiGet } from '../api.js';

const STATS = [
  { key: 'players',     label: 'Players',      icon: '👤' },
  { key: 'totalKills',  label: 'Total Kills',  icon: '⚔️' },
  { key: 'totalDeaths', label: 'Total Deaths', icon: '💀' },
  { key: 'totalWins',   label: 'Total Wins',   icon: '🏆' },
  { key: 'totalGames',  label: 'Games',        icon: '🎮' },
];

const fmt     = v => v == null ? '0' : Number(v).toLocaleString('es-ES');
const fmtDate = v => { if (!v) return '—'; const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleString('es-ES'); };

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [summary, setSummary] = useState(null);
  const [latest, setLatest]   = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError('');
      try {
        const [s, m] = await Promise.all([
          apiGet('/api/stats/summary'),
          apiGet('/api/matches?page=1&pageSize=5'),
        ]);
        if (!alive) return;
        setSummary(s ?? null);
        setLatest(Array.isArray(m?.items) ? m.items : []);
      } catch (e) {
        if (!alive) return;
        setError(e?.message || 'Error cargando dashboard');
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="fade-up">
      <div className="section-header">
        <h2 className="section-title"><span className="acc">//</span>Dashboard</h2>
      </div>

      {loading && <div className="status-loading">Cargando datos...</div>}
      {!loading && error && <div className="status-error">⚠ {error}</div>}

      {!loading && !error && (
        <>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:28 }}>
            {STATS.map(({ key, label, icon }, i) => (
              <div className="stat-card fade-up" key={key} style={{ animationDelay:`${i*0.07}s` }}>
                <div className="sc-label">{label}</div>
                <div className="sc-value">{fmt(summary?.[key])}</div>
                <div className="sc-icon">{icon}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:10, fontSize:11, color:'var(--dim)', letterSpacing:'0.1em', textTransform:'uppercase' }}>
            Últimas 5 partidas
          </div>
          {latest.length === 0
            ? <div className="empty-state"><span className="ei">◈</span>Sin partidas aún</div>
            : (
              <div className="sw-table-wrap">
                <table className="sw-table">
                  <thead><tr><th>Arena</th><th>Ganador</th><th>Finalizada</th></tr></thead>
                  <tbody>
                    {latest.map(r => (
                      <tr key={r.id}>
                        <td><span className="tag tag-blue">{r.arena_name}</span></td>
                        <td><span className="c-name">{r.winner_name}</span></td>
                        <td className="c-time">{fmtDate(r.ended_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </>
      )}
    </div>
  );
}
