// Process-local, published content only. Authorization/visibility always runs before a read.
function createPublicContentCache({ now = Date.now, ttl = 30_000 } = {}) {
  const entries = new Map();
  function clear() { entries.clear(); }
  function read(key, load, lifetime = ttl) {
    const cached = entries.get(key);
    if (cached?.pending) return cached.pending;
    if (cached && now() - cached.savedAt < lifetime) return Promise.resolve(cached.data);
    const entry = {};
    entries.set(key, entry);
    entry.pending = Promise.resolve().then(load).then(data => {
      // A write may have invalidated this request while its database query was in flight.
      if (entries.get(key) === entry) { entry.data = data; entry.savedAt = now(); delete entry.pending; }
      return data;
    }).catch(error => {
      if (entries.get(key) === entry) entries.delete(key);
      throw error;
    });
    return entry.pending;
  }
  return { read, clear };
}

const pools = new WeakMap();
function publicContentCache(pool) {
  if (!pools.has(pool)) pools.set(pool, createPublicContentCache());
  return pools.get(pool);
}

module.exports = { createPublicContentCache, publicContentCache };
