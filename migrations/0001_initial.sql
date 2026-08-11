CREATE TABLE IF NOT EXISTS diagnosis_results (
  result_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  delete_token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  feedback_id TEXT PRIMARY KEY NOT NULL,
  diagnosis_result_id TEXT,
  payload TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (diagnosis_result_id) REFERENCES diagnosis_results(result_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS riot_accounts (
  puuid TEXT PRIMARY KEY NOT NULL,
  game_name TEXT NOT NULL,
  tag_line TEXT NOT NULL,
  platform_region TEXT NOT NULL,
  last_verified_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS riot_profile_cache (
  puuid TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (puuid, cache_key),
  FOREIGN KEY (puuid) REFERENCES riot_accounts(puuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_riot_profile_cache_expires_at ON riot_profile_cache(expires_at);
