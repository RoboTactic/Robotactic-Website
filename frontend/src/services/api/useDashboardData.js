import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from './client';
import { dashboardCache, DASHBOARD_CACHE_TTL } from './dashboardCache';

// Editors take a snapshot once. Read-only views can revalidate without a loading screen.
export function useDashboardData(path, onSessionExpired, { editable = false } = {}) {
  const [state, setState] = useState(() => ({ path, data: dashboardCache.peek(path, { freshOnly: editable }), error: '' }));
  const [revision, setRevision] = useState(0);
  const consumedRevision = useRef(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    if (!path) return;
    let active = true;
    const forced = consumedRevision.current !== revision;
    consumedRevision.current = revision;
    const cached = dashboardCache.peek(path, { freshOnly: editable });
    setState({ path, data: editable && forced ? undefined : cached, error: '' });
    async function refresh(force = false) {
      try {
        const data = await apiRequest(path, { forceRefresh: force });
        if (active) setState({ path, data, error: '' });
      } catch (issue) {
        if (!active || issue.name === 'AbortError') return;
        setState(previous => ({ path, data: [401, 403, 404].includes(issue.status) ? undefined : previous.data, error: issue.message }));
        if (issue.status === 401) onSessionExpired();
      }
    }
    refresh(forced);
    if (editable) return () => { active = false; };
    const unsubscribe = dashboardCache.subscribe((key, type) => {
      if (!active) return;
      if (type === 'clear' || type === 'expired') { setState({ path, data: undefined, error: '' }); return; }
      if (key !== path) return;
      if (type === 'invalidate') refresh();
      else setState({ path, data: dashboardCache.peek(path), error: '' });
    });
    const onFocus = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const timer = window.setInterval(onFocus, DASHBOARD_CACHE_TTL);
    return () => {
      active = false;
      unsubscribe();
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [path, editable, onSessionExpired, revision]);

  const data = state.path === path ? state.data : dashboardCache.peek(path, { freshOnly: editable });
  const error = state.path === path ? state.error : '';
  return { data, loading: Boolean(path) && data === undefined && !error, error, reload, setData: value => setState({ path, data: value, error: '' }) };
}
