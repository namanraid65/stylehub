import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../stores/auth.store';
import authApi from '../../api/auth.api';
import { cn } from '../../lib/utils';

const LoginPage: React.FC = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { setAuth, setLoading } = useAuthStore();

  const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLocalLoading] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setLoading(true);
    setError('');

    try {
      const { data: loginData } = await authApi.login(form);
      const token = loginData.data.accessToken;
      
      // Save the token to the store first so the request interceptor can use it for the /me call
      useAuthStore.getState().setToken(token);

      const { data: meData }    = await authApi.me();
      
      // Save the full user credentials
      setAuth(meData.data, token);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      // Clear token on failure
      useAuthStore.getState().clearAuth();
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message ?? 'Invalid email or password.';
      setError(msg);
    } finally {
      setLocalLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel ──────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 gradient-violet flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-display font-bold text-2xl">StyleHub</span>
          </div>
        </div>

        <div className="relative space-y-4">
          <h1 className="text-white font-display text-5xl font-bold leading-tight">
            Your fashion<br />empire, managed.
          </h1>
          <p className="text-white/70 text-lg max-w-sm">
            Manage vendors, orders, and content from one powerful admin panel.
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Vendors',  value: '200+' },
              { label: 'Products', value: '12k+' },
              { label: 'Orders',   value: '50k+' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-white font-bold text-2xl font-display">{s.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/40 text-sm">
          © {new Date().getFullYear()} StyleHub. All rights reserved.
        </p>
      </div>

      {/* ── Right form panel ────────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center bg-background p-8">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-violet">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-xl">StyleHub</span>
          </div>

          <div>
            <h2 className="text-3xl font-bold font-display">Welcome back</h2>
            <p className="text-muted-foreground mt-1.5">Sign in to your admin account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" id="login-form">

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder="admin@stylehub.in"
                className={cn(
                  'w-full h-10 rounded-lg border border-input bg-background px-3 text-sm',
                  'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                  'transition-shadow',
                  error && 'border-destructive focus:ring-destructive',
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <a href="/forgot-password" className="text-xs text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={cn(
                    'w-full h-10 rounded-lg border border-input bg-background px-3 pr-10 text-sm',
                    'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
                    'transition-shadow',
                    error && 'border-destructive focus:ring-destructive',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-10" disabled={loading} id="login-submit">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Admin & Vendor access only.{' '}
            <a href="https://stylehub.in" className="text-primary hover:underline">
              Go to storefront →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
