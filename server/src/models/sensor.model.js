const pool = require('../config/db');

const ALLOWED_UPDATE_FIELDS = ['type', 'location', 'status', 'floor'];

async function findAll({ building_id, status, search, page, limit } = {}) {
    const conditions = [];
    const values = [];
    let idx = 1;
    if (building_id) { conditions.push(`building_id = $${idx++}`); values.push(building_id); }
    if (status)      { conditions.push(`status = $${idx++}`);      values.push(status); }
    if (search && String(search).trim()) {
        conditions.push(`(type ILIKE $${idx} OR location ILIKE $${idx})`);
        values.push(`%${String(search).trim()}%`);
        idx++;
    }
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    if (!page) {
        const result = await pool.query(`SELECT * FROM sensors ${where} ORDER BY id`, values);
        return result.rows;
    }

    const currentPage = Number(page) > 0 ? Number(page) : 1;
    const currentLimit = Number(limit) > 0 ? Number(limit) : 20;
    const offset = (currentPage - 1) * currentLimit;

    const dataQuery = `SELECT * FROM sensors ${where} ORDER BY id LIMIT $${idx++} OFFSET $${idx++}`;
    const countQuery = `SELECT COUNT(*)::int AS count FROM sensors ${where}`;

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
    const result = await pool.query('SELECT * FROM sensors WHERE id = $1', [id]);
    return result.rows[0];
}

async function create({ building_id, type, location, status, floor }) {
    const result = await pool.query(
        'INSERT INTO sensors (building_id, type, location, status, floor) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [building_id, type, location, status || 'active', floor || null]
    );
    return result.rows[0];
}

async function update(id, fields) {
    const safeKeys = Object.keys(fields).filter(k => ALLOWED_UPDATE_FIELDS.includes(k));
    if (safeKeys.length === 0) return null;
    const values = safeKeys.map(k => fields[k]);
    const set = safeKeys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const result = await pool.query(
        `UPDATE sensors SET ${set} WHERE id = $${safeKeys.length + 1} RETURNING *`,
        [...values, id]
    );
    return result.rows[0];
}

async function remove(id) {
    await pool.query('DELETE FROM sensors WHERE id = $1', [id]);
}

module.exports = { findAll, findById, create, update, remove };
