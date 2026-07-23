import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Tag,
  Store,
  ShoppingCart,
  FileText,
  Settings,
  X,
  ChevronRight,
  Zap,
  Users,
  Star,
  MessageSquare,
  BarChart2,
  Activity,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { useUser } from '../../stores/auth.store';

// ─── Nav item definition ──────────────────────────────────────────────────────
interface NavItem {
  label:   string;
  to:      string;
  icon:    React.ElementType;
  badge?:  number;
  roles?:  ('admin' | 'vendor')[];
  section?:string;
}

const NAV_ITEMS: NavItem[] = [
  // ── Main
  { label: 'Dashboard',     to: '/dashboard',       icon: LayoutDashboard, section: 'Main' },
  { label: 'Orders',        to: '/orders',           icon: ShoppingCart,    roles: ['admin'], section: 'Main' },
  { label: 'Discounts',     to: '/discounts',        icon: Tag,             roles: ['admin', 'vendor'], section: 'Main' },
  // ── Catalogue
  { label: 'Products',      to: '/products',         icon: Package,         roles: ['admin'], section: 'Catalogue' },
  { label: 'Categories',    to: '/categories',       icon: Tag,             roles: ['admin'], section: 'Catalogue' },
  { label: 'Reviews',       to: '/reviews',          icon: Star,            roles: ['admin'], section: 'Catalogue' },
  // ── People
  { label: 'Vendors',       to: '/vendors',          icon: Store,           roles: ['admin'], section: 'People' },
  { label: 'Customers',     to: '/customers',        icon: Users,           roles: ['admin'], section: 'People' },
  { label: 'Enquiries',     to: '/enquiries',        icon: MessageSquare,   roles: ['admin'], section: 'People' },
  // ── Vendor store management (only shows for vendor role)
  { label: 'My Store',      to: '/vendor/store',     icon: Store,           roles: ['vendor'], section: 'My Store' },
  { label: 'My Products',   to: '/vendor/products',  icon: Package,         roles: ['vendor'], section: 'My Store' },
  { label: 'My Orders',     to: '/vendor/orders',    icon: ShoppingCart,    roles: ['vendor'], section: 'My Store' },
  { label: 'My Enquiries',  to: '/vendor/enquiries', icon: MessageSquare,   roles: ['vendor'], section: 'My Store' },
  { label: 'Payouts',       to: '/vendor/payouts',   icon: Zap,             roles: ['vendor'], section: 'My Store' },
  // ── Analytics (admin-only)
  { label: 'Analytics',     to: '/analytics',        icon: BarChart2,       roles: ['admin'], section: 'Analytics' },
  { label: 'Activity Log',  to: '/activity',         icon: Activity,        roles: ['admin'], section: 'Analytics' },
  // ── Content & Config
  { label: 'CMS',           to: '/cms',              icon: FileText,        roles: ['admin'], section: 'Content' },
  { label: 'Settings',      to: '/settings',         icon: Settings,        roles: ['admin'], section: 'Content' },
];



// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  collapsed:    boolean;
  mobileOpen:   boolean;
  onClose:      () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onClose }) => {
  const user     = useUser();
  const location = useLocation();

  // Filter nav items based on role
  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role as 'admin' | 'vendor')),
  );

  // Group by section
  const sections = ['Main', 'Catalogue', 'People', 'My Store', 'Analytics', 'Content'] as const;

  return (
    <aside
      className={cn(
        // Base
        'flex flex-col bg-sidebar text-sidebar border-r border-sidebar',
        'sidebar-transition overflow-hidden z-30',
        // Desktop width
        collapsed ? 'w-[72px]' : 'w-[260px]',
        // Mobile: fixed drawer
        'fixed inset-y-0 left-0 lg:relative lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className={cn(
        'flex items-center gap-3 px-4 border-b border-sidebar',
        'h-16 shrink-0',
      )}>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-violet shrink-0">
          <Zap className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sidebar font-display font-bold text-lg leading-none truncate">StyleHub</p>
            <p className="text-sidebar-muted text-xs mt-0.5 truncate">
              {user?.role === 'vendor' ? 'Vendor Panel' : 'Admin Panel'}
            </p>
          </div>
        )}
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="lg:hidden ml-auto p-1 rounded-md hover:bg-sidebar-hover text-sidebar-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {sections.map((section) => {
          const items = visibleItems.filter((i) => i.section === section);
          if (items.length === 0) return null;

          return (
            <div key={section}>
              {/* Section label */}
              {!collapsed && (
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                  {section}
                </p>
              )}

              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive =
                    item.to === '/dashboard'
                      ? location.pathname === '/dashboard'
                      : location.pathname.startsWith(item.to);

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                          'transition-all duration-150',
                          isActive
                            ? 'bg-sidebar-active text-sidebar-accent'
                            : 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar',
                          collapsed && 'justify-center',
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon
                          className={cn(
                            'h-4.5 w-4.5 shrink-0 transition-colors',
                            isActive ? 'text-sidebar-accent' : 'text-sidebar-muted group-hover:text-sidebar',
                          )}
                          style={{ height: '1.125rem', width: '1.125rem' }}
                        />

                        {!collapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>

                            {item.badge ? (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-sidebar-accent">
                                {item.badge}
                              </span>
                            ) : isActive ? (
                              <ChevronRight className="h-3.5 w-3.5 text-sidebar-accent opacity-60" />
                            ) : null}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* ── User info footer ────────────────────────────────────────────────── */}
      {user && (
        <div className={cn(
          'shrink-0 border-t border-sidebar px-3 py-3',
          collapsed ? 'flex justify-center' : 'flex items-center gap-3',
        )}>
          <div className="h-8 w-8 shrink-0 rounded-full gradient-violet flex items-center justify-center text-white font-bold text-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sidebar text-sm font-medium truncate">{user.name}</p>
              <p className="text-sidebar-muted text-xs truncate">{user.role}</p>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
