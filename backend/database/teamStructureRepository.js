// Organizing-team structure: departments → leaders and committees → committee members.
// Column and table names come only from this fixed map; every value is a query parameter.
const ENTITIES = Object.freeze({
  departments: { table: 'team_departments', parent: null, fields: ['icon', 'name_ar', 'name_en'] },
  leaders: { table: 'team_department_leaders', parent: { column: 'department_id', table: 'team_departments' }, fields: ['role_ar', 'role_en', 'name_ar', 'name_en'] },
  committees: { table: 'team_committees', parent: { column: 'department_id', table: 'team_departments' }, fields: ['name_ar', 'name_en', 'is_general'] },
  members: { table: 'team_committee_members', parent: { column: 'committee_id', table: 'team_committees' }, fields: ['name_ar', 'name_en', 'role_ar', 'role_en', 'is_lead'] },
});

const ORDER = 'ORDER BY display_order ASC, id ASC';

async function getTree(db) {
  // Sequential: inside a transaction `db` is a single client, which runs one query at a time.
  const departments = await db.query(`SELECT id, icon, name_ar, name_en FROM team_departments ${ORDER}`);
  const leaders = await db.query(`SELECT id, department_id, role_ar, role_en, name_ar, name_en FROM team_department_leaders ${ORDER}`);
  const committees = await db.query(`SELECT id, department_id, name_ar, name_en, is_general FROM team_committees ${ORDER}`);
  const members = await db.query(`SELECT id, committee_id, name_ar, name_en, role_ar, role_en, is_lead FROM team_committee_members ${ORDER}`);
  const membersOf = groupBy(members.rows, 'committee_id');
  const leadersOf = groupBy(leaders.rows, 'department_id');
  const committeesOf = groupBy(committees.rows.map((committee) => ({ ...committee, members: strip(membersOf.get(committee.id), 'committee_id') })), 'department_id');
  return departments.rows.map((department) => ({
    ...department,
    leaders: strip(leadersOf.get(department.id), 'department_id'),
    committees: strip(committeesOf.get(department.id), 'department_id'),
  }));
}

function groupBy(rows, key) {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row[key])) groups.set(row[key], []);
    groups.get(row[key]).push(row);
  }
  return groups;
}
const strip = (rows = [], key) => rows.map(({ [key]: _omit, ...row }) => row);

async function lockParent(db, entity, parentId) {
  const { parent } = ENTITIES[entity];
  const result = await db.query(`SELECT id FROM ${parent.table} WHERE id = $1 FOR UPDATE`, [parentId]);
  return result.rowCount > 0;
}

async function countChildren(db, entity, parentId) {
  const { table, parent } = ENTITIES[entity];
  const result = parent
    ? await db.query(`SELECT COUNT(*) AS total FROM ${table} WHERE ${parent.column} = $1`, [parentId])
    : await db.query(`SELECT COUNT(*) AS total FROM ${table}`);
  return Number(result.rows[0].total);
}

async function insert(db, entity, parentId, values) {
  const { table, parent } = ENTITIES[entity];
  const own = Object.keys(values);
  const columns = parent ? [parent.column, ...own] : own;
  const params = parent ? [parentId, ...own.map((column) => values[column])] : own.map((column) => values[column]);
  // The caller locks the parent row first, so MAX + 1 is stable among siblings.
  const result = await db.query(
    `INSERT INTO ${table} (${columns.join(', ')}, display_order)
     SELECT ${columns.map((_column, index) => `$${index + 1}`).join(', ')}, COALESCE(MAX(display_order), 0) + 1
     FROM ${table} ${parent ? `WHERE ${parent.column} = $1` : ''}
     RETURNING id`,
    params,
  );
  return result.rows[0].id;
}

async function getLocked(db, entity, id) {
  const { table, fields } = ENTITIES[entity];
  const result = await db.query(`SELECT id, ${fields.join(', ')} FROM ${table} WHERE id = $1 FOR UPDATE`, [id]);
  return result.rows[0] || null;
}

async function update(db, entity, id, values) {
  const { table } = ENTITIES[entity];
  const columns = Object.keys(values);
  await db.query(
    `UPDATE ${table} SET ${columns.map((column, index) => `${column} = $${index + 1}`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${columns.length + 1}`,
    [...columns.map((column) => values[column]), id],
  );
}

async function remove(db, entity, id) {
  const { table } = ENTITIES[entity];
  const result = await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return result.rowCount > 0;
}

// Swaps a row with its neighbour inside the same parent. Returns false when it is already at the edge.
async function move(db, entity, id, direction) {
  const { table, parent } = ENTITIES[entity];
  const current = await db.query(`SELECT id, display_order${parent ? `, ${parent.column} AS parent_id` : ''} FROM ${table} WHERE id = $1 FOR UPDATE`, [id]);
  const row = current.rows[0];
  if (!row) return null;
  const up = direction === 'up';
  const params = [row.display_order, row.id];
  const scope = parent ? `AND ${parent.column} = $3` : '';
  if (parent) params.push(row.parent_id);
  const neighbour = await db.query(
    `SELECT id, display_order FROM ${table}
     WHERE (display_order, id) ${up ? '<' : '>'} ($1, $2) ${scope}
     ORDER BY display_order ${up ? 'DESC' : 'ASC'}, id ${up ? 'DESC' : 'ASC'} LIMIT 1 FOR UPDATE`,
    params,
  );
  const other = neighbour.rows[0];
  if (!other) return false;
  // Equal orders (never written by this API) still produce a strict swap.
  const [first, second] = other.display_order === row.display_order
    ? (up ? [row.display_order, row.display_order + 1] : [row.display_order + 1, row.display_order])
    : [other.display_order, row.display_order];
  await db.query(
    `UPDATE ${table} SET display_order = CASE id WHEN $1 THEN $2::integer WHEN $3 THEN $4::integer END, updated_at = CURRENT_TIMESTAMP WHERE id IN ($1, $3)`,
    [row.id, first, other.id, second],
  );
  return true;
}

module.exports = { ENTITIES, getTree, lockParent, countChildren, insert, getLocked, update, remove, move };
