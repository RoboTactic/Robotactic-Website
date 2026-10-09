export const DASHBOARD_CACHE_TTL = 60_000;

const superseded = () => new DOMException('Request superseded.', 'AbortError');

// Memory only: no administrative content is persisted in browser storage.
export function createDashboardCache({ now = Date.now, ttl = DASHBOARD_CACHE_TTL, maxEntries = 100 } = {}) {
  const entries = new Map();
  const listeners = new Set();
  let scope = null;
  let generation = 0;
  const emit = (path, type) => listeners.forEach(listener => listener(path, type));
  const current = token => token === generation;

  function clear({ expired = false } = {}) {
    generation += 1;
    scope = null;
    entries.clear();
    emit(null, expired ? 'expired' : 'clear');
  }

  function setSession(session) {
    const next = JSON.stringify([session.id, session.role_code, [...(session.permissions || [])].sort()]);
    if (scope !== next) { clear(); scope = next; }
  }

  function peek(path, { freshOnly = false } = {}) {
    const entry = entries.get(path);
    if (!scope || !entry || (freshOnly && now() - entry.savedAt >= ttl)) return undefined;
    return entry.data;
  }

  function store(path, data) {
    if (!scope) return;
    entries.delete(path);
    entries.set(path, { data, savedAt: now() });
    // Bound memory use for large dashboards, including per-record views.
    while (entries.size > maxEntries) entries.delete(entries.keys().next().value);
    emit(path, 'data');
  }

  function read(path, load, { force = false } = {}) {
    if (!scope) return load();
    let entry = entries.get(path);
    if (entry?.pending) return entry.pending;
    if (!force && peek(path, { freshOnly: true }) !== undefined) return Promise.resolve(entry.data);
    const token = generation;
    entry = { data: entry?.data, savedAt: entry?.savedAt ?? -Infinity };
    entries.set(path, entry);
    entry.pending = Promise.resolve().then(load).then(data => {
      if (!current(token) || entries.get(path) !== entry) throw superseded();
      store(path, data);
      return data;
    }).catch(error => {
      if (!current(token) || entries.get(path) !== entry) throw superseded();
      delete entry.pending;
      entry.savedAt = -Infinity;
      if (entry.data === undefined) entries.delete(path);
      throw error;
    });
    return entry.pending;
  }

  function invalidate(matches, { revalidate = true } = {}) {
    const removed = [...entries.keys()].filter(matches);
    removed.forEach(path => entries.delete(path));
    removed.forEach(path => emit(path, revalidate ? 'invalidate' : 'data'));
  }

  function mutation(path, data, method) {
    const parts = path.split('?')[0].split('/').filter(Boolean);
    const resource = parts[1];
    if (resource === 'images') return;
    const affected = new Set([resource, 'stats']);
    if (resource === 'competitions') affected.add('teams');
    if (resource === 'workshops') affected.add('speakers');
    if (resource === 'speakers') affected.add('workshops');
    // Remove related lists/filtered lists/details before installing the saved response.
    // Deferring notifications prevents a listener from refetching the old detail.
    const removed = [...entries.keys()].filter(key => {
      const segments = key.split('?')[0].split('/').filter(Boolean);
      return affected.has(segments[1]) || (segments[1] === 'lookups' && affected.has(segments[2]));
    });
    removed.forEach(key => entries.delete(key));
    let savedPath;
    if (data && (method !== 'DELETE' || (resource === 'speakers' && parts.length > 3))) {
      savedPath = resource === 'about' ? '/admin/about' : data.id != null ? `/admin/${resource}/${encodeURIComponent(data.id)}` : undefined;
      if (savedPath) store(savedPath, data);
    }
    removed.filter(key => key !== savedPath).forEach(key => emit(key, 'invalidate'));
  }

  return {
    peek, read, clear, setSession, mutation, invalidate,
    token: () => generation, current,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
}

export const dashboardCache = createDashboardCache();
