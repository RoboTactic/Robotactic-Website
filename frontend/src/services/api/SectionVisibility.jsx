import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from './client';
import { isPublicPathVisible, isSectionVisible } from '../../data/publicSections';
import ApiState from '../../components/ApiState/ApiState';
import { publicCache } from './publicCache';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';

export const SectionVisibilityContext = createContext(null);

export function SectionVisibilityProvider({ children }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const request = useRef(null);
  const active = useRef(false);
  const lastSuccess = useRef(-Infinity);
  const visibility = useRef(null);
  const { pathname } = useLocation();
  const reload = useCallback(({ force = false } = {}) => {
    if (request.current) return request.current.promise;
    // Navigation, focus and visibilitychange often fire together; share one check.
    if (!force && Date.now() - lastSuccess.current < 5_000) return Promise.resolve();
    const controller = new AbortController();
    const pending = { controller };
    request.current = pending;
    pending.promise = apiRequest('/public/section-visibility', { cache: 'no-store', signal: controller.signal })
      .then(data => {
        if (!controller.signal.aborted && active.current) {
          lastSuccess.current = Date.now();
          visibility.current = data;
          publicCache.setVisibility(data);
          setState({ data, loading: false, error: null });
        }
      }).catch(error => {
        if (!controller.signal.aborted && active.current) {
          publicCache.setVisibility(null);
          visibility.current = null;
          setState({ data: null, loading: false, error });
        }
      }).finally(() => { if (request.current === pending) request.current = null; });
    return pending.promise;
  }, []);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => {
    reload();
  }, [pathname, reload]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [reload]);
  const apply = useCallback(({ section, visible }) => {
    request.current?.controller.abort();
    request.current = null;
    setState(previous => ({ ...previous, data: { ...previous.data, [section]: visible }, error: null }));
    // Revoke cached responses immediately, before the server confirmation returns.
    visibility.current = { ...visibility.current, [section]: visible };
    publicCache.setVisibility(visibility.current);
    publicCache.invalidate();
    lastSuccess.current = -Infinity;
    reload({ force: true });
  }, [reload]);
  const value = useMemo(() => ({
    ...state, reload, apply,
    isVisible: key => isSectionVisible(state.data, key),
    isPathVisible: path => isPublicPathVisible(state.data, path),
  }), [state, reload, apply]);
  return <SectionVisibilityContext.Provider value={value}>{children}</SectionVisibilityContext.Provider>;
}

export function useSectionVisibility() {
  return useContext(SectionVisibilityContext);
}

export function PublicSectionState({ children }) {
  const { loading, error, reload } = useSectionVisibility();
  if (loading) return <LoadingScreen />;
  if (error) return <div className="container"><ApiState error={error} onRetry={() => reload({ force: true })} /></div>;
  return children;
}
