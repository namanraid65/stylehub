import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useAuthStore } from '../../stores/auth.store';
import authApi from '../../api/auth.api';

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      authApi.me().then((res) => {
        const userData = res.data?.data || (res as any).data;
        if (userData) {
          useAuthStore.getState().setAuth(userData, token);
        }
      }).catch(() => null);
    }
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Mobile overlay ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {/* ── Main content area ────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header
          onMenuToggle={() => setMobileOpen((o) => !o)}
          onCollapseToggle={() => setCollapsed((c) => !c)}
          collapsed={collapsed}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
