const test = require('node:test');
const assert = require('node:assert/strict');
const { createPublicContentCache } = require('../services/publicContentCache');

test('concurrent visitors share one published-content query until expiry', async () => {
  let time = 0;
  let calls = 0;
  const cache = createPublicContentCache({ now: () => time, ttl: 30_000 });
  const load = async () => { calls++; return [{ id: calls }]; };
  const [first, second] = await Promise.all([cache.read('competitions', load), cache.read('competitions', load)]);
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  await cache.read('competitions', load);
  assert.equal(calls, 1);
  time = 30_001;
  assert.deepEqual(await cache.read('competitions', load), [{ id: 2 }]);
});

test('a failed database query is not cached', async () => {
  const cache = createPublicContentCache();
  await assert.rejects(cache.read('workshops', async () => { throw new Error('Synthetic failure'); }));
  assert.deepEqual(await cache.read('workshops', async () => []), []);
});

test('a completed admin write invalidates pending and completed public responses', async () => {
  const cache = createPublicContentCache();
  let resolve;
  const pending = new Promise(done => { resolve = done; });
  const beforeEdit = cache.read('workshops', () => pending);
  cache.clear();
  await cache.read('workshops', async () => ['saved']);
  resolve(['old']);
  await beforeEdit;
  assert.deepEqual(await cache.read('workshops', async () => assert.fail('Should use the saved response')), ['saved']);
  cache.clear();
  assert.deepEqual(await cache.read('workshops', async () => ['updated again']), ['updated again']);
});
