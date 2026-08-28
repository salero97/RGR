const pool = require('../config/db');

async function findByEmail(email) {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        email,
        password_hash,
        role,
        full_name,
        created_at
      FROM users
      WHERE email = $1
    `,
    [email]
  );

  if (!result.rows[0]) return null;

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    password_hash: user.password_hash,
    role: user.role,
    full_name: user.full_name,
    created_at: user.created_at
  };
}

async function findById(id) {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        email,
        role,
        full_name,
        created_at
      FROM users
      WHERE id = $1
    `,
    [id]
  );

  if (!result.rows[0]) return null;

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    created_at: user.created_at
  };
}

async function createUser(email, password_hash, role, full_name) {
  const result = await pool.query(
    `
      INSERT INTO users (email, password_hash, role, full_name)
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        username,
        email,
        role,
        full_name,
        created_at
    `,
    [email, password_hash, role || 'user', full_name]
  );

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    created_at: user.created_at
  };
}

async function findAll() {
  const result = await pool.query(
    `
      SELECT
        id,
        username,
        email,
        role,
        full_name,
        created_at
      FROM users
      ORDER BY created_at DESC
    `
  );

  return result.rows.map((user) => ({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    created_at: user.created_at
  }));
}

async function updateRole(id, role) {
  const result = await pool.query(
    `
      UPDATE users
      SET role = $1
      WHERE id = $2
      RETURNING
        id,
        username,
        email,
        role,
        full_name,
        created_at
    `,
    [role, id]
  );

  if (!result.rows[0]) return null;

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    created_at: user.created_at
  };
}

async function remove(id) {
  const result = await pool.query(
    `
      DELETE FROM users
      WHERE id = $1
      RETURNING
        id,
        username,
        email,
        role,
        full_name,
        created_at
    `,
    [id]
  );

  if (!result.rows[0]) return null;

  const user = result.rows[0];

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    created_at: user.created_at
  };
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  findAll,
  updateRole,
  remove
};