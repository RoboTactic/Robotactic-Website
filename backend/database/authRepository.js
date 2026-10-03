async function findActiveByEmail(pool, email) {
  const result = await pool.query(
    "SELECT id, full_name, email, role_code, password_hash FROM admin_users WHERE LOWER(email) = LOWER($1) AND is_active = TRUE",
    [email],
  );
  return result.rows[0] || null;
}

async function findActiveById(pool, id) {
  const result = await pool.query(
    "SELECT id, full_name, email, role_code FROM admin_users WHERE id = $1 AND is_active = TRUE",
    [id],
  );
  return result.rows[0] || null;
}

module.exports = { findActiveByEmail, findActiveById };
