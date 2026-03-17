import React, { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../api.js';

const PAGE_SIZE = 20;
const fmtDate = v => { if (!v) return '—'; const d = new Date(v); return isNaN(d) ? String(v) : d.toLocaleString('es-ES'); };

function TopKillers({ value }) {
  let list;
  try { list = typeof value === 'string' ? JSON.parse(value) : value; } catch { return <span style={{color:'var(--dim)'}}>—</span>; }
  if (!Array.isArray(list) || !list.length) return <span style={{color:'var(--dim)'}}>—</span>;
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {list.slice(0,3).map((k,i) => (
        <span key={i} className={`tag ${i===0?'tag-gold':'tag-blue'}`}>
          {k.player ?? k.name ?? '?'}{k.kills != null ? ` ×${k.kills}` : ''}
        </span>
      ))}
    </div>
  );
}

export default function Matches() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [items, setItems]     = useState([]);
  const [page, setPage]       = useState(1);
  const [hasNext, setHasNext] = useState(false);

  const load = useCallback(async (p) => {
    setLoading(true); setError('');
    try {
      const res = await apiGet(`/api/matches?page=${p}&pageSize=${PAGE_SIZE}`);
      const list = Array.isArray(res?.items) ? res.items : [];
      setItems(list);
      setHasNext(list.length === PAGE_SIZE);
    } catch(e) { setError(e?.message || 'Error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="fade-up">
      <div className="section-header">
        <h2 className="section-title"><span className="acc">//</span>Matches</h2>
        <span className="tag tag-blue">p. {page}</span>
      </div>

      {loading && <div className="status-loading">Cargando partidas...</div>}
      {!loading && error && <div className="status-error">⚠ {error}</div>}
      {!loading && !error && items.length === 0 && (
        <div className="empty-state"><span className="ei">◈</span>Sin partidas aún</div>
      )}
      {!loading && !error && items.length > 0 && (
        <>
          <div className="sw-table-wrap">
            <table className="sw-table">
              <thead>
                <tr><th>Finalizada</th><th>Arena</th><th>Ganador</th><th>Top Killers</th></tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td className="c-time">{fmtDate(r.ended_at)}</td>
                    <td><span className="tag tag-blue">{r.arena_name}</span></td>
                    <td><span className="c-name">{r.winner_name}</span></td>
                    <td><TopKillers value={r.top_killers} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pagination">
            <button className="page-btn" disabled={page===1} onClick={() => setPage(p=>p-1)}>← Prev</button>
            <span className="page-info">Página {page}</span>
            <button className="page-btn" disabled={!hasNext} onClick={() => setPage(p=>p+1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  );
}
