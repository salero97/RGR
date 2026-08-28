CREATE TABLE IF NOT EXISTS login_attempts (
  id SERIAL PRIMARY KEY,
  ip VARCHAR(64) NOT NULL UNIQUE,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  blocked_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);