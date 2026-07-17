import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, Search, Filter, RefreshCw, Download,
  ShoppingCart, Star, MessageSquare, User, Package,
  Settings, Shield, Tag, ArrowRight, Loader2,
} from 'lucide-react';
import activityApi from '../../api/activity.api';
import { cn } from '../../lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ActivityLog {
  id:        string;
  actorName: string;
  actorRole: 'admin' | 'vendor' | 'customer' | 'system';
  action:    string;
  entity:    string;
  entityId:  string;
  summary:   string;
  ip:        string;
  createdAt: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const ACTION_COLORS: Record<string, string> = {
  'order.create':    'bg-blue-100 text-blue-700',
  'order.status':    'bg-cyan-100 text-cyan-700',
  'order.cancel':    'bg-red-100 text-red-700',
  'review.submit':   'bg-amber-100 text-amber-700',
  'review.approve':  'bg-emerald-100 text-emerald-700',
  'review.reject':   'bg-red-100 text-red-700',
  'enquiry.create':  'bg-purple-100 text-purple-700',
  'enquiry.reply':   'bg-violet-100 text-violet-700',
  'enquiry.resolve': 'bg-emerald-100 text-emerald-700',
  'product.create':  'bg-indigo-100 text-indigo-700',
  'product.update':  'bg-sky-100 text-sky-700',
  'product.delete':  'bg-red-100 text-red-700',
  'auth.login':      'bg-slate-100 text-slate-700',
  'coupon.create':   'bg-rose-100 text-rose-700',
  'admin.action':    'bg-orange-100 text-orange-700',
};

const ENTITY_ICONS: Record<string, LucideIcon> = {
  Order:   ShoppingCart,
  Review:  Star,
  Enquiry: MessageSquare,
  Product: Package,
  User:    User,
  Coupon:  Tag,
  System:  Settings,
};

const MOCK_LOGS: ActivityLog[] = [
  { id: '1', actorName: 'Priya Sharma',   actorRole: 'customer', action: 'order.create',    entity: 'Order',   entityId: 'SH-2026-00047', summary: 'Priya Sharma placed order SH-2026-00047 for ₹3,499',  ip: '192.168.1.42', createdAt: new Date(Date.now() - 2*60000).toISOString() },
  { id: '2', actorName: 'Admin User',     actorRole: 'admin',    action: 'review.approve',  entity: 'Review',  entityId: 'rev-001', summary: 'Admin approved review by Ananya S. on Ivory Kurta',    ip: '10.0.0.1',    createdAt: new Date(Date.now() - 8*60000).toISOString() },
  { id: '3', actorName: 'DesiCouture',    actorRole: 'vendor',   action: 'product.update',  entity: 'Product', entityId: 'prod-001', summary: 'DesiCouture updated Ivory Anarkali Kurta pricing',      ip: '172.16.0.5',  createdAt: new Date(Date.now() - 15*60000).toISOString() },
  { id: '4', actorName: 'Rahul Verma',    actorRole: 'customer', action: 'enquiry.create',  entity: 'Enquiry', entityId: 'enq-012', summary: 'Rahul Verma sent bulk order enquiry for 50 kurtas',      ip: '192.168.2.19', createdAt: new Date(Date.now() - 32*60000).toISOString() },
  { id: '5', actorName: 'Admin User',     actorRole: 'admin',    action: 'coupon.create',   entity: 'Coupon',  entityId: 'STYLE10', summary: 'Admin created coupon STYLE10 — 10% off, max ₹500',        ip: '10.0.0.1',    createdAt: new Date(Date.now() - 1*3600000).toISOString() },
  { id: '6', actorName: 'UrbanThreads',   actorRole: 'vendor',   action: 'order.status',    entity: 'Order',   entityId: 'SH-2026-00046', summary: 'UrbanThreads updated order SH-2026-00046 to shipped',    ip: '172.16.0.8',  createdAt: new Date(Date.now() - 2*3600000).toISOString() },
  { id: '7', actorName: 'Ananya Singh',   actorRole: 'customer', action: 'review.submit',   entity: 'Review',  entityId: 'rev-002', summary: 'Ananya Singh submitted a 5-star review for Maxi Dress',  ip: '192.168.3.7', createdAt: new Date(Date.now() - 3*3600000).toISOString() },
  { id: '8', actorName: 'DesiCouture',    actorRole: 'vendor',   action: 'enquiry.reply',   entity: 'Enquiry', entityId: 'enq-011', summary: 'DesiCouture replied to custom embroidery enquiry',        ip: '172.16.0.5',  createdAt: new Date(Date.now() - 4*3600000).toISOString() },
  { id: '9', actorName: 'Admin User',     actorRole: 'admin',    action: 'product.create',  entity: 'Product', entityId: 'prod-009', summary: 'Admin created product: Rose Gold Bangle Set',             ip: '10.0.0.1',    createdAt: new Date(Date.now() - 5*3600000).toISOString() },
  { id:'10', actorName: 'Karan Mehra',    actorRole: 'customer', action: 'auth.login',      entity: 'User',    entityId: 'usr-karan', summary: 'Karan Mehra logged in from Chrome/Windows',              ip: '192.168.4.21', createdAt: new Date(Date.now() - 6*3600000).toISOString() },
  { id:'11', actorName: 'Admin User',     actorRole: 'admin',    action: 'review.reject',   entity: 'Review',  entityId: 'rev-003', summary: 'Admin rejected review — contains inappropriate content',   ip: '10.0.0.1',    createdAt: new Date(Date.now() - 8*3600000).toISOString() },
  { id:'12', actorName: 'SoleMate',       actorRole: 'vendor',   action: 'enquiry.resolve', entity: 'Enquiry', entityId: 'enq-010', summary: 'SoleMate resolved enquiry about handcrafted sandals',     ip: '172.16.0.9',  createdAt: new Date(Date.now() - 24*3600000).toISOString() },
];

const ROLE_BADGE: Record<string, string> = {
  admin:    'bg-violet-100 text-violet-700 border-violet-200',
  vendor:   'bg-blue-100 text-blue-700 border-blue-200',
  customer: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  system:   'bg-slate-100 text-slate-700 border-slate-200',
};

const fmt = (iso: string) => {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'numeric', minute:'2-digit' });
};

// ─── Summary pills ────────────────────────────────────────────────────────────
const ACTION_SUMMARY = [
  { action: 'order.create',   count: 47 },
  { action: 'review.submit',  count: 23 },
  { action: 'enquiry.create', count: 18 },
  { action: 'product.update', count: 12 },
  { action: 'auth.login',     count: 89 },
];

export default function ActivityLogPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const [logs, setLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const fetchLogs = async (currentLimit = limit) => {
    setLoading(true);
    try {
      const params: any = { limit: currentLimit };
      if (search) params.search = search;
      if (roleFilter !== 'all') params.actorRole = roleFilter;
      if (entityFilter !== 'all') params.entity = entityFilter;

      const [listRes, summaryRes] = await Promise.all([
        activityApi.list(params),
        activityApi.summary()
      ]);

      setLogs(listRes.data?.logs || []);
      setTotal(listRes.data?.total || 0);
      
      const summaryData = summaryRes.data?.data || [];
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [search, roleFilter, entityFilter, limit]);

  const defaultActions = ['order.create', 'review.submit', 'enquiry.create', 'product.update', 'auth.login'];
  const liveSummary = defaultActions.map(actionName => {
    const found = summary.find(s => s._id === actionName);
    return {
      action: actionName,
      count: found ? found.count : 0
    };
  });

  const filtered = logs;
  const totalEntries = total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm text-muted-foreground">Real-time audit trail of all platform actions</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fetchLogs()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* 7-day action summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Last 7 days — Top actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {liveSummary.map((a) => (
              <div
                key={a.action}
                className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border', ACTION_COLORS[a.action] ?? 'bg-slate-100 text-slate-700')}
              >
                <Activity className="h-3 w-3" />
                {a.action}
                <span className="font-bold ml-1">{a.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by actor or action summary…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="vendor">Vendor</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">All Entities</option>
            {['Order','Review','Enquiry','Product','User','Coupon'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Log table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actor</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Entity</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Summary</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">IP</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => {
                const EntityIcon = ENTITY_ICONS[log.entity] ?? Activity;
                return (
                  <tr key={log._id || log.id} className="hover:bg-muted/20 transition-colors group">
                    {/* Actor */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-white text-xs flex items-center justify-center font-semibold shrink-0">
                          {log.actorName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-xs">{log.actorName}</p>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full border', ROLE_BADGE[log.actorRole])}>
                            {log.actorRole}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold', ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-700')}>
                        <Activity className="h-2.5 w-2.5" />
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <EntityIcon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs">{log.entity}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{log.entityId}</span>
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-xs text-muted-foreground line-clamp-2">{log.summary}</p>
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 text-right hidden lg:table-cell">
                      <span className="text-[10px] font-mono text-muted-foreground">{log.ip}</span>
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-right">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{fmt(log.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No logs match your filters</p>
          </div>
        )}

        {/* Footer */}
        <div className="border-t px-4 py-3 flex items-center justify-between bg-muted/10">
          <p className="text-xs text-muted-foreground">Showing {filtered.length} of {totalEntries} entries</p>
          {filtered.length < totalEntries && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setLimit((prev) => prev + 20)}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : "Load more"} <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
