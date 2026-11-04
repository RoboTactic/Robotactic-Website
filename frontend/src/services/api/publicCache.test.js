import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublicCache } from './publicCache.js';

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const fixture = options => {
  const cache = createPublicCache(options);
  cache.setVisibility({ competitions: true, workshops: true, timeline: true });
  return cache;
};

test('home, listings and schedule share one pending request and reuse fresh content', async () => {
  const cache = fixture();
  const pending = deferred();
  let calls = 0;
  const load = () => { calls++; return pending.promise; };
  const home = cache.read('competitions', load);
  const schedule = cache.read('competitions', load);
  assert.equal(home, schedule);
  pending.resolve([{ id: 1 }]);
  await home;
  assert.deepEqual(await cache.read('competitions', load), [{ id: 1 }]);
  assert.equal(calls, 1);
});

test('expired data remains visible during revalidation; live queries expire sooner', async () => {
  let now = 0;
  const cache = fixture({ now: () => now });
  await cache.read('competitions', async () => ['saved']);
  await cache.read('timeline-events?current=true', async () => ['live']);
  now = 16_000;
  let calls = 0;
  await cache.read('competitions', async () => { calls++; return []; });
  await cache.read('timeline-events?current=true', async () => { calls++; return []; });
  assert.equal(calls, 1);
  now = 61_000;
  const pending = deferred();
  const refresh = cache.read('competitions', () => pending.promise);
  assert.deepEqual(cache.snapshot('competitions').data, ['saved']);
  assert.equal(cache.snapshot('competitions').pending, true);
  pending.resolve(['updated']);
  await refresh;
  assert.deepEqual(cache.snapshot('competitions').data, ['updated']);
});

test('temporary refresh failures preserve data; forbidden and missing responses remove it', async () => {
  const cache = fixture();
  await cache.read('competitions', async () => ['saved']);
  await assert.rejects(cache.read('competitions', async () => { throw Object.assign(new Error('Unavailable'), { status: 503 }); }, { force: true }));
  assert.deepEqual(cache.snapshot('competitions').data, ['saved']);
  for (const status of [401, 403, 404]) {
    await cache.read('competitions', async () => ['saved'], { force: true });
    await assert.rejects(cache.read('competitions', async () => { throw Object.assign(new Error('Unavailable'), { status }); }, { force: true }));
    assert.equal(cache.snapshot('competitions').data, undefined);
  }
});

test('visibility is fail-closed and hiding a section discards cached and in-flight data', async () => {
  const cache = createPublicCache();
  let calls = 0;
  await assert.rejects(cache.read('projects', async () => { calls++; return []; }), { status: 404 });
  assert.equal(calls, 0);
  cache.setVisibility({ projects: true });
  await cache.read('projects', async () => ['saved']);
  const pending = deferred();
  const refresh = cache.read('projects', () => pending.promise, { force: true });
  cache.setVisibility({ projects: false });
  assert.equal(cache.snapshot('projects').data, undefined);
  pending.resolve(['must not reappear']);
  await assert.rejects(refresh, { name: 'AbortError' });
  assert.equal(cache.snapshot('projects').data, undefined);
  cache.setVisibility({ projects: true });
  assert.deepEqual(await cache.read('projects', async () => ['new publication']), ['new publication']);
  cache.setVisibility(null);
  assert.equal(cache.snapshot('projects').data, undefined);
});

test('admin invalidation supersedes old requests and notifies active views', async () => {
  const cache = fixture();
  const pending = deferred();
  const old = cache.read('workshops', () => pending.promise);
  let notices = 0;
  const unsubscribe = cache.subscribe('workshops', () => notices++);
  cache.invalidate();
  assert.equal(cache.snapshot('workshops').revision, 1);
  await cache.read('workshops', async () => ['saved edit']);
  pending.resolve(['old']);
  await assert.rejects(old, { name: 'AbortError' });
  assert.deepEqual(cache.snapshot('workshops').data, ['saved edit']);
  assert.ok(notices >= 2);
  unsubscribe();
});

test('queries have separate entries, empty responses are reusable, and inactive entries are bounded', async () => {
  const cache = fixture({ maxEntries: 2 });
  await cache.read('workshops?day=1', async () => []);
  await cache.read('workshops?day=2', async () => ['day two']);
  assert.deepEqual(cache.snapshot('workshops?day=1').data, []);
  await cache.read('competitions', async () => []);
  assert.equal(cache.snapshot('workshops?day=1').data, undefined);
  assert.deepEqual(cache.snapshot('workshops?day=2').data, ['day two']);
});
