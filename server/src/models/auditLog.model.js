const pool = require('../config/db');

async function log({ userId, action, objectType, objectId, details, ipAddress, userAgent }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, object_type, object_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId || null,
        action,
        objectType || null,
        objectId !== undefined && objectId !== null ? String(objectId) : null,
        details ? JSON.stringify(details) : null,
        ipAddress || null,
        userAgent || null
      ]
    );
  } catch (err) {
    console.error('audit log failed:', err.message);
  }
}

module.exports = { log };