const { httpError } = require("../utils/httpError");

function safeId(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) throw httpError(400, "A valid record id is required.");
  return Number(value);
}

function columnsFor(resource, definition) {
  return ["id", ...Object.keys(definition.fields), "created_at", "updated_at", ...(resource === "teams" || resource === "participants" ? ["registered_at"] : [])];
}

const projectMembersSql = `, (SELECT COALESCE(json_agg(json_build_object('id', pm.id, 'name', pm.name, 'linkedin_url', pm.linkedin_url, 'x_url', pm.x_url, 'display_order', pm.display_order) ORDER BY pm.display_order ASC NULLS LAST, pm.id ASC), '[]'::json) FROM project_members pm WHERE pm.project_id = projects.id) AS members`;

async function list(pool, resource, definition, filter) {
  const columns = columnsFor(resource, definition);
  const params = [];
  let where = "";
  if (filter) {
    const [column, value] = filter;
    if (!["competition_id", "workshop_id"].includes(column)) throw httpError(400, "Unsupported filter.");
    params.push(safeId(value));
    where = ` WHERE ${column} = $1`;
  }
  params.push(500);
  const members = resource === "projects" ? projectMembersSql : "";
  const result = await pool.query(`SELECT ${columns.join(", ")}${members} FROM ${definition.table}${where} ORDER BY ${definition.order} LIMIT $${params.length}`, params);
  return result.rows;
}

async function get(pool, resource, definition, id) {
  const columns = columnsFor(resource, definition);
  const members = resource === "projects" ? projectMembersSql : "";
  const alias = resource === "projects" ? "projects" : definition.table;
  const result = await pool.query(`SELECT ${alias}.${columns.join(`, ${alias}.`)}${members} FROM ${definition.table} WHERE ${alias}.id = $1`, [safeId(id)]);
  if (!result.rowCount) throw httpError(404, "Record not found.");
  return result.rows[0];
}

async function create(pool, resource, definition, values) {
  const members = values.members;
  delete values.members;
  const columns = Object.keys(values);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  const client = resource === "projects" ? await pool.connect() : pool;
  try {
    if (resource === "projects") await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO ${definition.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id, ${Object.keys(definition.fields).join(", ")}, created_at, updated_at`,
      columns.map((column) => values[column]),
    );
    if (resource === "projects" && members !== undefined) {
      for (const member of members) await client.query("INSERT INTO project_members (project_id, name, linkedin_url, x_url, display_order) VALUES ($1, $2, $3, $4, $5)", [result.rows[0].id, member.name, member.linkedin_url, member.x_url, member.display_order]);
    }
    if (resource === "projects") await client.query("COMMIT");
    return resource === "projects" ? { ...result.rows[0], members: members || [] } : result.rows[0];
  } catch (error) {
    if (resource === "projects") await client.query("ROLLBACK");
    throw error;
  } finally {
    if (resource === "projects") client.release();
  }
}

async function update(pool, resource, definition, id, values) {
  const members = values.members;
  delete values.members;
  const columns = Object.keys(values);
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
  const recordId = safeId(id);
  const client = resource === "projects" ? await pool.connect() : pool;
  try {
    if (resource === "projects") await client.query("BEGIN");
    const result = await client.query(
      `UPDATE ${definition.table} SET ${assignments.join(", ")}${assignments.length ? ", " : ""}updated_at = CURRENT_TIMESTAMP WHERE id = $${columns.length + 1} RETURNING id, ${Object.keys(definition.fields).join(", ")}, created_at, updated_at`,
      [...columns.map((column) => values[column]), recordId],
    );
    if (!result.rowCount) throw httpError(404, "Record not found.");
    if (resource === "projects" && members !== undefined) {
      await client.query("DELETE FROM project_members WHERE project_id = $1", [recordId]);
      for (const member of members) await client.query("INSERT INTO project_members (project_id, name, linkedin_url, x_url, display_order) VALUES ($1, $2, $3, $4, $5)", [recordId, member.name, member.linkedin_url, member.x_url, member.display_order]);
    }
    const currentMembers = resource === "projects" && members === undefined
      ? (await client.query("SELECT id, name, linkedin_url, x_url, display_order FROM project_members WHERE project_id = $1 ORDER BY display_order ASC NULLS LAST, id ASC", [recordId])).rows
      : members;
    if (resource === "projects") await client.query("COMMIT");
    return resource === "projects" ? { ...result.rows[0], members: currentMembers || [] } : result.rows[0];
  } catch (error) {
    if (resource === "projects") await client.query("ROLLBACK");
    throw error;
  } finally {
    if (resource === "projects") client.release();
  }
}

async function remove(pool, resource, definition, id) {
  const result = await pool.query(`DELETE FROM ${definition.table} WHERE id = $1 RETURNING id`, [safeId(id)]);
  if (!result.rowCount) throw httpError(404, "Record not found.");
}

module.exports = { list, get, create, update, remove };
