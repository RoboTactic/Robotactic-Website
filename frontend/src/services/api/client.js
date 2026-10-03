const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body != null && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError('تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مجددًا.', 0);
  }
  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload.message || 'تعذر إكمال الطلب.', response.status);
  return Object.hasOwn(payload, 'data') ? payload.data : payload;
}

export const getPublic = (resource, options = {}) => apiRequest(`/public/${resource}${options.query || ''}`, { signal: options.signal });
export const getAdmin = (resource, options = {}) => apiRequest(`/admin/${resource}${options.query || ''}`, { signal: options.signal });
export const createAdmin = (resource, value) => apiRequest(`/admin/${resource}`, { method: 'POST', body: JSON.stringify(value) });
export const updateAdmin = (resource, id, value) => apiRequest(`/admin/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(value) });
export const deleteAdmin = (resource, id) => apiRequest(`/admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const apiBaseUrl = API_BASE_URL;
