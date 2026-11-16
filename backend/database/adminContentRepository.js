const { httpError } = require("../utils/httpError");

function safeId(value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || !Number.isSafeInteger(Number(value))) throw httpError(400, "A valid record id is required.");
  return Number(value);
}

function columnsFor(resource, definition) {
  return ["id", ...Object.keys(definition.fields), "created_at", "updated_at", ...(resource === "teams" ? ["registered_at"] : [])];
}

// Child lists saved together with their parent record (replace-all on update).
// Table and column names are fixed here and never come from the request.
const childLists = {
  projects: { key: "members", table: "project_members", parent: "project_id", columns: ["name", "linkedin_url", "x_url", "display_order"] },
  competitions: { key: "supervisors", table: "competition_supervisors", parent: "competition_id", columns: ["name_ar", "name_en", "title_ar", "title_en", "linkedin_url", "display_order"] },
};

function childSql(resource, alias) {
  const child = childLists[resource];
  if (!child) return "";
  const fields = ["id", ...child.columns].map((column) => `'${column}', c.${column}`).join(", ");
  return `, (SELECT COALESCE(json_agg(json_build_object(${fields}) ORDER BY c.display_order ASC NULLS LAST, c.id ASC), '[]'::json) FROM ${child.table} c WHERE c.${child.parent} = ${alias}.id) AS ${child.key}`;
}

async function readChildren(client, child, parentId) {
  const result = await client.query(`SELECT id, ${child.columns.join(", ")} FROM ${child.table} WHERE ${child.parent} = $1 ORDER BY display_order ASC NULLS LAST, id ASC`, [parentId]);
  return result.rows;
}

async function insertChildren(client, child, parentId, items) {
  const placeholders = [child.parent, ...child.columns].map((_, index) => `$${index + 1}`).join(", ");
  for (const item of items) {
    await client.query(`INSERT INTO ${child.table} (${child.parent}, ${child.columns.join(", ")}) VALUES (${placeholders})`, [parentId, ...child.columns.map((column) => item[column] ?? null)]);
  }
}

async function withChildTransaction(pool, child, work) {
  if (!child) return work(pool);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const value = await work(client);
    await client.query("COMMIT");
    return value;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

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
  const result = await pool.query(`SELECT ${columns.join(", ")}${childSql(resource, definition.table)} FROM ${definition.table}${where} ORDER BY ${definition.order} LIMIT $${params.length}`, params);
  return result.rows;
}

async function get(pool, resource, definition, id) {
  const columns = columnsFor(resource, definition);
  const alias = definition.table;
  const result = await pool.query(`SELECT ${alias}.${columns.join(`, ${alias}.`)}${childSql(resource, alias)} FROM ${definition.table} WHERE ${alias}.id = $1`, [safeId(id)]);
  if (!result.rowCount) throw httpError(404, "Record not found.");
  return result.rows[0];
}

async function create(pool, resource, definition, values) {
  const child = childLists[resource];
  const items = child ? values[child.key] : undefined;
  if (child) delete values[child.key];
  const columns = Object.keys(values);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  return withChildTransaction(pool, child, async (client) => {
    const result = await client.query(
      `INSERT INTO ${definition.table} (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING id, ${Object.keys(definition.fields).join(", ")}, created_at, updated_at`,
      columns.map((column) => values[column]),
    );
    if (!child) return result.rows[0];
    if (items !== undefined) await insertChildren(client, child, result.rows[0].id, items);
    return { ...result.rows[0], [child.key]: await readChildren(client, child, result.rows[0].id) };
  });
}

async function update(pool, resource, definition, id, values) {
  const child = childLists[resource];
  const items = child ? values[child.key] : undefined;
  if (child) delete values[child.key];
  const columns = Object.keys(values);
  const assignments = columns.map((column, index) => `${column} = $${index + 1}`);
  const recordId = safeId(id);
  return withChildTransaction(pool, child, async (client) => {
    const result = await client.query(
      `UPDATE ${definition.table} SET ${assignments.join(", ")}${assignments.length ? ", " : ""}updated_at = CURRENT_TIMESTAMP WHERE id = $${columns.length + 1} RETURNING id, ${Object.keys(definition.fields).join(", ")}, created_at, updated_at`,
      [...columns.map((column) => values[column]), recordId],
    );
    if (!result.rowCount) throw httpError(404, "Record not found.");
    if (!child) return result.rows[0];
    if (items !== undefined) {
      await client.query(`DELETE FROM ${child.table} WHERE ${child.parent} = $1`, [recordId]);
      await insertChildren(client, child, recordId, items);
    }
    return { ...result.rows[0], [child.key]: await readChildren(client, child, recordId) };
  });
}

async function remove(pool, resource, definition, id) {
  const result = await pool.query(`DELETE FROM ${definition.table} WHERE id = $1 RETURNING id`, [safeId(id)]);
  if (!result.rowCount) throw httpError(404, "Record not found.");
}

module.exports = { list, get, create, update, remove };
