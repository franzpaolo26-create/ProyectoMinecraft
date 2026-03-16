import 'dotenv/config';
import { Router } from 'express';
import { pool } from './db.js';

const router = Router();
const PLUGIN_KEY = process.env.PLUGIN_KEY;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function parsePositiveInt(value, fallback) {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return fallback;
  return n;
}

function requirePluginKey(req, res, next) {
  const key = req.get('X-Plugin-Key');
  if (!key || key !== PLUGIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch {}
    throw err;
  } finally {
    client.release();
  }
}

router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

router.get('/players', async (req, res) => {
  try {
    const search = isNonEmptyString(req.query.search) ? req.query.search.trim() : null;
    let sql = `SELECT player_uuid, player_name, kills, deaths, wins, games_played, last_update FROM player_stats`;
    const params = [];
    if (search) { params.push(`%${search}%`); sql += ` WHERE player_name ILIKE $1`; }
    sql += ` ORDER BY kills DESC`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/matches', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    let pageSize = parsePositiveInt(req.query.pageSize, 20);
    if (pageSize > 100) pageSize = 100;
    const offset = (page - 1) * pageSize;
    const { rows } = await pool.query(
      `SELECT id, arena_name, winner_name, top_killers, ended_at FROM matches ORDER BY ended_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );
    res.json({ page, pageSize, items: rows });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*)::int AS players,
        COALESCE(SUM(kills), 0)::int AS "totalKills",
        COALESCE(SUM(deaths), 0)::int AS "totalDeaths",
        COALESCE(SUM(wins), 0)::int AS "totalWins",
        COALESCE(SUM(games_played), 0)::int AS "totalGames"
      FROM player_stats
    `);
    res.json(rows[0] ?? { players: 0, totalKills: 0, totalDeaths: 0, totalWins: 0, totalGames: 0 });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/ingest/death', requirePluginKey, async (req, res) => {
  const { player_uuid, player_name, killer, arena_name, items_lost } = req.body ?? {};
  if (!isNonEmptyString(player_uuid) || !isNonEmptyString(player_name) || !isNonEmptyString(arena_name)) return res.status(400).json({ error: 'bad_request' });

  try {
    await withTransaction(async (client) => {
      // 1. PRIMERO: Creamos al jugador si no existe para evitar el error 500
      await client.query(
        `INSERT INTO player_stats (player_uuid, player_name, deaths, games_played, last_update) VALUES ($1, $2, 1, 1, NOW())
         ON CONFLICT (player_uuid) DO UPDATE SET player_name=EXCLUDED.player_name, deaths=player_stats.deaths+1, games_played=player_stats.games_played+1, last_update=NOW()`,
        [player_uuid.trim(), player_name.trim()]
      );
      
      // 2. SEGUNDO: Registramos la muerte en el mapa
      await client.query(
        `INSERT INTO deaths (player_uuid, player_name, killer, arena_name, items_lost) VALUES ($1, $2, $3, $4, $5::jsonb)`,
        [player_uuid.trim(), player_name.trim(), isNonEmptyString(killer) ? killer.trim() : null, arena_name.trim(), JSON.stringify(items_lost ?? {})]
      );
      
      // 3. TERCERO: Si alguien lo mató, le sumamos la kill al asesino
      if (isNonEmptyString(killer)) {
        const found = await client.query(`SELECT player_uuid FROM player_stats WHERE player_name ILIKE $1 LIMIT 1`, [killer.trim()]);
        if (found.rowCount > 0) {
          await client.query(`UPDATE player_stats SET kills=kills+1, last_update=NOW() WHERE player_uuid=$1`, [found.rows[0].player_uuid]);
        }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('evento_vivo', { 
        tipo: 'muerte', 
        asesino: killer || 'Entorno', 
        victima: player_name 
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

router.post('/ingest/match-end', requirePluginKey, async (req, res) => {
  const { arena_name, winner_name, top_killers } = req.body ?? {};
  if (!isNonEmptyString(arena_name)) return res.status(400).json({ error: 'bad_request' });

  try {
    await withTransaction(async (client) => {
      const winnerSafe = isNonEmptyString(winner_name) ? winner_name.trim() : 'unknown';
      
      // Guardar partida
      await client.query(
        `INSERT INTO matches (arena_name, winner_name, top_killers, ended_at) VALUES ($1, $2, $3::jsonb, NOW())`,
        [arena_name.trim(), winnerSafe, JSON.stringify(top_killers ?? [])]
      );
      
      // Sumar victoria al ganador
      if (isNonEmptyString(winner_name) && winnerSafe !== 'unknown') {
        const found = await client.query(`SELECT player_uuid FROM player_stats WHERE player_name ILIKE $1 LIMIT 1`, [winnerSafe]);
        if (found.rowCount > 0) {
          await client.query(`UPDATE player_stats SET wins=wins+1, games_played=games_played+1, last_update=NOW() WHERE player_uuid=$1`, [found.rows[0].player_uuid]);
        } else {
          // Si el ganador es tan pro que nunca murió, lo creamos con un UUID temporal para que salga en el ranking
          await client.query(
            `INSERT INTO player_stats (player_uuid, player_name, wins, games_played, last_update) VALUES ($1, $2, 1, 1, NOW())
             ON CONFLICT (player_uuid) DO UPDATE SET wins=player_stats.wins+1, games_played=player_stats.games_played+1, last_update=NOW()`,
            [`temp-${winnerSafe}`, winnerSafe]
          );
        }
      }
    });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('evento_vivo', { 
        tipo: 'muerte', 
        asesino: killer || 'Entorno', 
        victima: player_name 
      });
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'server_error' });
  }
});

export default router;
