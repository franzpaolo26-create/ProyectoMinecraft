import React, { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../api.js';

const fmtDate = v => { if (!v) return '—'; const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleString('es-ES'); };
const kdClass = (k, d) => { const r = d > 0 ? k/d : k; return r >= 2 ? 'kd-good' : r >= 1 ? 'kd-ok' : 'kd-bad'; };

export default function Players() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [rows, setRows]       = useState([]);
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');

  const load = useCallback(async (q) => {
    setLoading(true); setError('');
    try {
      const data = await apiGet(q ? `/api/players?search=${encodeURIComponent(q)}` : '/api/players');
      setRows(Array.isArray(data) ? data : []);
    } catch(e) { setError(e?.message || 'Error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(''); }, [load]);
  useEffect(() => { const t = setTimeout(() => load(query), 350); return () => clearTimeout(t); }, [query, load]);

  return (
    <div className="fade-up">
      <div className="section-header">
        <h2 className="section-title"><span className="acc">//</span>Players</h2>
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input className="search-input" type="text" placeholder="Buscar jugador..."
            value={search} onChange={e => { setSearch(e.target.value); setQuery(e.target.value); }} />
        </div>
      </div>

      {loading && <div className="status-loading">Cargando jugadores...</div>}
      {!loading && error && <div className="status-error">⚠ {error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="empty-state"><span className="ei">⚔</span>{query ? `Sin resultados para "${query}"` : 'Sin jugadores aún'}</div>
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead>
              <tr>
                <th>#</th><th>Jugador</th><th>Kills</th><th>Deaths</th>
                <th>K/D</th><th>Wins</th><th>Games</th><th>Última act.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const kd = r.deaths > 0 ? (r.kills/r.deaths).toFixed(2) : r.kills.toFixed(2);
                return (
                  <tr key={r.player_uuid}>
                    <td className="c-rank">{i+1}</td>
                    <td><span className="c-name">{r.player_name}</span></td>
                    <td><span className="c-kills">{r.kills}</span></td>
                    <td><span className="c-deaths">{r.deaths}</span></td>
                    <td><span className={kdClass(r.kills, r.deaths)}>{kd}</span></td>
                    <td><span className="c-blue">{r.wins}</span></td>
                    <td><span className="c-muted">{r.games_played}</span></td>
                    <td className="c-time">{fmtDate(r.last_update)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
