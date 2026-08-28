const pool = require('../config/db');

const ALLOWED_UPDATE_FIELDS = [
  'name', 'address', 'house', 'floors', 'risklevel', 'status',
  'description', 'latitude', 'longitude'
];

async function findAll() {
  const result = await pool.query(
    `
      SELECT id, name, address, house, floors, risklevel, status,
             description, latitude, longitude, createdat, updatedat
      FROM buildings
      ORDER BY id DESC
    `
  );

  return result.rows;
}

async function findAllQuery({ search, page = 1, limit = 20 } = {}) {
  const currentPage = Number(page) > 0 ? Number(page) : 1;
  const currentLimit = Number(limit) > 0 ? Number(limit) : 20;
  const offset = (currentPage - 1) * currentLimit;

  const conditions = [];
  const values = [];
  let idx = 1;

  if (search && String(search).trim()) {
    conditions.push(`(
      name ILIKE $${idx} OR
      address ILIKE $${idx} OR
      house ILIKE $${idx}
    )`);
    values.push(`%${String(search).trim()}%`);
    idx++;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const dataQuery = `
    SELECT id, name, address, house, floors, risklevel, status,
           description, latitude, longitude, createdat, updatedat
    FROM buildings
    ${where}
    ORDER BY id DESC
    LIMIT $${idx++} OFFSET $${idx++}
  `;

  const countQuery = `SELECT COUNT(*)::int AS count FROM buildings ${where}`;

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
  const result = await pool.query(
    `
      SELECT id, name, address, house, floors, risklevel, status,
             description, latitude, longitude, createdat, updatedat
      FROM buildings
      WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
}

async function create(data) {
  const { name, address, house, floors, risklevel, status, description, latitude, longitude } = data;

  const result = await pool.query(
    `
      INSERT INTO buildings (
        name, address, house, floors, risklevel, status, description, latitude, longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, address, house, floors, risklevel, status,
                description, latitude, longitude, createdat, updatedat
    `,
    [name, address, house || null, floors, risklevel, status, description || '', latitude, longitude]
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
      UPDATE buildings
      SET ${setClause}, updatedat = NOW()
      WHERE id = $${safeKeys.length + 1}
      RETURNING id, name, address, house, floors, risklevel, status,
                description, latitude, longitude, createdat, updatedat
    `,
    [...values, id]
  );

  return result.rows[0] || null;
}

async function remove(id) {
  await pool.query('DELETE FROM buildings WHERE id = $1', [id]);
}

module.exports = {
  findAll,
  findAllQuery,
  findById,
  create,
  update,
  remove
};