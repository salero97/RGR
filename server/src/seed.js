require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./config/db');

async function seed() {
  const hash = await bcrypt.hash('admin123', 12);

  await pool.query(
    `
      INSERT INTO users (username, email, password_hash, role, full_name)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO UPDATE
      SET
        username = EXCLUDED.username,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        full_name = EXCLUDED.full_name
    `,
    ['admin', 'admin@example.com', hash, 'admin', 'Administrator']
  );

  console.log('Seed completed');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});