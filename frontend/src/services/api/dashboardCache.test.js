import test from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardCache } from './dashboardCache.js';

const admin = { id: 1, role_code: 'super_admin', permissions: [] };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test('deduplicates simultaneous requests and reuses a fresh result until expiry', async () => {
  let time = 0, calls = 0;
  const cache = createDashboardCache({ now: () => time });
  cache.setSession(admin);
  const pending = deferred();
  const load = () => { calls++; return pending.promise; };
  const first = cache.read('/admin/about', load);
  const second = cache.read('/admin/about', load);
  assert.equal(first, second);
  pending.resolve({ title: 'Saved' });
  await first;
  time = 59_999;
  assert.deepEqual(await cache.read('/admin/about', load), { title: 'Saved' });
  assert.equal(calls, 1);
  time = 60_000;
  assert.equal(cache.peek('/admin/about', { freshOnly: true }), undefined);
  assert.deepEqual(cache.peek('/admin/about'), { title: 'Saved' });
  await cache.read('/admin/about', async () => { calls++; return { title: 'Updated elsewhere' }; });
  assert.equal(calls, 2);
});

test('forced refresh bypasses freshness, and failed refresh preserves the last result for display', async () => {
  const cache = createDashboardCache();
  cache.setSession(admin);
  await cache.read('/admin/stats', async () => ({ competitions: 2 }));
  await assert.rejects(cache.read('/admin/stats', async () => { throw new Error('Unavailable'); }, { force: true }), /Unavailable/);
  assert.deepEqual(cache.peek('/admin/stats'), { competitions: 2 });
  assert.equal(cache.peek('/admin/stats', { freshOnly: true }), undefined);
  assert.deepEqual(await cache.read('/admin/stats', async () => ({ competitions: 3 }), { force: true }), { competitions: 3 });
});

test('cache is disabled before session verification and cleared on account or permission changes', async () => {
  const cache = createDashboardCache();
  await cache.read('/admin/users', async () => ['Unverified']);
  assert.equal(cache.peek('/admin/users'), undefined);
  cache.setSession(admin);
  await cache.read('/admin/users', async () => ['First account']);
  cache.setSession({ ...admin });
  assert.deepEqual(cache.peek('/admin/users'), ['First account']);
  cache.setSession({ ...admin, id: 2 });
  assert.equal(cache.peek('/admin/users'), undefined);
  await cache.read('/admin/users', async () => ['Second account']);
  cache.setSession({ id: 2, role_code: 'team_member', permissions: ['workshops'] });
  assert.equal(cache.peek('/admin/users'), undefined);
  cache.clear();
  assert.equal(cache.peek('/admin/users'), undefined);
});

test('pending response cannot return or refill the cache after logout or an account switch', async () => {
  const cache = createDashboardCache();
  cache.setSession(admin);
  const pending = deferred();
  const request = cache.read('/admin/users', () => pending.promise);
  cache.clear();
  cache.setSession({ ...admin, id: 2 });
  pending.resolve(['Previous account']);
  await assert.rejects(request, { name: 'AbortError' });
  assert.equal(cache.peek('/admin/users'), undefined);
});

test('expiration notifies the dashboard globally and forbidden data can be removed without another request', async () => {
  const cache = createDashboardCache();
  cache.setSession(admin);
  await cache.read('/admin/stats', async () => ({ projects: 1 }));
  const events = [];
  const unsubscribe = cache.subscribe((path, type) => events.push([path, type]));
  cache.invalidate(path => path === '/admin/stats', { revalidate: false });
  assert.deepEqual(events, [['/admin/stats', 'data']]);
  assert.equal(cache.peek('/admin/stats'), undefined);
  cache.clear({ expired: true });
  assert.deepEqual(events.at(-1), [null, 'expired']);
  unsubscribe();
  cache.clear();
  assert.equal(events.length, 2);
});

test('successful save replaces About data and invalidates statistics without evicting unrelated sections', async () => {
  const cache = createDashboardCache();
  cache.setSession(admin);
  for (const path of ['/admin/about', '/admin/stats', '/admin/projects']) await cache.read(path, async () => ({ old: true }));
  cache.mutation('/admin/about', { title: 'Saved on server' }, 'PATCH');
  assert.deepEqual(cache.peek('/admin/about'), { title: 'Saved on server' });
  assert.equal(cache.peek('/admin/stats'), undefined);
  assert.deepEqual(cache.peek('/admin/projects'), { old: true });
});

test('save invalidates filtered lists and dependent lookups, and supersedes an older read', async () => {
  const cache = createDashboardCache();
  cache.setSession(admin);
  for (const path of ['/admin/workshops', '/admin/speakers?parent=7', '/admin/lookups/workshops', '/admin/stats']) await cache.read(path, async () => []);
  const pending = deferred();
  const staleRead = cache.read('/admin/workshops/7', () => pending.promise);
  cache.mutation('/admin/workshops/7', { id: 7, title_en: 'Saved workshop' }, 'PATCH');
  pending.resolve({ id: 7, title_en: 'Old workshop' });
  await assert.rejects(staleRead, { name: 'AbortError' });
  assert.deepEqual(cache.peek('/admin/workshops/7'), { id: 7, title_en: 'Saved workshop' });
  for (const path of ['/admin/workshops', '/admin/speakers?parent=7', '/admin/lookups/workshops', '/admin/stats']) assert.equal(cache.peek(path), undefined);
});

test('delete removes the cached record, while removing a speaker assignment installs its updated detail', async () => {
  const cache = createDashboardCache();
  cache.setSession(admin);
  await cache.read('/admin/speakers/3', async () => ({ id: 3, workshops: [{ workshop_id: 7 }] }));
  cache.mutation('/admin/speakers/3/workshops/7', { id: 3, workshops: [] }, 'DELETE');
  assert.deepEqual(cache.peek('/admin/speakers/3'), { id: 3, workshops: [] });
  cache.mutation('/admin/speakers/3', null, 'DELETE');
  assert.equal(cache.peek('/admin/speakers/3'), undefined);
});

test('parent queries stay separate, image uploads leave saved content intact, and memory is bounded', async () => {
  const cache = createDashboardCache({ maxEntries: 2 });
  cache.setSession(admin);
  await cache.read('/admin/teams?parent=1', async () => ['Team A']);
  await cache.read('/admin/teams?parent=2', async () => ['Team B']);
  assert.deepEqual(cache.peek('/admin/teams?parent=1'), ['Team A']);
  cache.mutation('/admin/images/teams', { url: 'https://example.com/image.png' }, 'POST');
  assert.deepEqual(cache.peek('/admin/teams?parent=2'), ['Team B']);
  await cache.read('/admin/about', async () => ({ title: 'About' }));
  assert.equal(cache.peek('/admin/teams?parent=1'), undefined);
});
