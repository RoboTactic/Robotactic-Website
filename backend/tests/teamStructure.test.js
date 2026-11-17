const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
// Isolated runtime configuration only; no real credentials or database connection.
process.env.AUTH_TOKEN_SECRET = randomBytes(48).toString('hex');
const express = require('express');
const team = require('../services/teamStructureService');
const { hasScope } = require('../config/roleScopes');
const { createApiRoutes } = require('../routes');
const { errorHandler } = require('../middleware/errorHandler');
const { createToken, COOKIE_NAME } = require('../middleware/authenticate');
const { tables } = require('../scripts/runtimeRoleDefinition');

const noQuery = { query() { assert.fail('Invalid input must not query the database'); }, connect() { assert.fail('Invalid input must not open a transaction'); } };

// A fake transaction client: records SQL, answers the lock/read queries the service needs.
function fakePool(current) {
  const calls = [];
  const client = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (/^SELECT id\b[^]*FOR UPDATE/.test(sql)) return { rowCount: current ? 1 : 0, rows: current ? [current] : [] };
      if (/COUNT\(\*\)/.test(sql)) return { rows: [{ total: '0' }] };
      if (/^\s*INSERT/.test(sql)) return { rows: [{ id: 1 }] };
      if (/^DELETE/.test(sql)) return { rowCount: current ? 1 : 0 };
      return { rowCount: 0, rows: [] };
    },
    release() { client.released = true; },
  };
  return { pool: { connect: async () => client, query: client.query }, calls, client };
}

test('team input is validated before any query: unknown keys, blanks, lengths, icons and booleans', async () => {
  const bad = [
    ['departments', null, { name_ar: 'قسم', name_en: 'Dept', icon: 'not-an-icon' }],
    ['departments', null, { name_ar: '  ', name_en: 'Dept', icon: 'users' }],
    ['departments', null, { name_ar: 'قسم', name_en: 'Dept', icon: 'users', display_order: 1 }],
    ['departments', null, { name_ar: 'x'.repeat(201), name_en: 'Dept', icon: 'users' }],
    ['departments', null, { name_ar: 'قسم', icon: 'users' }],
    ['leaders', '1', { name_ar: 'اسم', name_en: 'Name', role_ar: 'القائد' }],
    ['committees', '1', { name_ar: 'لجنة', name_en: 'Committee', is_general: 'yes' }],
    ['members', '1', { name_ar: 'اسم', name_en: 'Name', is_lead: true }],
    ['members', '1', { name_ar: 'اسم', name_en: 'Name', committee_id: 2 }],
    ['members', '0', { name_ar: 'اسم', name_en: 'Name' }],
    ['members', '1; DROP TABLE x', { name_ar: 'اسم', name_en: 'Name' }],
    ['unknown', '1', { name_ar: 'اسم', name_en: 'Name' }],
  ];
  for (const [kind, parent, body] of bad) await assert.rejects(team.create(noQuery, kind, parent, body), (error) => [400, 404].includes(error.statusCode), JSON.stringify(body));
  for (const body of [null, [], {}, 'text']) await assert.rejects(team.create(noQuery, 'members', '1', body), { statusCode: 400 });
  for (const body of [{}, { direction: 'left' }, { direction: 'up', extra: 1 }]) await assert.rejects(team.move(noQuery, 'members', '1', body), { statusCode: 400 });
});

test('a plain member never keeps a role; a highlighted member requires one in both languages', async () => {
  const { pool, calls } = fakePool({ id: 7 });
  await team.create(pool, 'members', '7', { name_ar: ' سارة   أحمد ', name_en: 'Sara Ahmed', is_lead: false, role_ar: 'المشرف', role_en: 'Supervisor' });
  const insert = calls.find(({ sql }) => /^\s*INSERT/.test(sql));
  assert.deepEqual(insert.params, [7, 'سارة أحمد', 'Sara Ahmed', null, null, false]);
  assert.ok(calls.some(({ sql }) => sql === 'COMMIT'));

  const editing = fakePool({ id: 3, name_ar: 'سارة', name_en: 'Sara', role_ar: null, role_en: null, is_lead: false });
  await assert.rejects(team.update(editing.pool, 'members', '3', { is_lead: true }), { statusCode: 400 });
  assert.ok(editing.calls.some(({ sql }) => sql === 'ROLLBACK'));
  assert.ok(!editing.calls.some(({ sql }) => /^UPDATE/.test(sql)));
  assert.ok(editing.client.released);
});

test('updating a lead to a plain member clears the stored role', async () => {
  const { pool, calls } = fakePool({ id: 3, name_ar: 'سارة', name_en: 'Sara', role_ar: 'المشرف', role_en: 'Supervisor', is_lead: true });
  await team.update(pool, 'members', '3', { is_lead: false });
  const update = calls.find(({ sql }) => /^UPDATE/.test(sql));
  assert.match(update.sql, /SET role_ar = \$1, role_en = \$2, is_lead = \$3, updated_at = CURRENT_TIMESTAMP WHERE id = \$4/);
  assert.deepEqual(update.params, [null, null, false, 3]);
});

test('missing records and parents answer 404 and roll back', async () => {
  const { pool, calls } = fakePool(null);
  await assert.rejects(team.update(pool, 'leaders', '9', { name_ar: 'اسم' }), { statusCode: 404 });
  await assert.rejects(team.remove(pool, 'committees', '9'), { statusCode: 404 });
  const parent = fakePool(null);
  parent.pool.connect = async () => ({ ...parent.client, query: async (sql) => (/FROM team_committees WHERE id = \$1 FOR UPDATE/.test(sql) ? { rowCount: 0, rows: [] } : { rows: [] }), release() {} });
  await assert.rejects(team.create(parent.pool, 'members', '9', { name_ar: 'اسم', name_en: 'Name' }), { statusCode: 404 });
  assert.ok(calls.filter(({ sql }) => sql === 'ROLLBACK').length >= 2);
});

test('team management is limited to Super Admin even with forged section permissions', () => {
  assert.ok(hasScope({ role_code: 'super_admin' }, 'team'));
  for (const role_code of ['team_member', 'workshop_manager', 'competition_manager']) assert.equal(hasScope({ role_code, permissions: ['team'] }, 'team'), false);
});

test('HTTP: every team operation requires sign-in, the Super Admin role and a trusted Origin on writes', async () => {
  let role = 'super_admin';
  const pool = {
    async query(sql) {
      if (sql.includes('FROM public_section_visibility')) return { rows: [{ is_visible: true }] };
      if (sql.includes('FROM admin_users')) return { rowCount: 1, rows: [{ id: 90000, role_code: role, permissions: ['team'] }] };
      return { rowCount: 0, rows: [] };
    },
  };
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((p) => p.trim().split('='))); next(); });
  app.use('/api', createApiRoutes({ pool, authTokenSecret: process.env.AUTH_TOKEN_SECRET, corsOrigins: ['http://localhost:5173'], isProduction: false }));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const cookie = `${COOKIE_NAME}=${createToken({ id: 90000, role_code: 'super_admin' }, process.env.AUTH_TOKEN_SECRET)}`;
  const operations = [
    ['GET', 'team'], ['POST', 'team/departments'], ['POST', 'team/departments/1/leaders'], ['POST', 'team/departments/1/committees'],
    ['POST', 'team/committees/1/members'], ['PATCH', 'team/members/1'], ['DELETE', 'team/members/1'], ['POST', 'team/members/1/move'],
    ['PATCH', 'team/departments/1'], ['DELETE', 'team/committees/1'], ['POST', 'team/leaders/1/move'],
  ];
  try {
    for (const [method, route] of operations) {
      assert.equal((await fetch(`${base}/admin/${route}`, { method })).status, 401, `${method} ${route}`);
      for (const denied of ['team_member', 'competition_manager', 'workshop_manager']) {
        role = denied;
        assert.equal((await fetch(`${base}/admin/${route}`, { method, headers: { Cookie: cookie, Origin: 'http://localhost:5173' } })).status, 403, `${denied} ${method} ${route}`);
      }
      role = 'super_admin';
      if (method !== 'GET') assert.equal((await fetch(`${base}/admin/${route}`, { method, headers: { Cookie: cookie, Origin: 'https://untrusted.invalid' } })).status, 403);
    }
    const listed = await fetch(`${base}/admin/team`, { headers: { Cookie: cookie } });
    assert.equal(listed.status, 200);
    assert.deepEqual((await listed.json()).data, []);
    const published = await fetch(`${base}/public/team`);
    assert.equal(published.status, 200);
    assert.deepEqual((await published.json()).data, []);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});

test('the runtime role definition covers every team table and column the API writes', () => {
  for (const table of ['team_departments', 'team_department_leaders', 'team_committees', 'team_committee_members']) {
    assert.ok(tables[table], table);
    assert.ok(tables[table].insert.includes('display_order'));
    assert.ok(tables[table].update.includes('updated_at'));
    assert.equal(tables[table].delete, true);
  }
  const sql = fs.readFileSync(path.join(__dirname, '../database/runtimePermissions.sql'), 'utf8');
  for (const table of Object.keys(tables).filter((name) => name.startsWith('team_'))) assert.match(sql, new RegExp(`"table":"${table}"`));
});

test('the seed migration keeps the current structure: 7 departments, 14 leaders, 162 committee members', () => {
  const sql = fs.readFileSync(path.join(__dirname, '../database/migrations/010_team_structure.sql'), 'utf8');
  assert.equal((sql.match(/INSERT INTO team_departments /g) || []).length, 7);
  assert.equal((sql.match(/^\s+\(dept_id, /gm) || []).length, 14);
  assert.equal((sql.match(/^\s+\(committee_id, /gm) || []).length, 162);
  assert.match(sql, /IF EXISTS \(SELECT 1 FROM team_departments\) THEN RETURN; END IF;/);
  // Every icon used by the seed is accepted by the API.
  for (const [, icon] of sql.matchAll(/VALUES \('([a-z]+)', /g)) assert.ok(team.TEAM_ICONS.includes(icon), icon);
});
