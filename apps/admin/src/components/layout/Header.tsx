import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
  Bell,
  LogOut,
  User,
  Search,
} from 'lucide-react';
import { Button } from '../ui/button';
import { useUser, useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import notificationApi, { Notification } from '../../api/notification.api';
import { cn } from '../../lib/utils';

interface HeaderProps {
  onMenuToggle:     () => void;
  onCollapseToggle: () => void;
  collapsed:        boolean;
}

const THEME_ICONS = {
  light:  Sun,
  dark:   Moon,
  system: Monitor,
} as const;

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const Header: React.FC<HeaderProps> = ({ onMenuToggle, onCollapseToggle, collapsed }) => {
  const user     = useUser();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Notifications state
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationApi.list({ limit: 5 });
      if (res.data?.success) {
        setNotifs(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isNotifOpen]);

  const cycleTheme = () => {
    const order: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system'];
    const next = order[(order.indexOf(theme) + 1) % order.length]!;
    setTheme(next);
  };

  const handleLogout = async () => {
    try { await apiClient.post('/auth/logout'); } catch { /* ignore */ }
    clearAuth();
    navigate('/login', { replace: true });
  };

  const handleNotifClick = async (n: Notification) => {
    setIsNotifOpen(false);
    if (!n.isRead) {
      try {
        await notificationApi.markRead(n._id);
        fetchNotifications();
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const ThemeIcon = THEME_ICONS[theme];

  return (
    <header className="h-16 shrink-0 flex items-center gap-3 border-b border-border bg-card/80 backdrop-blur-sm px-4 sm:px-6">

      {/* Desktop: collapse sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onCollapseToggle}
        className="hidden lg:flex text-muted-foreground"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
      </Button>

      {/* Mobile: open sidebar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onMenuToggle}
        className="lg:hidden text-muted-foreground"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* ── Search bar ──────────────────────────────────────────────────────── */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Search products, orders, vendors…"
            className={cn(
              'w-full h-9 rounded-lg border border-input bg-background pl-9 pr-4 text-sm',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
              'transition-shadow',
            )}
          />
        </div>
      </div>

      {/* ── Right actions ────────────────────────────────────────────────────── */}
      <div className="ml-auto flex items-center gap-1">

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={cycleTheme}
          className="text-muted-foreground"
          title={`Theme: ${theme}`}
        >
          <ThemeIcon className="h-4.5 w-4.5" />
        </Button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-muted-foreground relative"
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </Button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-popover text-popover-foreground shadow-lg z-50 overflow-hidden">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  notifs.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleNotifClick(n)}
                      className={cn(
                        "p-3 border-b border-border/50 cursor-pointer hover:bg-muted/50 transition-colors flex gap-3 text-left",
                        !n.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <p className={cn("text-xs font-semibold truncate", !n.isRead && "text-foreground font-bold")}>
                            {n.title}
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(n.createdAt)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-normal">
                          {n.message}
                        </p>
                      </div>
                      {!n.isRead && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 self-center" />
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 bg-muted/30 border-t border-border text-center">
                <button
                  onClick={() => { setIsNotifOpen(false); navigate('/activity'); }}
                  className="text-xs text-muted-foreground hover:text-foreground font-medium"
                >
                  View all activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="flex items-center gap-2 ml-1 pl-3 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium leading-none">{user?.name ?? '—'}</p>
            <p className="text-xs text-muted-foreground mt-0.5 capitalize">{user?.role}</p>
          </div>
          <div className="h-8 w-8 rounded-full gradient-violet flex items-center justify-center text-white font-bold text-sm shrink-0">
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
