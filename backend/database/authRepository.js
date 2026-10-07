const PUBLIC_FIELDS = `u.id, u.full_name, u.login_name, u.role_code,
  COALESCE((SELECT array_agg(p.scope ORDER BY p.scope) FROM admin_user_permissions p WHERE p.user_id = u.id), ARRAY[]::varchar[]) AS permissions`;

async function listLoginOptions(pool) {
  const { rows } = await pool.query("SELECT login_name, role_code FROM admin_users WHERE is_active = TRUE ORDER BY login_name ASC");
  return rows;
}

async function findActiveById(pool, id) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_FIELDS} FROM admin_users u WHERE u.id = $1 AND u.is_active = TRUE`, [id]);
  return rows[0] || null;
}

async function findActiveByLoginName(pool, loginName) {
  const { rows } = await pool.query(`SELECT ${PUBLIC_FIELDS}, u.password_hash FROM admin_users u WHERE u.login_name = $1 AND u.is_active = TRUE`, [loginName]);
  return rows[0] || null;
}

module.exports = { listLoginOptions, findActiveById, findActiveByLoginName };
