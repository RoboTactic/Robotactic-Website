import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiRequest } from './client';
import { isPublicPathVisible, isSectionVisible } from '../../data/publicSections';
import ApiState from '../../components/ApiState/ApiState';

export const SectionVisibilityContext = createContext(null);

export function SectionVisibilityProvider({ children }) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const request = useRef(null);
  const { pathname } = useLocation();
  const reload = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    try {
      const data = await apiRequest('/public/section-visibility', { cache: 'no-store', signal: controller.signal });
      if (!controller.signal.aborted) setState({ data, loading: false, error: null });
    } catch (error) {
      if (!controller.signal.aborted) setState({ data: null, loading: false, error });
    }
  }, []);
  useEffect(() => {
    reload();
    const refresh = () => { if (document.visibilityState === 'visible') reload(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      request.current?.abort();
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [pathname, reload]);
  const apply = useCallback(({ section, visible }) => {
    request.current?.abort();
    setState(previous => ({ ...previous, data: { ...previous.data, [section]: visible } }));
    reload();
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

export function PublicVisibilityState({ children }) {
  const { loading, error, reload } = useSectionVisibility();
  if (loading || error) return <div className="container"><ApiState loading={loading} error={error} onRetry={reload} /></div>;
  return children;
}
