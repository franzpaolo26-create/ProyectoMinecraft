import React, { useEffect, useState, useCallback } from 'react';

const ADMIN_KEY = 'skywars-admin-2026';
const API = 'https://api.servicelmbarcelona.es';

async function adminFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Admin-Key': ADMIN_KEY },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`);
  return data;
}

const ITEMS = [
  { label: 'Hacha de diamante', value: 'diamond_axe' },
  { label: 'Espada de diamante', value: 'diamond_sword' },
  { label: 'Arco', value: 'bow' },
  { label: 'Manzana dorada', value: 'golden_apple' },
  { label: 'TNT', value: 'tnt' },
  { label: 'Escudo', value: 'shield' },
];

const MOBS = [
  { label: 'Zombie', value: 'zombie' },
  { label: 'Creeper', value: 'creeper' },
  { label: 'Esqueleto', value: 'skeleton' },
  { label: 'Araña', value: 'spider' },
  { label: 'Enderman', value: 'enderman' },
  { label: 'Wither', value: 'wither' },
];

function Card({ title, children, accent }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${accent ? 'rgba(57,255,154,0.2)' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      padding: '18px 20px',
      marginBottom: 16,
    }}>
      <div style={{ fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Btn({ onClick, children, color = 'accent', disabled, loading }) {
  const colors = {
    accent: { bg: 'rgba(57,255,154,0.1)', border: 'var(--accent)', text: 'var(--accent)' },
    red:    { bg: 'rgba(248,113,113,0.1)', border: 'var(--danger)', text: 'var(--danger)' },
    blue:   { bg: 'rgba(56,189,248,0.1)',  border: 'var(--blue)',   text: 'var(--blue)' },
    gold:   { bg: 'rgba(251,191,36,0.1)',  border: 'var(--warn)',   text: 'var(--warn)' },
    muted:  { bg: 'var(--surface2)',       border: 'var(--border)', text: 'var(--muted)' },
  };
  const c = colors[color] || colors.accent;
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 'var(--r)',
        color: c.text,
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 600,
        padding: '8px 16px',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.5 : 1,
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
      }}
    >
      {loading ? '...' : children}
    </button>
  );
}

function Input({ value, onChange, placeholder, style }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        color: 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        padding: '7px 11px',
        outline: 'none',
        ...style,
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        color: 'var(--text)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12.5,
        padding: '7px 11px',
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toast({ msg, ok }) {
  if (!msg) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      padding: '10px 18px',
      background: ok ? 'rgba(57,255,154,0.1)' : 'rgba(248,113,113,0.1)',
      border: `1px solid ${ok ? 'var(--accent)' : 'var(--danger)'}`,
      borderRadius: 'var(--r)',
      color: ok ? 'var(--accent)' : 'var(--danger)',
      fontFamily: 'var(--font-mono)',
      fontSize: 12.5,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
    }}>
      {ok ? '✓' : '⚠'} {msg}
    </div>
  );
}

// ── LOGIN ──
function Login({ onLogin }) {
  const [pass, setPass] = useState('');
  const [err, setErr]   = useState('');

  function submit() {
    if (pass === 'skywars-admin-2026') { onLogin(); }
    else setErr('Contraseña incorrecta');
  }

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', flexDirection:'column', gap:16 }}>
      <div style={{ fontFamily:'var(--font-head)', fontSize:28, fontWeight:800, color:'var(--accent)' }}>ADMIN</div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)', padding:'28px 32px', display:'flex', flexDirection:'column', gap:12, minWidth:280 }}>
        <div style={{ fontSize:11, color:'var(--muted)', letterSpacing:'0.1em', textTransform:'uppercase' }}>Contraseña</div>
        <input
          type="password"
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--r)', color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:13, padding:'9px 12px', outline:'none' }}
          autoFocus
        />
        {err && <div style={{ color:'var(--danger)', fontSize:12 }}>{err}</div>}
        <Btn onClick={submit}>Entrar</Btn>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed]       = useState(false);
  const [serverStatus, setStatus] = useState(null);
  const [toast, setToast]         = useState({ msg:'', ok:true });
  const [loading, setLoading]     = useState({});
  const [leaderboard, setLeader]  = useState([]);

  // Game state
  const [gameArena, setGameArena]   = useState("arena_principal");
  const [gameWinner, setGameWinner] = useState("");
  const [gameActive, setGameActive] = useState(false);

  // Give state
  const [givePlayer, setGivePlayer] = useState('');
  const [giveItem, setGiveItem]     = useState('diamond_axe');
  const [giveAmt, setGiveAmt]       = useState('1');

  // Spawn state
  const [spawnPlayer, setSpawnPlayer] = useState('');
  const [spawnMob, setSpawnMob]       = useState('zombie');
  const [spawnAmt, setSpawnAmt]       = useState('5');

  // Ban state
  const [banPlayer, setBanPlayer] = useState('');
  const [banReason, setBanReason] = useState('');

  // Command state
  const [cmd, setCmd] = useState('');

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast({ msg:'', ok:true }), 3500);
  }

  function setLoad(key, val) {
    setLoading(l => ({ ...l, [key]: val }));
  }

  const fetchStatus = useCallback(async () => {
    try {
      const d = await adminFetch('/api/admin/server/status');
      setStatus(d);
    } catch { setStatus({ online: false, status: 'unknown' }); }
  }, []);

  const fetchLeader = useCallback(async () => {
    try {
      const d = await adminFetch('/api/admin/leaderboard');
      setLeader(Array.isArray(d) ? d : []);
    } catch {}
  }, []);

  useEffect(() => {
    if (!authed) return;
    fetchStatus();
    fetchLeader();
    const t = setInterval(fetchStatus, 10000);
    return () => clearInterval(t);
  }, [authed, fetchStatus, fetchLeader]);

  async function action(key, fn) {
    setLoad(key, true);
    try {
      const res = await fn();
      showToast(res.message || 'OK', true);
      setTimeout(fetchStatus, 2000);
    } catch (e) {
      showToast(e.message || 'Error', false);
    } finally {
      setLoad(key, false);
    }
  }

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const isOnline = serverStatus?.online;

  return (
    <div className="fade-up">
      <Toast msg={toast.msg} ok={toast.ok} />

      <div className="section-header">
        <h2 className="section-title"><span className="acc">//</span>Admin</h2>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span className={isOnline ? 'dot-online' : undefined} style={!isOnline ? { width:7, height:7, borderRadius:'50%', background:'var(--danger)', display:'inline-block' } : undefined} />
          <span style={{ fontSize:11, color: isOnline ? 'var(--accent)' : 'var(--danger)', fontFamily:'var(--font-mono)' }}>
            {serverStatus ? (isOnline ? 'ONLINE' : 'OFFLINE') : '...'}
          </span>
        </div>
      </div>

      {/* Server control */}
      <Card title="⚡ Control del servidor" accent>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Btn color="accent" loading={loading.start} disabled={isOnline}
            onClick={() => action('start', () => adminFetch('/api/admin/server/start', 'POST'))}>
            ▶ Encender Minecraft
          </Btn>
          <Btn color="red" loading={loading.stop} disabled={!isOnline}
            onClick={() => action('stop', () => adminFetch('/api/admin/server/stop', 'POST'))}>
            ■ Apagar Minecraft
          </Btn>
          <Btn color="muted" onClick={fetchStatus}>↺ Actualizar estado</Btn>
        </div>
        {serverStatus && (
          <div style={{ marginTop:12, fontSize:11, color:'var(--muted)', fontFamily:'var(--font-mono)', display:'flex', gap:20, flexWrap:'wrap' }}>
            <span>Estado: <span style={{ color:'var(--text)' }}>{serverStatus.status}</span></span>
            {serverStatus.uptime && <span>Uptime: <span style={{ color:'var(--text)' }}>{Math.floor((Date.now() - serverStatus.uptime) / 60000)} min</span></span>}
            {serverStatus.restarts != null && <span>Reinicios: <span style={{ color:'var(--text)' }}>{serverStatus.restarts}</span></span>}
          </div>
        )}
      </Card>


      {/* ⚔ Partida SkyWars */}
      <Card title="⚔ Partida SkyWars" accent>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center', marginBottom:10 }}>
          <Input value={gameArena} onChange={setGameArena} placeholder="Nombre arena" style={{ width:180 }} />
          <Btn color="accent" loading={loading.gameStart} disabled={gameActive}
            onClick={() => action('gameStart', () =>
              adminFetch('/api/admin/server/command', 'POST', { command: `sw start ${gameArena}` })
                .then(r => { setGameActive(true); return r; })
            )}>
            ▶ Iniciar partida
          </Btn>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <Input value={gameWinner} onChange={setGameWinner} placeholder="Ganador (opcional)" style={{ width:180 }} />
          <Btn color="red" loading={loading.gameEnd} disabled={!gameActive}
            onClick={() => action('gameEnd', () =>
              adminFetch('/api/admin/server/command', 'POST', { command: gameWinner ? `sw end ${gameWinner}` : 'sw end' })
                .then(r => { setGameActive(false); setGameWinner(''); return r; })
            )}>
            ■ Terminar partida
          </Btn>
        </div>
        {gameActive && <div style={{ marginTop:10, fontSize:11, color:'var(--accent)', fontFamily:'var(--font-mono)' }}>🟢 Partida activa en {gameArena}</div>}
      </Card>

      {/* Dar ítem */}
      <Card title="🎁 Dar ítem a jugador">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <Input value={givePlayer} onChange={setGivePlayer} placeholder="Nombre jugador" style={{ width:160 }} />
          <Select value={giveItem} onChange={setGiveItem} options={ITEMS} />
          <Input value={giveAmt} onChange={setGiveAmt} placeholder="Cantidad" style={{ width:70 }} />
          <Btn color="blue" loading={loading.give}
            onClick={() => action('give', () => adminFetch('/api/admin/server/give', 'POST', { player: givePlayer, item: giveItem, amount: giveAmt }))}>
            Dar ítem
          </Btn>
        </div>
      </Card>

      {/* Spawn mob */}
      <Card title="👾 Spawn de mobs">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <Input value={spawnPlayer} onChange={setSpawnPlayer} placeholder="Jugador objetivo" style={{ width:160 }} />
          <Select value={spawnMob} onChange={setSpawnMob} options={MOBS} />
          <Input value={spawnAmt} onChange={setSpawnAmt} placeholder="Cantidad" style={{ width:70 }} />
          <Btn color="gold" loading={loading.spawn}
            onClick={() => action('spawn', () => adminFetch('/api/admin/server/spawn', 'POST', { player: spawnPlayer, mob: spawnMob, amount: spawnAmt }))}>
            Spawnear
          </Btn>
        </div>
      </Card>

      {/* Banear */}
      <Card title="🔨 Banear jugador">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <Input value={banPlayer} onChange={setBanPlayer} placeholder="Nombre jugador" style={{ width:160 }} />
          <Input value={banReason} onChange={setBanReason} placeholder="Razón (opcional)" style={{ width:220 }} />
          <Btn color="red" loading={loading.ban}
            onClick={() => action('ban', () => adminFetch('/api/admin/server/ban', 'POST', { player: banPlayer, reason: banReason }))}>
            Banear
          </Btn>
        </div>
      </Card>

      {/* Comando libre */}
      <Card title="⌨ Comando personalizado">
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
          <Input value={cmd} onChange={setCmd} placeholder="ej: say Hola a todos" style={{ width:300 }} />
          <Btn color="muted" loading={loading.cmd}
            onClick={() => action('cmd', () => adminFetch('/api/admin/server/command', 'POST', { command: cmd }))}>
            Ejecutar
          </Btn>
        </div>
        <div style={{ fontSize:11, color:'var(--dim)', marginTop:8 }}>Cualquier comando válido de Minecraft sin la /</div>
      </Card>

      {/* Leaderboard */}
      <Card title="🏆 Top jugadores">
        {leaderboard.length === 0
          ? <div style={{ color:'var(--muted)', fontSize:12 }}>Sin datos aún</div>
          : (
            <div className="sw-table-wrap">
              <table className="sw-table">
                <thead><tr><th>#</th><th>Jugador</th><th>Wins</th><th>Kills</th><th>Deaths</th><th>K/D</th></tr></thead>
                <tbody>
                  {leaderboard.map((r, i) => (
                    <tr key={r.player_name}>
                      <td className="c-rank">{i+1}</td>
                      <td><span className="c-name">{r.player_name}</span></td>
                      <td><span className="c-blue">{r.wins}</span></td>
                      <td><span className="c-kills">{r.kills}</span></td>
                      <td><span className="c-deaths">{r.deaths}</span></td>
                      <td><span className={r.kd >= 2 ? 'kd-good' : r.kd >= 1 ? 'kd-ok' : 'kd-bad'}>{r.kd}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  );
}
