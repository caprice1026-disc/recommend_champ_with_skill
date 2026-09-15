ALTER TABLE diagnosis_results ADD COLUMN expires_at TEXT;
ALTER TABLE riot_accounts ADD COLUMN expires_at TEXT;

UPDATE diagnosis_results
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', created_at, '+90 days')
WHERE expires_at IS NULL;

UPDATE riot_accounts
SET expires_at = strftime('%Y-%m-%dT%H:%M:%fZ', last_verified_at, '+1 hour')
WHERE expires_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_diagnosis_results_expires_at ON diagnosis_results(expires_at);
CREATE INDEX IF NOT EXISTS idx_riot_accounts_expires_at ON riot_accounts(expires_at);
