import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getPublic } from './client';
import { LIVE_CACHE_TTL, PUBLIC_CACHE_TTL, publicCache, sectionForResource } from './publicCache';
import { useSectionVisibility } from './SectionVisibility';

export function useApiData(resource, query = '') {
  const key = `${resource}${query}`;
  const visibility = useSectionVisibility();
  const section = sectionForResource(resource);
  const enabled = !section || visibility?.isVisible(section);
  const subscribe = useCallback(listener => publicCache.subscribe(key, listener), [key]);
  const snapshot = useCallback(() => publicCache.snapshot(key), [key]);
  const state = useSyncExternalStore(subscribe, snapshot);
  const reload = useCallback(() => {
    if (enabled) return getPublic(resource, { query, forceRefresh: true }).catch(() => {});
  }, [resource, query, enabled]);

  useEffect(() => {
    if (!enabled) return undefined;
    // The cache owns cancellation: unmounting one view must not abort another view's request.
    const refresh = () => {
      if (document.visibilityState === 'visible') getPublic(resource, { query }).catch(() => {});
    };
    getPublic(resource, { query }).catch(() => {});
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, resource === 'timeline-events' ? LIVE_CACHE_TTL : PUBLIC_CACHE_TTL);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [resource, query, enabled, state.revision]);

  const hasData = enabled && state.data !== undefined;
  return {
    data: hasData ? state.data : null,
    loading: Boolean(enabled && !hasData && !state.error),
    error: enabled && !hasData ? state.error : null,
    refreshing: Boolean(enabled && hasData && state.pending),
    refreshError: hasData ? state.error : null,
    reload,
  };
}
