const test = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
process.env.AUTH_TOKEN_SECRET = randomBytes(48).toString('hex');
const express = require('express');
const { createApiRoutes } = require('../routes');
const { errorHandler } = require('../middleware/errorHandler');
const { createToken, COOKIE_NAME } = require('../middleware/authenticate');
const { PUBLIC_SECTIONS } = require('../config/publicSections');
const service = require('../services/sectionVisibilityService');

async function fixture(run) {
  const visibility = new Map(Object.keys(PUBLIC_SECTIONS).map(key => [key, true]));
  let admin = { id: 91000, role_code: 'super_admin', permissions: [] };
  let writes = 0;
  let contentReads = 0;
  const pool = { async query(sql, params) {
    if (sql.includes('FROM admin_users')) return { rows: [admin], rowCount: 1 };
    if (sql.includes('INSERT INTO public_section_visibility')) {
      assert.deepEqual(params.length, 2);
      assert.ok(Object.hasOwn(PUBLIC_SECTIONS, params[0]));
      visibility.set(params[0], params[1]); writes++;
      return { rows: [{ section_key: params[0], is_visible: params[1] }], rowCount: 1 };
    }
    if (sql.includes('FROM public_section_visibility')) return { rows: params
      ? visibility.has(params[0]) ? [{ is_visible: visibility.get(params[0]) }] : []
      : [...visibility].map(([section_key, is_visible]) => ({ section_key, is_visible })) };
    contentReads++;
    return { rows: [{ id: 1, title_ar: 'محتوى محفوظ', marker: 'preserved' }], rowCount: 1 };
  } };
  const app = express();
  app.use(express.json({ limit: '1kb' }));
  app.use((req, _res, next) => {
    req.cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map(part => part.trim().split('=')));
    next();
  });
  app.use('/api', createApiRoutes({ pool, authTokenSecret: process.env.AUTH_TOKEN_SECRET, corsOrigins: ['http://localhost:5173'], isProduction: false }));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const headers = { Cookie: `${COOKIE_NAME}=${createToken(admin, process.env.AUTH_TOKEN_SECRET)}`, Origin: 'http://localhost:5173', 'Content-Type': 'application/json' };
  const request = (path, options = {}) => fetch(`${base}${path}`, options);
  const patch = (section, body, overrides = {}) => request(`/admin/section-visibility/${section}`, { method: 'PATCH', headers: { ...headers, ...overrides }, body: JSON.stringify(body) });
  try { await run({ visibility, request, patch, headers, setAdmin: value => { admin = { ...admin, ...value }; }, counts: () => ({ writes, contentReads }) }); }
  finally { await new Promise(resolve => server.close(resolve)); }
}

test('hide and restore every public section without deleting content or blocking its admin editor', async () => fixture(async ({ request, patch, counts }) => {
  const routes = { competitions: 'competitions', workshops: 'workshops', projects: 'projects', announcements: 'announcements', about: 'about', team: 'team-members', timeline: 'timeline-events' };
  for (const [section, route] of Object.entries(routes)) {
    assert.equal((await patch(section, { visible: false })).status, 200);
    const before = counts().contentReads;
    const hidden = await request(`/public/${route}`);
    assert.equal(hidden.status, 404);
    assert.equal(hidden.headers.get('cache-control'), 'no-store');
    assert.equal(counts().contentReads, before, 'Hidden content must not be queried');
    const flags = await request('/public/section-visibility');
    assert.equal(flags.headers.get('cache-control'), 'no-store');
    assert.equal((await flags.json()).data[section], false);
    if (section !== 'timeline') {
      assert.equal((await request(`/admin/${route}`, { headers: { Cookie: `${COOKIE_NAME}=${createToken({ id: 91000 }, process.env.AUTH_TOKEN_SECRET)}` } })).status, 200);
    }
    assert.equal((await patch(section, { visible: true })).status, 200);
    const restored = await request(`/public/${route}`);
    assert.equal(restored.status, 200);
    assert.ok(JSON.stringify(await restored.json()).includes('preserved'));
  }
}));

test('visibility changes require authentication, trusted Origin and section permissions from the server', async () => fixture(async ({ request, patch, setAdmin, counts }) => {
  assert.equal((await request('/admin/section-visibility')).status, 401);
  assert.equal((await request('/admin/section-visibility/projects', { method: 'PATCH' })).status, 401);
  assert.equal((await patch('projects', { visible: false }, { Origin: 'https://untrusted.invalid' })).status, 403);
  assert.equal((await patch('projects', { visible: false }, { Origin: '' })).status, 403);
  setAdmin({ role_code: 'workshop_manager', permissions: ['workshops'] });
  assert.equal((await patch('workshops', { visible: false })).status, 200);
  for (const section of ['competitions', 'projects', 'about', 'team', 'timeline']) assert.equal((await patch(section, { visible: false })).status, 403);
  setAdmin({ role_code: 'competition_manager', permissions: ['competitions'] });
  assert.equal((await patch('competitions', { visible: false })).status, 200);
  assert.equal((await patch('workshops', { visible: true })).status, 403);
  setAdmin({ role_code: 'team_member', permissions: ['about', 'team-members', 'site-visibility'] });
  for (const section of ['about', 'team', 'timeline']) assert.equal((await patch(section, { visible: false })).status, 403);
  assert.equal(counts().writes, 2);
}));

test('invalid keys and bodies cannot change visibility; missing settings stay hidden', async () => fixture(async ({ visibility, request, patch, counts }) => {
  for (const body of [null, [], {}, { visible: 'false' }, { visible: 0 }, { visible: null }, { visible: true, extra: false }]) {
    assert.equal((await patch('projects', body)).status, 400);
  }
  for (const section of ['missing', 'constructor', '__proto__']) assert.equal((await patch(section, { visible: false })).status, 404);
  assert.equal(counts().writes, 0);
  visibility.delete('projects');
  assert.equal((await request('/public/projects')).status, 404);
  assert.equal((await (await request('/public/section-visibility')).json()).data.projects, false);
}));

test('unknown and missing visibility settings never expose optional sections', async () => {
  await assert.rejects(service.requireVisible({ query: async () => ({ rows: [] }) }, 'projects'), { statusCode: 404 });
  const result = await service.get({ query: async () => ({ rows: [{ section_key: 'unknown', is_visible: true }] }) });
  assert.ok(Object.values(result).every(value => value === false));
});

test('warm public caches still check visibility and successful admin writes invalidate content', async () => fixture(async ({ request, patch, counts }) => {
  assert.equal((await request('/public/competitions')).status, 200);
  const reads = counts().contentReads;
  assert.equal((await request('/public/competitions')).status, 200);
  assert.equal(counts().contentReads, reads, 'Published content should be reused');
  assert.equal((await patch('workshops', { visible: false })).status, 200);
  assert.equal((await request('/public/competitions')).status, 200);
  assert.equal(counts().contentReads, reads + 1, 'Successful writes must invalidate public responses');
  assert.equal((await patch('competitions', { visible: false })).status, 200);
  const beforeHidden = counts().contentReads;
  assert.equal((await request('/public/competitions')).status, 404);
  assert.equal(counts().contentReads, beforeHidden, 'A warm cache must never bypass a hidden section');
}));

test('a visibility database failure returns a safe error before any content is served', async () => {
  const { requirePublicSection } = require('../middleware/requirePublicSection');
  const app = express();
  const pool = { query: async () => { throw new Error('Synthetic internal database detail'); } };
  app.get('/', requirePublicSection(pool, 'projects'), () => assert.fail('Content must remain unavailable'));
  app.use(errorHandler);
  const server = app.listen(0);
  await new Promise(resolve => server.once('listening', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}`);
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { message: 'Internal server error' });
  } finally { await new Promise(resolve => server.close(resolve)); }
});
