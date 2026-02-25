const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const db = new Pool({
  host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres', password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'skywars',
});

let serverState = { connectedPlayers: [], arenas: [], lastUpdate: null };

// ── Recibe del plugin ────────────────────────────────────────
app.post('/api/mc/death', async (req, res) => {
  const { player_uuid, player_name, killer, items_lost, game_name, total_kills, total_deaths, total_wins } = req.body;
  try {
    await db.query(`INSERT INTO deaths (player_uuid, player_name, killer, items_lost, game_name) VALUES ($1,$2,$3,$4,$5)`,
      [player_uuid, player_name, killer||'void', JSON.stringify(items_lost||[]), game_name]);
    await db.query(`INSERT INTO player_stats (player_uuid, player_name, kills, deaths, wins, games) VALUES ($1,$2,$3,$4,$5,1)
      ON CONFLICT (player_uuid) DO UPDATE SET player_name=$2, kills=$3, deaths=$4, wins=$5`,
      [player_uuid, player_name, total_kills||0, total_deaths||0, total_wins||0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mc/game-end', async (req, res) => {
  const { game_name, winner, top_names, top_kills, duration_seconds } = req.body;
  try {
    await db.query(`INSERT INTO game_history (game_name, winner, top_names, top_kills, duration_seconds) VALUES ($1,$2,$3,$4,$5)`,
      [game_name, winner, JSON.stringify(top_names||[]), JSON.stringify(top_kills||[]), duration_seconds||0]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/mc/heartbeat', (req, res) => {
  serverState = { connectedPlayers: req.body.players||[], arenas: req.body.arenas||[], lastUpdate: new Date().toISOString() };
  res.json({ success: true });
});

// ── Expone al frontend ───────────────────────────────────────
app.get('/api/status', (req, res) => {
  const isOnline = serverState.lastUpdate && (Date.now() - new Date(serverState.lastUpdate).getTime()) < 15000;
  res.json({ online: isOnline, players: serverState.connectedPlayers, arenas: serverState.arenas, lastUpdate: serverState.lastUpdate });
});

app.get('/api/stats/overview', async (req, res) => {
  try {
    const [tp, tg, td, top] = await Promise.all([
      db.query('SELECT COUNT(*) FROM player_stats'), db.query('SELECT COUNT(*) FROM game_history'),
      db.query('SELECT COUNT(*) FROM deaths'), db.query('SELECT player_name, kills FROM player_stats ORDER BY kills DESC LIMIT 1'),
    ]);
    res.json({ totalPlayers: +tp.rows[0].count, totalGames: +tg.rows[0].count, totalDeaths: +td.rows[0].count, topPlayer: top.rows[0]||null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/leaderboard', async (req, res) => {
  try {
    const r = await db.query(`SELECT player_name, kills, deaths, wins, games, ROUND(kills::numeric/GREATEST(deaths,1),2) as kd_ratio FROM player_stats ORDER BY kills DESC LIMIT 20`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/stats/recent-deaths', async (req, res) => {
  try {
    const r = await db.query(`SELECT player_name, killer, game_name, items_lost, created_at FROM deaths ORDER BY created_at DESC LIMIT 50`);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── Acciones admin ───────────────────────────────────────────
async function rcon(cmd) { console.log(`[RCON] ${cmd}`); /* TODO tarea B-04 */ }

app.post('/api/admin/reset-all',         async (req, res) => { try { await rcon('swareset');                    res.json({ success: true, message: 'Todas las arenas reseteadas' }); } catch { res.status(500).json({ error: 'Sin conexión' }); }});
app.post('/api/admin/reset-arena/:name', async (req, res) => { try { await rcon(`swareset ${req.params.name}`); res.json({ success: true, message: `Arena ${req.params.name} reseteada` }); } catch { res.status(500).json({ error: 'Sin conexión' }); }});
app.post('/api/admin/start/:arena',      async (req, res) => { try { await rcon(`swastart ${req.params.arena}`);res.json({ success: true }); } catch { res.status(500).json({ error: 'Sin conexión' }); }});
app.post('/api/admin/stop/:arena',       async (req, res) => { try { await rcon(`swastop ${req.params.arena}`); res.json({ success: true }); } catch { res.status(500).json({ error: 'Sin conexión' }); }});
app.post('/api/admin/kick/:player',      async (req, res) => { try { await rcon(`kick ${req.params.player} ${req.body.reason||'Kicked by admin'}`); res.json({ success: true }); } catch { res.status(500).json({ error: 'Sin conexión' }); }});

async function initDB() {
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  await db.query(schema);
  console.log('✅ DB lista');
}

initDB().then(() => app.listen(process.env.PORT||3000, () => console.log('🚀 Backend en puerto 3000')));
