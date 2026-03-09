-- backend/sql/init.sql
-- ============================================================================
-- SkyWars (LAN) - Esquema inicial PostgreSQL + datos seed mínimos
--
-- Objetivo:
--   - Tener una BD simple, rápida y estable para 4 PCs en LAN.
--   - 3 tablas: player_stats, deaths, matches
--   - TIMESTAMPTZ + NOW() para fechas en UTC con zona.
--   - JSONB para campos flexibles (items_lost, top_killers).
--
-- Notas:
--   - Se usan UUIDs como TEXT (player_uuid) para no depender de extensiones.
--     Si más adelante quieres tipo UUID real, se puede migrar sin drama.
--   - Los contadores llevan DEFAULT 0 para inserts simples.
-- ============================================================================

-- ============================================================================
-- 1) BORRADO EN ORDEN CORRECTO (dependencias: deaths -> player_stats)
-- ============================================================================
DROP TABLE IF EXISTS deaths CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS player_stats CASCADE;

-- ============================================================================
-- 2) CREACIÓN DE TABLAS
-- ============================================================================

-- --------------------------------------------------------------------------
-- Tabla: player_stats
--   - Estadísticas acumuladas por jugador.
--   - player_uuid es la PK (id estable del jugador).
-- --------------------------------------------------------------------------
CREATE TABLE player_stats (
  player_uuid   TEXT PRIMARY KEY,                 -- UUID del jugador (string), PK
  player_name   TEXT NOT NULL,                    -- Nombre visible del jugador (puede cambiar)
  kills         INTEGER NOT NULL DEFAULT 0,        -- Kills totales
  deaths        INTEGER NOT NULL DEFAULT 0,        -- Muertes totales
  wins          INTEGER NOT NULL DEFAULT 0,        -- Victorias totales
  games_played  INTEGER NOT NULL DEFAULT 0,        -- Partidas jugadas totales
  last_update   TIMESTAMPTZ NOT NULL DEFAULT NOW() -- Última actualización (server time)
);

-- --------------------------------------------------------------------------
-- Tabla: deaths
--   - Log de muertes (para panel / auditoría / historial).
--   - items_lost es JSONB por flexibilidad (inventario perdido, etc.).
-- --------------------------------------------------------------------------
CREATE TABLE deaths (
  id          BIGSERIAL PRIMARY KEY,               -- PK autoincremental (rápido para logs)
  player_uuid TEXT NOT NULL,                       -- FK a player_stats(player_uuid)
  player_name TEXT NOT NULL,                       -- Snapshot del nombre en el momento de morir
  killer      TEXT,                                -- Nombre del killer (puede ser NULL: vacío, caída, etc.)
  arena_name  TEXT NOT NULL,                       -- Arena donde ocurrió
  items_lost  JSONB NOT NULL DEFAULT '{}'::jsonb,   -- JSONB con items perdidos (estructura libre)
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- Momento de creación del evento
  CONSTRAINT fk_deaths_player
    FOREIGN KEY (player_uuid)
    REFERENCES player_stats(player_uuid)
    ON UPDATE CASCADE
    ON DELETE CASCADE
);

-- --------------------------------------------------------------------------
-- Tabla: matches
--   - Registro de partidas finalizadas.
--   - top_killers es JSONB por flexibilidad (ranking/estadísticas extra).
-- --------------------------------------------------------------------------
CREATE TABLE matches (
  id          BIGSERIAL PRIMARY KEY,               -- PK autoincremental
  arena_name  TEXT NOT NULL,                       -- Arena de la partida
  winner_name TEXT NOT NULL,                       -- Ganador (nombre)
  top_killers JSONB NOT NULL DEFAULT '[]'::jsonb,   -- Lista JSON de top killers (estructura libre)
  ended_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()   -- Momento en que terminó la partida
);

-- ============================================================================
-- 3) ÍNDICES RECOMENDADOS (para el panel y consultas típicas)
-- ============================================================================
-- Orden descendente para listar lo más reciente primero (mejor para "últimas partidas").
CREATE INDEX idx_matches_ended_at_desc ON matches (ended_at DESC);

-- Para listar muertes recientes y filtrar por arena.
CREATE INDEX idx_deaths_created_at_desc ON deaths (created_at DESC);
CREATE INDEX idx_deaths_arena_name       ON deaths (arena_name);

-- Para buscar jugadores por nombre rápido (panel / autocompletar).
CREATE INDEX idx_player_stats_player_name ON player_stats (player_name);

-- ============================================================================
-- 4) DATOS SEED MÍNIMOS (para probar el panel)
--    - 3 jugadores
--    - 3 muertes
--    - 2 partidas
-- ============================================================================
-- Importante:
--   - Usamos timestamps fijos con NOW() - INTERVAL para que parezcan "recientes".
--   - JSONB de ejemplo: items_lost como objeto, top_killers como lista de objetos.
-- ============================================================================

-- 3 jugadores en player_stats
INSERT INTO player_stats (player_uuid, player_name, kills, deaths, wins, games_played, last_update)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'User1',  12, 5, 3,  9,  NOW() - INTERVAL '2 hours'),
  ('22222222-2222-2222-2222-222222222222', 'User2',  7, 4, 2,  6,  NOW() - INTERVAL '3 hours'),
  ('33333333-3333-3333-3333-333333333333', 'User3',  3, 6, 1,  7,  NOW() - INTERVAL '1 hours');

-- 3 muertes en deaths
INSERT INTO deaths (player_uuid, player_name, killer, arena_name, items_lost, created_at)
VALUES
  (
    '33333333-3333-3333-3333-333333333333',
    'User3',
    'User1',
    'arena_forest',
    '{"armor":["helmet_iron"],"items":["stone_sword","golden_apple"],"coins":15}'::jsonb,
    NOW() - INTERVAL '55 minutes'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'User2',
    'User1',
    'arena_forest',
    '{"items":["bow","arrow x16"],"blocks":["oak_planks x32"]}'::jsonb,
    NOW() - INTERVAL '48 minutes'
  ),
  (
    '11111111-1111-1111-1111-111111111111',
    'User1',
    NULL,
    'arena_desert',
    '{"cause":"void","items":["diamond_pickaxe"]}'::jsonb,
    NOW() - INTERVAL '25 minutes'
  );

-- 2 partidas en matches
INSERT INTO matches (arena_name, winner_name, top_killers, ended_at)
VALUES
  (
    'arena_forest',
    'User1',
    '[
      {"player":"User1","kills":5},
      {"player":"User2","kills":2},
      {"player":"User3","kills":1}
    ]'::jsonb,
    NOW() - INTERVAL '40 minutes'
  ),
  (
    'arena_desert',
    'User2',
    '[
      {"player":"User2","kills":4},
      {"player":"User1","kills":3},
      {"player":"User3","kills":0}
    ]'::jsonb,
    NOW() - INTERVAL '15 minutes'
  );