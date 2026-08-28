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

async function findAll({ userId, action, dateFrom, dateTo, page = 1, limit = 50 }) {
  const conditions = [];
  const values = [];
  let idx = 1;

  if (userId) {
    conditions.push(`user_id = $${idx++}`);
    values.push(userId);
  }

  if (action) {
    conditions.push(`action = $${idx++}`);
    values.push(action);
  }

  if (dateFrom) {
    conditions.push(`created_at >= $${idx++}`);
    values.push(dateFrom);
  }

  if (dateTo) {
    conditions.push(`created_at <= $${idx++}`);
    values.push(dateTo);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const currentLimit = Number(limit) > 0 ? Number(limit) : 50;
  const offset = (currentPage - 1) * currentLimit;

  const dataQuery = `
    SELECT id, user_id, action, object_type, object_id, details,
           ip_address, user_agent, created_at
    FROM audit_logs
    ${where}
    ORDER BY created_at DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM audit_logs
    ${where}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(dataQuery, [...values, currentLimit, offset]),
    pool.query(countQuery, values)
  ]);

  const total = countResult.rows[0]?.count || 0;

  return {
    data: dataResult.rows,
    meta: {
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit)
    }
  };
}

module.exports = { log, findAll };
