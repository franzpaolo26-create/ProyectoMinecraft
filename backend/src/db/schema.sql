CREATE TABLE IF NOT EXISTS deaths (
    id SERIAL PRIMARY KEY, player_uuid VARCHAR(36), player_name VARCHAR(16),
    killer VARCHAR(16), items_lost JSONB, game_name VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS player_stats (
    player_uuid VARCHAR(36) PRIMARY KEY, player_name VARCHAR(16),
    kills INT DEFAULT 0, deaths INT DEFAULT 0, wins INT DEFAULT 0, games INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY, game_name VARCHAR(64), winner VARCHAR(16),
    top_names JSONB, top_kills JSONB, duration_seconds INT,
    ended_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deaths_player  ON deaths(player_uuid);
CREATE INDEX IF NOT EXISTS idx_deaths_created ON deaths(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stats_kills    ON player_stats(kills DESC);
