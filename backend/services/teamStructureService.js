const repository = require('../database/teamStructureRepository');
const { publicContentCache } = require('./publicContentCache');
const { httpError } = require('../utils/httpError');

// Department icons available in frontend/src/components/Icon/icons.js.
const TEAM_ICONS = Object.freeze(['globe', 'megaphone', 'route', 'calendar', 'users', 'chip', 'chat', 'sensor', 'controller', 'drone', 'workshop', 'competition', 'project', 'simulation', 'live', 'search']);
// Generous caps so a mistaken loop or script cannot grow the public page without bound.
const LIMITS = Object.freeze({ departments: 30, leaders: 20, committees: 40, members: 300 });
const NAME_MAX = 200;
const ROLE_MAX = 100;

const RULES = {
  icon: (value) => (TEAM_ICONS.includes(value) ? value : invalid('Choose one of the available department icons.')),
  name_ar: (value) => text(value, NAME_MAX, 'Enter the Arabic name (up to 200 characters).'),
  name_en: (value) => text(value, NAME_MAX, 'Enter the English name (up to 200 characters).'),
  role_ar: (value) => (value === null ? null : text(value, ROLE_MAX, 'Enter the Arabic role (up to 100 characters).')),
  role_en: (value) => (value === null ? null : text(value, ROLE_MAX, 'Enter the English role (up to 100 characters).')),
  is_general: (value) => flag(value),
  is_lead: (value) => flag(value),
};
const REQUIRED = {
  departments: ['icon', 'name_ar', 'name_en'],
  leaders: ['role_ar', 'role_en', 'name_ar', 'name_en'],
  committees: ['name_ar', 'name_en'],
  members: ['name_ar', 'name_en'],
};
const DEFAULTS = { committees: { is_general: false }, members: { is_lead: false, role_ar: null, role_en: null } };
const PARENT_MISSING = { leaders: 'Department not found.', committees: 'Department not found.', members: 'Committee not found.' };
const NOT_FOUND = { departments: 'Department not found.', leaders: 'Leader not found.', committees: 'Committee not found.', members: 'Member not found.' };

function invalid(message) { throw httpError(400, message); }
function text(value, max, message) {
  if (typeof value !== 'string') invalid(message);
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.length > max) invalid(message);
  return trimmed;
}
function flag(value) {
  if (typeof value !== 'boolean') invalid('Use true or false.');
  return value;
}

function entityOf(kind) {
  if (!Object.hasOwn(repository.ENTITIES, kind)) throw httpError(404, 'Route not found.');
  return kind;
}
function idOf(value) {
  const id = typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(id) || id > 2147483647) throw httpError(404, 'Record not found.');
  return id;
}

// Type-checks each supplied field; unknown keys are rejected before any query runs.
function validate(entity, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) || !Object.keys(body).length) invalid('A non-empty JSON object is required.');
  const { fields } = repository.ENTITIES[entity];
  const values = {};
  for (const [key, value] of Object.entries(body)) {
    if (!fields.includes(key)) invalid('Unsupported team field.');
    values[key] = RULES[key](value);
  }
  return values;
}

// Cross-field rules on the complete record. A committee member's role is shown only on lead rows,
// so plain members never keep a stale title.
function complete(entity, record) {
  for (const key of REQUIRED[entity]) if (record[key] == null) invalid('Fill in every required field in Arabic and English.');
  if (entity === 'members') {
    if (!record.is_lead) return { ...record, role_ar: null, role_en: null };
    if (record.role_ar == null || record.role_en == null) invalid('A highlighted member needs a role in Arabic and English.');
  }
  return record;
}

async function transaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await work(client);
    const tree = await repository.getTree(client);
    await client.query('COMMIT');
    return tree;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}

const getTree = (pool) => repository.getTree(pool);
const publicTree = (pool) => publicContentCache(pool).read('team', () => repository.getTree(pool));

async function create(pool, kind, parentParam, body) {
  const entity = entityOf(kind);
  const { parent, fields } = repository.ENTITIES[entity];
  const parentId = parent ? idOf(parentParam) : null;
  const values = complete(entity, { ...DEFAULTS[entity], ...validate(entity, body) });
  const columns = Object.fromEntries(fields.filter((field) => Object.hasOwn(values, field)).map((field) => [field, values[field]]));
  return transaction(pool, async (client) => {
    if (parent && !(await repository.lockParent(client, entity, parentId))) throw httpError(404, PARENT_MISSING[entity]);
    if (await repository.countChildren(client, entity, parentId) >= LIMITS[entity]) invalid('This list has reached its maximum size.');
    await repository.insert(client, entity, parentId, columns);
  });
}

async function update(pool, kind, idParam, body) {
  const entity = entityOf(kind);
  const id = idOf(idParam);
  const values = validate(entity, body);
  return transaction(pool, async (client) => {
    const current = await repository.getLocked(client, entity, id);
    if (!current) throw httpError(404, NOT_FOUND[entity]);
    const { id: _id, ...merged } = complete(entity, { ...current, ...values });
    // Write the supplied fields plus anything the cross-field rules normalized.
    const changes = Object.fromEntries(Object.entries(merged).filter(([key, value]) => Object.hasOwn(values, key) || value !== current[key]));
    await repository.update(client, entity, id, changes);
  });
}

async function remove(pool, kind, idParam) {
  const entity = entityOf(kind);
  const id = idOf(idParam);
  return transaction(pool, async (client) => {
    if (!(await repository.remove(client, entity, id))) throw httpError(404, NOT_FOUND[entity]);
  });
}

async function move(pool, kind, idParam, body) {
  const entity = entityOf(kind);
  const id = idOf(idParam);
  const keys = body && typeof body === 'object' && !Array.isArray(body) ? Object.keys(body) : [];
  if (keys.length !== 1 || keys[0] !== 'direction' || !['up', 'down'].includes(body.direction)) invalid('Direction must be up or down.');
  return transaction(pool, async (client) => {
    if ((await repository.move(client, entity, id, body.direction)) === null) throw httpError(404, NOT_FOUND[entity]);
  });
}

module.exports = { TEAM_ICONS, LIMITS, getTree, publicTree, create, update, remove, move, validate };
