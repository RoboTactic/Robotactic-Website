import { publicSections } from '../../data/publicSections.js';

export const PUBLIC_CACHE_TTL = 60_000;
export const LIVE_CACHE_TTL = 15_000;
const EMPTY = Object.freeze({ data: undefined, error: null, pending: false, revision: 0 });
const superseded = () => new DOMException('Request superseded.', 'AbortError');
export const sectionForResource = resource => resource === 'timeline-events' ? 'timeline'
  : publicSections.find(section => section.resource === resource)?.key;

// Published responses only, in memory. Never persist content or visibility in browser storage.
export function createPublicCache({ now = Date.now, ttl = PUBLIC_CACHE_TTL, maxEntries = 100 } = {}) {
  const entries = new Map();
  const listeners = new Map();
  let visibility = null;
  const allowed = key => {
    const section = sectionForResource(key.split('?')[0]);
    return !section || visibility?.[section] === true;
  };
  const snapshot = key => entries.get(key)?.state || EMPTY;
  const emit = key => listeners.get(key)?.forEach(listener => listener());
  function subscribe(key, listener) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(listener);
    return () => {
      listeners.get(key)?.delete(listener);
      if (!listeners.get(key)?.size) listeners.delete(key);
    };
  }
  function invalidate(matches = () => true) {
    for (const [key, entry] of entries) {
      if (!matches(key)) continue;
      entry.controller?.abort();
      entries.set(key, { state: { ...EMPTY, revision: entry.state.revision + 1 }, savedAt: -Infinity });
      emit(key);
    }
  }
  function setVisibility(next) {
    visibility = next;
    invalidate(key => !allowed(key));
  }
  function read(key, load, { force = false } = {}) {
    if (!allowed(key)) return Promise.reject(Object.assign(new Error('Content is unavailable.'), { status: 404 }));
    let entry = entries.get(key);
    if (entry?.promise) return entry.promise;
    const lifetime = key.startsWith('timeline-events') ? LIVE_CACHE_TTL : ttl;
    if (!force && entry?.state.data !== undefined && now() - entry.savedAt < lifetime) return Promise.resolve(entry.state.data);
    const controller = new AbortController();
    entry = { state: { ...(entry?.state || EMPTY), error: null, pending: true }, savedAt: entry?.savedAt ?? -Infinity, controller };
    entries.set(key, entry);
    entry.promise = Promise.resolve().then(() => load(controller.signal)).then(data => {
      if (entries.get(key) !== entry || controller.signal.aborted || !allowed(key)) throw superseded();
      entry.state = { ...entry.state, data, error: null, pending: false };
      entry.savedAt = now();
      return data;
    }).catch(error => {
      if (entries.get(key) !== entry || controller.signal.aborted) throw superseded();
      // A revoked/unavailable response must never leave previously published content visible.
      const revoked = [401, 403, 404].includes(error.status);
      entry.state = { ...entry.state, data: revoked ? undefined : entry.state.data, error, pending: false };
      entry.savedAt = -Infinity;
      throw error;
    }).finally(() => {
      if (entries.get(key) === entry) { delete entry.promise; delete entry.controller; emit(key); }
    });
    emit(key);
    // Bound memory without evicting active consumers or interrupting shared requests.
    for (const [oldKey, old] of entries) {
      if (entries.size <= maxEntries) break;
      if (oldKey !== key && !listeners.has(oldKey) && !old.promise) entries.delete(oldKey);
    }
    return entry.promise;
  }
  return { snapshot, subscribe, read, invalidate, setVisibility };
}

export const publicCache = createPublicCache();
