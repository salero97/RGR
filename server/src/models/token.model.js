const pool = require('../config/db');

async function saveRefreshToken({ userId, token, expiresAt }) {
  await pool.query(
    `
      INSERT INTO refresh_tokens (user_id, token, expires_at)
      VALUES ($1, $2, $3)
    `,
    [userId, token, expiresAt]
  );
}

async function findRefreshToken(token) {
  const result = await pool.query(
    `
      SELECT
        id,
        user_id,
        token,
        expires_at,
        revoked,
        created_at
      FROM refresh_tokens
      WHERE token = $1
        AND revoked = false
        AND expires_at > NOW()
    `,
    [token]
  );

  if (!result.rows[0]) return null;

  const row = result.rows[0];

  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    revoked: row.revoked,
    createdAt: row.created_at
  };
}

async function revokeRefreshToken(token) {
  await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked = true
      WHERE token = $1
    `,
    [token]
  );
}

async function revokeAllUserTokens(userId) {
  await pool.query(
    `
      UPDATE refresh_tokens
      SET revoked = true
      WHERE user_id = $1
    `,
    [userId]
  );
}

module.exports = {
  saveRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens
};