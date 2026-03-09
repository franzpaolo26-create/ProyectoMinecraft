// backend/src/routes.js
// Rutas de la API (panel + plugin). Simple, claro y directo.

import { Router } from 'express'; // Router de Express para agrupar endpoints
import config from './config.js'; // Config del proyecto (incluye PLUGIN_KEY)
import { pool } from './db.js';   // Pool de conexiones a PostgreSQL

const router = Router(); // Instancia del router

/* ----------------------------- Helpers simples ---------------------------- */

/**
 * Devuelve true si v es string y, tras trim(), no queda vacío.
 * Lo usamos para validar inputs de query/body sin comernos espacios.
 */
function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

/**
 * Convierte value a entero positivo (>= 1).
 * Si no es válido, devuelve fallback.
 * - Number(...) convierte strings numéricos tipo "20" a 20.
 * - Number.isInteger asegura que no sea decimal.
 */
function parsePositiveInt(value, fallback) {
  const n = Number(value ?? fallback);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return fallback;
  return n;
}

/**
 * Middleware de seguridad:
 * Protege endpoints del plugin usando un header: X-Plugin-Key
 * Si la key no existe o no coincide con config.PLUGIN_KEY -> 401.
 */
function requirePluginKey(req, res, next) {
  const key = req.get('X-Plugin-Key'); // Lee el header enviado por el plugin
  if (!key || key !== config.PLUGIN_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next(); // Permite continuar al handler real
}

/**
 * Helper para ejecutar un bloque dentro de una transacción real.
 * - pool.connect() => obtenemos un client dedicado (no pool.query directo).
 * - BEGIN -> ejecutamos fn(client) -> COMMIT
 * - Si falla: ROLLBACK y propagamos el error.
 * Importante: siempre release() en finally para devolver el client al pool.
 */
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    // Si algo revienta dentro de la transacción, intentamos deshacer cambios
    try {
      await client.query('ROLLBACK');
    } catch {}
    throw err;
  } finally {
    // Pase lo que pase, liberamos el client
    client.release();
  }
}

/* ------------------------------ GET (panel) ------------------------------ */

/**
 * GET /health
 * Endpoint de salud: sirve para comprobar que el backend responde.
 * Devuelve ok + la hora del servidor.
 */
router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/**
 * GET /players?search=...
 * Lista de jugadores desde player_stats.
 * - Si viene search, filtra por player_name con ILIKE (case-insensitive).
 * - Ordena por kills desc (ranking por kills).
 */
router.get('/players', async (req, res) => {
  try {
    // Si search es string no vacío -> lo usamos; si no -> null
    const search = isNonEmptyString(req.query.search) ? req.query.search.trim() : null;

    // Base query
    let sql = `
      SELECT player_uuid, player_name, kills, deaths, wins, games_played, last_update
      FROM player_stats
    `;
    const params = []; // Aquí guardamos parámetros para evitar SQL injection

    if (search) {
      // Usamos %...% para buscar coincidencias parciales
      params.push(`%${search}%`);
      sql += ` WHERE player_name ILIKE $1`; // $1 = params[0]
    }

    // Ranking: más kills arriba
    sql += ` ORDER BY kills DESC`;

    // pool.query ejecuta la query con parámetros (seguro)
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[GET /players] DB ERROR', err);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * GET /matches?page=1&pageSize=20
 * Devuelve partidas recientes paginadas.
 * - page y pageSize deben ser enteros positivos.
 * - pageSize máximo 100 para no reventar el servidor.
 */
router.get('/matches', async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    let pageSize = parsePositiveInt(req.query.pageSize, 20);
    if (pageSize > 100) pageSize = 100;

    // OFFSET típico: (page-1) * pageSize
    const offset = (page - 1) * pageSize;

    const { rows } = await pool.query(
      `
      SELECT id, arena_name, winner_name, top_killers, ended_at
      FROM matches
      ORDER BY ended_at DESC
      LIMIT $1 OFFSET $2
      `,
      [pageSize, offset]
    );

    // Devolvemos la paginación + items
    res.json({ page, pageSize, items: rows });
  } catch (err) {
    console.error('[GET /matches] DB ERROR', err);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * GET /stats/summary
 * Totales globales para el panel:
 * - players: count filas (jugadores) en player_stats
 * - totalKills/Deaths/Wins/Games: sumas de columnas (con COALESCE para nulls)
 * Nota: "::int" convierte a int en PostgreSQL para devolver números limpios.
 */
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

    // Si por algún motivo rows[0] no existe, devolvemos ceros
    res.json(rows[0] ?? { players: 0, totalKills: 0, totalDeaths: 0, totalWins: 0, totalGames: 0 });
  } catch (err) {
    console.error('[GET /stats/summary] DB ERROR', err);
    res.status(500).json({ error: 'server_error' });
  }
});

/* ----------------------------- POST (plugin) ----------------------------- */

/**
 * POST /ingest/death
 * Inserta un registro en deaths (log) y actualiza player_stats:
 * - Muerto: +1 deaths (upsert por player_uuid).
 * - Killer: si existe por nombre en stats, +1 kills (sin crear UUIDs inventados).
 * Protegido con requirePluginKey.
 */
router.post('/ingest/death', requirePluginKey, async (req, res) => {
  // Leemos del body los campos relevantes (si req.body es null/undefined -> {})
  const {
    player_uuid,
    player_name,
    killer,
    arena_name,
    items_lost,
  } = req.body ?? {};

  // Validación de campos obligatorios (defensiva, responde 400)
  if (!isNonEmptyString(player_uuid)) {
    return res.status(400).json({ error: 'bad_request', message: 'player_uuid is required' });
  }
  if (!isNonEmptyString(player_name)) {
    return res.status(400).json({ error: 'bad_request', message: 'player_name is required' });
  }
  if (!isNonEmptyString(arena_name)) {
    return res.status(400).json({ error: 'bad_request', message: 'arena_name is required' });
  }

  // items_lost es opcional, pero si viene debe ser un objeto/array (no string/number)
  if (items_lost !== undefined && (typeof items_lost !== 'object' || items_lost === null)) {
    return res.status(400).json({ error: 'bad_request', message: 'items_lost must be an object or array' });
  }

  try {
    // Todo dentro de transacción para que:
    // - el log en deaths y el update en stats se confirmen juntos
    // - si algo falla, no se queda a medias
    await withTransaction(async (client) => {
      // 1) Insertamos un log en la tabla deaths
      await client.query(
        `
        INSERT INTO deaths (player_uuid, player_name, killer, arena_name, items_lost)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        `,
        [
          player_uuid.trim(),                 // normalizamos (quitamos espacios)
          player_name.trim(),
          isNonEmptyString(killer) ? killer.trim() : null, // killer puede ser null
          arena_name.trim(),
          JSON.stringify(items_lost ?? {}),   // Guardamos como JSONB
        ]
      );

      // 2) Upsert del jugador muerto:
      // - Si no existe, lo creamos con deaths=1
      // - Si existe (por player_uuid), incrementamos deaths +1
      await client.query(
        `
        INSERT INTO player_stats (player_uuid, player_name, deaths, last_update)
        VALUES ($1, $2, 1, NOW())
        ON CONFLICT (player_uuid) DO UPDATE
        SET
          player_name = EXCLUDED.player_name,
          deaths = player_stats.deaths + 1,
          last_update = NOW()
        `,
        [player_uuid.trim(), player_name.trim()]
      );

      // 3) Si killer existe:
      // Buscamos si hay alguien en player_stats cuyo nombre "match" (ILIKE)
      // y si existe, le subimos kills +1.
      // Nota: no creamos un jugador killer si no existe, para no inventar UUIDs.
      if (isNonEmptyString(killer)) {
        const killerName = killer.trim();

        const found = await client.query(
          `SELECT player_uuid FROM player_stats WHERE player_name ILIKE $1 LIMIT 1`,
          [killerName]
        );

        if (found.rowCount > 0) {
          const killerUuid = found.rows[0].player_uuid;
          await client.query(
            `
            UPDATE player_stats
            SET kills = kills + 1, last_update = NOW()
            WHERE player_uuid = $1
            `,
            [killerUuid]
          );
        }
      }
    });

    // Si todo fue bien:
    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /ingest/death] DB ERROR', err);
    res.status(500).json({ error: 'server_error' });
  }
});

/**
 * POST /ingest/match-end
 * Inserta un registro de partida en matches y actualiza wins del ganador si existe.
 * Protegido con requirePluginKey.
 */
router.post('/ingest/match-end', requirePluginKey, async (req, res) => {
  const { arena_name, winner_name, top_killers } = req.body ?? {};

  // arena_name es obligatorio
  if (!isNonEmptyString(arena_name)) {
    return res.status(400).json({ error: 'bad_request', message: 'arena_name is required' });
  }

  // top_killers es opcional, pero si viene debe ser objeto/array
  if (top_killers !== undefined && (typeof top_killers !== 'object' || top_killers === null)) {
    return res.status(400).json({ error: 'bad_request', message: 'top_killers must be an object or array' });
  }

  try {
    await withTransaction(async (client) => {
      // Si winner_name viene vacío, guardamos "unknown" para no meter null raro en UI
      const winnerSafe = isNonEmptyString(winner_name) ? winner_name.trim() : 'unknown';

      // 1) Insertamos la partida en matches
      await client.query(
        `
        INSERT INTO matches (arena_name, winner_name, top_killers, ended_at)
        VALUES ($1, $2, $3::jsonb, NOW())
        `,
        [arena_name.trim(), winnerSafe, JSON.stringify(top_killers ?? [])]
      );

      // 2) Si winner_name existe:
      // Buscamos su UUID en player_stats por nombre y le sumamos +1 win
      if (isNonEmptyString(winner_name)) {
        const found = await client.query(
          `SELECT player_uuid FROM player_stats WHERE player_name ILIKE $1 LIMIT 1`,
          [winner_name.trim()]
        );

        if (found.rowCount > 0) {
          const winnerUuid = found.rows[0].player_uuid;
          await client.query(
            `
            UPDATE player_stats
            SET wins = wins + 1, last_update = NOW()
            WHERE player_uuid = $1
            `,
            [winnerUuid]
          );
        }
      }

      // TODO (opcional):
      // Incrementar games_played +1 para jugadores presentes en top_killers
      // Solo si el JSON trae nombres en un formato claro y consistente.
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[POST /ingest/match-end] DB ERROR', err);
    res.status(500).json({ error: 'server_error' });
  }
});

// Exportamos el router para montarlo en app.js (ej: app.use('/api', router))
export default router;