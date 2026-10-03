import { useCallback, useEffect, useState } from 'react';
import { getPublic } from './client';

export function useApiData(resource, query = '') {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });
    getPublic(resource, { query, signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ data: null, loading: false, error });
      });
    return () => controller.abort();
  }, [resource, query, revision]);

  const reload = useCallback(() => setRevision((value) => value + 1), []);
  return { ...state, reload };
}
