const pool = require('../config/db');

const MAX_ATTEMPTS = 3;
const WINDOW_MS = 10 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;

async function getRecord(ip) {
  const result = await pool.query('SELECT * FROM login_attempts WHERE ip = $1', [ip]);
  return result.rows[0] || null;
}

async function isBlocked(ip) {
  const record = await getRecord(ip);
  if (!record) return { blocked: false };

  const now = Date.now();

  if (record.blocked_until && new Date(record.blocked_until).getTime() > now) {
    return { blocked: true, blockedUntil: record.blocked_until };
  }

  if (record.last_attempt && now - new Date(record.last_attempt).getTime() > WINDOW_MS) {
    await pool.query(
      'UPDATE login_attempts SET attempts = 0, blocked_until = NULL WHERE ip = $1',
      [ip]
    );
    return { blocked: false };
  }

  return { blocked: false };
}

async function registerFailure(ip) {
  const record = await getRecord(ip);
  const now = new Date();

  if (!record) {
    await pool.query(
      'INSERT INTO login_attempts (ip, attempts, last_attempt) VALUES ($1, 1, $2)',
      [ip, now]
    );
    return { attempts: 1, blocked: false };
  }

  const windowExpired = now.getTime() - new Date(record.last_attempt).getTime() > WINDOW_MS;
  const nextAttempts = windowExpired ? 1 : record.attempts + 1;

  let blockedUntil = null;
  if (nextAttempts >= MAX_ATTEMPTS) {
    blockedUntil = new Date(now.getTime() + BLOCK_MS);
  }

  await pool.query(
    'UPDATE login_attempts SET attempts = $1, last_attempt = $2, blocked_until = $3 WHERE ip = $4',
    [nextAttempts, now, blockedUntil, ip]
  );

  return { attempts: nextAttempts, blocked: !!blockedUntil, blockedUntil };
}

async function registerSuccess(ip) {
  await pool.query(
    'UPDATE login_attempts SET attempts = 0, blocked_until = NULL WHERE ip = $1',
    [ip]
  );
}

async function cleanupOld() {
  const threshold = new Date(Date.now() - WINDOW_MS);
  await pool.query(
    'DELETE FROM login_attempts WHERE last_attempt < $1 AND (blocked_until IS NULL OR blocked_until < NOW())',
    [threshold]
  );
}

module.exports = {
  isBlocked,
  registerFailure,
  registerSuccess,
  cleanupOld,
  MAX_ATTEMPTS
};