import apiClient from './client';
import type { AuthUser } from '../stores/auth.store';

export interface LoginPayload  { email: string; password: string; }
export interface AuthResponse  { accessToken: string; }

const auth = {
  login:   (data: LoginPayload)  => apiClient.post<{ data: AuthResponse }>('/auth/login', data),
  logout:  ()                    => apiClient.post('/auth/logout'),
  me:      ()                    => apiClient.get<{ data: AuthUser }>('/auth/me'),
  refresh: ()                    => apiClient.post<{ data: AuthResponse }>('/auth/refresh-token'),
};

export default auth;

// ─── Dashboard stats ──────────────────────────────────────────────────────────
export const stats = {
  overview: () => apiClient.get('/admin/stats/overview'),
  revenue:  (period: 'week' | 'month' | 'year' = 'month') =>
    apiClient.get(`/admin/stats/revenue?period=${period}`),
};
