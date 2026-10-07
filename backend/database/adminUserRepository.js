const { httpError } = require("../utils/httpError");
const { ROLE_DEFAULTS } = require("../config/roleScopes");

const USER_FIELDS = "id, full_name, login_name, email, phone, role_code, is_active, created_at, updated_at";
const RETURN_FIELDS = `${USER_FIELDS}, COALESCE((SELECT array_agg(scope ORDER BY scope) FROM admin_user_permissions WHERE user_id = admin_users.id), ARRAY[]::varchar[]) AS permissions`;
const MUTABLE_FIELDS = new Set(["full_name", "login_name", "email", "phone", "role_code", "is_active", "password_hash"]);

async function list(pool) {
  const { rows } = await pool.query(`SELECT ${RETURN_FIELDS} FROM admin_users ORDER BY id ASC`);
  return rows;
}

async function get(pool, idValue) {
  const id = safeId(idValue);
  const { rows } = await pool.query(`SELECT ${RETURN_FIELDS} FROM admin_users WHERE id = $1`, [id]);
  if (!rows.length) throw httpError(404, "User not found.");
  return rows[0];
}

async function create(pool, values) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`
      INSERT INTO admin_users (full_name, login_name, email, phone, role_code, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id
    `, [values.full_name, values.login_name, values.email, values.phone, values.role_code, values.password_hash]);
    const id = rows[0].id;
    await replacePermissions(client, id, values.permissions);
    const created = await client.query(`SELECT ${RETURN_FIELDS} FROM admin_users WHERE id = $1`, [id]);
    await client.query("COMMIT");
    return created.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function replacePermissions(client, id, permissions) {
  await client.query("DELETE FROM admin_user_permissions WHERE user_id = $1", [id]);
  if (permissions.length) await client.query("INSERT INTO admin_user_permissions (user_id, scope) SELECT $1, unnest($2::varchar[])", [id, permissions]);
}

function safeId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "A valid user id is required.");
  return id;
}

async function update(pool, actorId, idValue, values) {
  const id = safeId(idValue);
  const { permissions, ...columns } = values;
  const entries = Object.entries(columns);
  if ((!entries.length && permissions === undefined) || entries.some(([key]) => !MUTABLE_FIELDS.has(key))) throw httpError(400, "Provide supported user fields to update.");
  if (Number(actorId) === id && values.is_active === false) throw httpError(400, "You cannot deactivate your own account.");
  const assignments = entries.map(([key], index) => `${key} = $${index + 1}`);
  const params = entries.map(([, value]) => value);
  params.push(id);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(725184301)");
    const existing = await client.query("SELECT role_code, is_active FROM admin_users WHERE id = $1 FOR UPDATE", [id]);
    if (!existing.rowCount) throw httpError(404, "User not found.");
    const nextRole = values.role_code ?? existing.rows[0].role_code;
    const nextActive = values.is_active ?? existing.rows[0].is_active;
    if (existing.rows[0].is_active && existing.rows[0].role_code === "super_admin" && (nextRole !== "super_admin" || !nextActive)) {
      const total = await client.query("SELECT COUNT(*)::int AS count FROM admin_users WHERE role_code = 'super_admin' AND is_active = TRUE");
      if (total.rows[0].count <= 1) throw httpError(400, "At least one active Super Admin must remain.");
    }
    if (nextRole === "super_admin" && permissions?.length) throw httpError(400, "Super Admin already has access to every section.");
    if (entries.length) await client.query(`UPDATE admin_users SET ${assignments.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`, params);
    else await client.query("UPDATE admin_users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);
    if (permissions !== undefined || (values.role_code !== undefined && values.role_code !== existing.rows[0].role_code)) {
      await replacePermissions(client, id, nextRole === "super_admin" ? [] : permissions ?? ROLE_DEFAULTS[nextRole]);
    }
    const { rows } = await client.query(`SELECT ${RETURN_FIELDS} FROM admin_users WHERE id = $1`, [id]);
    await client.query("COMMIT");
    return rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function remove(pool, actorId, idValue) {
  const id = safeId(idValue);
  if (Number(actorId) === id) throw httpError(400, "You cannot delete your own account.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(725184301)");
    const target = await client.query("SELECT role_code, is_active FROM admin_users WHERE id = $1 FOR UPDATE", [id]);
    if (!target.rowCount) throw httpError(404, "User not found.");
    if (target.rows[0].role_code === "super_admin" && target.rows[0].is_active) {
      const count = await client.query("SELECT COUNT(*)::int AS count FROM admin_users WHERE role_code = 'super_admin' AND is_active = TRUE");
      if (count.rows[0].count <= 1) throw httpError(400, "At least one active Super Admin must remain.");
    }
    await client.query("DELETE FROM admin_users WHERE id = $1", [id]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { list, get, create, update, remove };
