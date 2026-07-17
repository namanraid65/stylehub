import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Role = 'customer' | 'vendor' | 'admin';

export interface AuthUser {
  _id:        string;
  name:       string;
  email:      string;
  role:       Role;
  avatar?:    string;
  isVerified: boolean;
  isActive:   boolean;
}

interface AuthState {
  user:        AuthUser | null;
  accessToken: string | null;
  isLoading:   boolean;
  // Actions
  setAuth:     (user: AuthUser, token: string) => void;
  setToken:    (token: string) => void;
  clearAuth:   () => void;
  setLoading:  (loading: boolean) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:        null,
      accessToken: null,
      isLoading:   false,

      setAuth: (user, accessToken) => set({ user, accessToken }),
      setToken: (accessToken) => set({ accessToken }),
      clearAuth: () => set({ user: null, accessToken: null }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name:    'stylehub-admin-auth',
      // Only persist the token — re-fetch user on refresh
      partialize: (s) => ({ accessToken: s.accessToken }),
    },
  ),
);

// ─── Selectors ────────────────────────────────────────────────────────────────
export const useUser       = () => useAuthStore((s) => s.user);
export const useToken      = () => useAuthStore((s) => s.accessToken);
export const useIsLoggedIn = () => useAuthStore((s) => !!s.user && !!s.accessToken);
export const useIsAdmin    = () => useAuthStore((s) => s.user?.role === 'admin');
export const useIsVendor   = () => useAuthStore((s) => s.user?.role === 'vendor');
