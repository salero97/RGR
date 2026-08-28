const pool = require('../config/db');

const ALLOWED_UPDATE_FIELDS = [
  'address', 'house', 'floor', 'apartment', 'threattype', 'severity',
  'status', 'responsible', 'description', 'latitude', 'longitude',
  'geocodingstatus', 'geocodingmessage'
];

async function findAll({ status, severity, search, page = 1, limit = 20 }) {
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const currentLimit = Number(limit) > 0 ? Number(limit) : 20;
  const offset = (currentPage - 1) * currentLimit;

  const conditions = [];
  const values = [];
  let idx = 1;

  if (status) {
    conditions.push(`status = $${idx++}`);
    values.push(status);
  }

  if (severity) {
    conditions.push(`severity = $${idx++}`);
    values.push(severity);
  }

  if (search && String(search).trim()) {
    conditions.push(`(
      address ILIKE $${idx} OR
      house ILIKE $${idx} OR
      threattype ILIKE $${idx} OR
      responsible ILIKE $${idx} OR
      description ILIKE $${idx}
    )`);
    values.push(`%${String(search).trim()}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataQuery = `
    SELECT *
    FROM incidents
    ${where}
    ORDER BY createdat DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countQuery = `
    SELECT COUNT(*)::int AS count
    FROM incidents
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

async function findById(id) {
  const incidentResult = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);

  const incident = incidentResult.rows[0];

  if (!incident) {
    return null;
  }

  const logsResult = await pool.query(
    `
      SELECT
        il.*,
        COALESCE(NULLIF(u.username, ''), u.email, '—') AS fullname
      FROM incidentlogs il
      LEFT JOIN users u ON il.userid = u.id
      WHERE il.incidentid = $1
      ORDER BY il.createdat ASC
    `,
    [id]
  );

  return {
    ...incident,
    logs: logsResult.rows
  };
}

async function create({
  address, house, floor, apartment, threattype, severity, status,
  responsible, description, latitude, longitude, geocodingstatus,
  geocodingmessage, createdby
}) {
  const result = await pool.query(
    `
      INSERT INTO incidents (
        address, house, floor, apartment, threattype, severity, status,
        responsible, description, latitude, longitude, geocodingstatus,
        geocodingmessage, createdby
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `,
    [
      address, house, floor, apartment, threattype, severity, status,
      responsible, description, latitude, longitude, geocodingstatus,
      geocodingmessage, createdby
    ]
  );

  return result.rows[0];
}

async function update(id, fields) {
  const safeKeys = Object.keys(fields).filter((key) => ALLOWED_UPDATE_FIELDS.includes(key));

  if (!safeKeys.length) {
    return null;
  }

  const values = safeKeys.map((key) => fields[key]);
  const setClause = safeKeys.map((key, index) => `${key} = $${index + 1}`).join(', ');

  const result = await pool.query(
    `
      UPDATE incidents
      SET ${setClause}, updatedat = NOW()
      WHERE id = $${safeKeys.length + 1}
      RETURNING *
    `,
    [...values, id]
  );

  return result.rows[0] || null;
}

async function remove(id) {
  await pool.query('DELETE FROM incidents WHERE id = $1', [id]);
}

async function addLog({ incidentid, userid, action }) {
  await pool.query(
    'INSERT INTO incidentlogs (incidentid, userid, action) VALUES ($1, $2, $3)',
    [incidentid, userid, action]
  );
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  addLog
};