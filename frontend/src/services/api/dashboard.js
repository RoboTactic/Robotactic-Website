import { apiRequest } from './client';

export const getAdminSession = () => apiRequest('/auth/session');
export const loginAdmin = (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
export const logoutAdmin = () => apiRequest('/auth/logout', { method: 'POST' });
export const getDashboardRecords = (resource, parentId) => apiRequest(`/admin/${resource}${parentId ? `?parent=${encodeURIComponent(parentId)}` : ''}`);
export const createDashboardRecord = (resource, payload) => apiRequest(`/admin/${resource}`, { method: 'POST', body: JSON.stringify(payload) });
export const updateDashboardRecord = (resource, id, payload) => apiRequest(`/admin/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const deleteDashboardRecord = (resource, id) => apiRequest(`/admin/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' });
