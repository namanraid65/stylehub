import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import {
  IndianRupee, ShoppingCart, Users, Store, TrendingUp,
  Download, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight,
  MessageSquare, Star, Package, Loader2,
} from 'lucide-react';
import orderApi from '../../api/order.api';
import { cn } from '../../lib/utils';


// ─── Mock data ────────────────────────────────────────────────────────────────
const REVENUE_7D = [
  { label: 'Mon', revenue: 12400, orders: 34 },
  { label: 'Tue', revenue: 18700, orders: 52 },
  { label: 'Wed', revenue: 14200, orders: 39 },
  { label: 'Thu', revenue: 22100, orders: 61 },
  { label: 'Fri', revenue: 28900, orders: 79 },
  { label: 'Sat', revenue: 35600, orders: 98 },
  { label: 'Sun', revenue: 31200, orders: 85 },
];

const REVENUE_30D = Array.from({ length: 30 }, (_, i) => ({
  label: `${i + 1}`,
  revenue: Math.round(8000 + Math.random() * 30000),
  orders:  Math.round(20  + Math.random() * 100),
}));

const REVENUE_90D = Array.from({ length: 13 }, (_, i) => ({
  label: `Wk${i + 1}`,
  revenue: Math.round(50000 + Math.random() * 150000),
  orders:  Math.round(100  + Math.random() * 400),
}));

const CATEGORY_DATA = [
  { name: 'Ethnic Wear',  revenue: 284000, pct: 32, color: '#C084FC' },
  { name: 'Dresses',      revenue: 198000, pct: 22, color: '#F472B6' },
  { name: 'Tops',         revenue: 142000, pct: 16, color: '#FB7185' },
  { name: 'Footwear',     revenue: 124000, pct: 14, color: '#FBB035' },
  { name: 'Accessories',  revenue: 98000,  pct: 11, color: '#34D399' },
  { name: 'Denim',        revenue: 44000,  pct:  5, color: '#60A5FA' },
];

const TOP_PRODUCTS = [
  { name: 'Ivory Anarkali Kurta',     sales: 482, revenue: 168718 },
  { name: 'Midnight Floral Maxi',     sales: 234, revenue:  67854 },
  { name: 'Camel Ribbed Co-ord Set',  sales: 189, revenue:  35891 },
  { name: 'Block Print Kaftan',       sales: 167, revenue:  41583 },
  { name: 'Gold Filigree Earrings',   sales: 312, revenue:  62088 },
];

const VENDOR_PERF = [
  { name: 'DesiCouture',  orders: 312, revenue: 184000, rating: 4.8 },
  { name: 'UrbanThreads', orders: 287, revenue: 162000, rating: 4.7 },
  { name: 'SoleMate',     orders: 198, revenue:  98000, rating: 4.6 },
  { name: 'GlimmerCo',   orders: 156, revenue:  78000, rating: 4.5 },
];

const ENQUIRY_DATA = [
  { name: 'Open',        value: 24, color: '#F472B6' },
  { name: 'In Progress', value: 18, color: '#A855F7' },
  { name: 'Resolved',    value: 87, color: '#34D399' },
  { name: 'Closed',      value: 41, color: '#94A3B8' },
];

const REVIEW_DIST = [
  { label: '5★', count: 312 },
  { label: '4★', count: 198 },
  { label: '3★', count:  64 },
  { label: '2★', count:  28 },
  { label: '1★', count:  14 },
];

const fmt = (n: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(n);

type Period = '7d' | '30d' | '90d';

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({
  title, value, delta, icon: Icon, color, prefix = '',
}: {
  title: string; value: string | number; delta: number;
  icon: LucideIcon; color: string; prefix?: string;
}) {
  const positive = delta >= 0;
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold mt-1">{prefix}{value}</p>
            <div className={cn('flex items-center gap-1 text-xs mt-2', positive ? 'text-emerald-600' : 'text-red-500')}>
              {positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              <span>{Math.abs(delta)}% vs last month</span>
            </div>
          </div>
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main AnalyticsPage ───────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await orderApi.analytics();
      setData(res.data?.data || res.data || {});
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Live data with mock fallbacks
  const isDemo = !data || (data.totalOrders === 0 && data.activeVendors === 0 && data.activeProducts === 0);

  const liveRevenueTrend = data?.dailyTrend || [];
  const liveCategories = data?.categoryDistribution || [];
  const liveProducts = data?.topProducts || [];
  const liveVendors = data?.vendorPerformance || [];
  const liveEnquiries = data?.enquiryDistribution || [];
  const liveReviews = data?.reviewDistribution || [];

  const revenueData = !isDemo ? liveRevenueTrend : (period === '7d' ? REVENUE_7D : period === '90d' ? REVENUE_90D : REVENUE_30D);
  const totalRevenue = !isDemo ? (data?.totalRevenue ?? 0) : revenueData.reduce((s: number, d: any) => s + d.revenue, 0);
  const totalOrders  = !isDemo ? (data?.totalOrders ?? 0) : revenueData.reduce((s: number, d: any) => s + d.orders,  0);
  const activeVendors = !isDemo ? (data?.activeVendors ?? 0) : 5;
  const newCustomers = !isDemo ? (data?.newCustomers ?? 0) : 142;

  const categoryData = !isDemo ? liveCategories : CATEGORY_DATA;
  const topProducts = !isDemo ? liveProducts : TOP_PRODUCTS;
  const vendorPerformance = !isDemo ? liveVendors : VENDOR_PERF;
  const enquiryData = !isDemo ? liveEnquiries : ENQUIRY_DATA;
  const reviewDistribution = !isDemo ? liveReviews : REVIEW_DIST;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Deep-dive into your marketplace performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Custom Range
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Revenue"    value={fmt(totalRevenue).replace('₹','')} prefix="₹" delta={18}  icon={IndianRupee} color="bg-violet-100 text-violet-600" />
        <KPICard title="Total Orders"     value={totalOrders}  delta={12}  icon={ShoppingCart} color="bg-blue-100 text-blue-600" />
        <KPICard title="New Customers"    value={newCustomers} delta={-5}  icon={Users}        color="bg-emerald-100 text-emerald-600" />
        <KPICard title="Active Vendors"   value={activeVendors} delta={8}   icon={Store}        color="bg-amber-100 text-amber-600" />
      </div>

      {/* Revenue chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-base">Revenue Trend</CardTitle>
            <CardDescription>{period === '7d' ? 'Daily' : period === '30d' ? 'Daily (30d)' : 'Weekly (13wk)'} revenue and order volume</CardDescription>
          </div>
          <div className="flex rounded-lg border overflow-hidden">
            {(['7d','30d','90d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  period === p ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#F472B6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left"  tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(v: number, name: string) => [
                  name === 'revenue' ? fmt(v) : v,
                  name === 'revenue' ? 'Revenue' : 'Orders',
                ]}
              />
              <Area yAxisId="left"  type="monotone" dataKey="revenue" stroke="#A855F7" strokeWidth={2} fill="url(#gradRevenue)" />
              <Area yAxisId="right" type="monotone" dataKey="orders"  stroke="#F472B6" strokeWidth={2} fill="url(#gradOrders)" strokeDasharray="4 2" />
              <Legend iconType="circle" iconSize={8} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category breakdown + Enquiry funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category donut */}
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Category</CardTitle>
            <CardDescription>Distribution across product categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6 items-center">
              <ResponsiveContainer width={180} height={180}>
                <PieChart>
                  <Pie data={categoryData} dataKey="revenue" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {categoryData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {(() => {
                  const categoryTotal = categoryData.reduce((s: number, c: any) => s + c.revenue, 0);
                  return categoryData.map((c: any) => {
                    const pct = categoryTotal > 0 ? Math.round((c.revenue / categoryTotal) * 100) : 0;
                    return (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                        <p className="text-xs text-muted-foreground flex-1">{c.name}</p>
                        <p className="text-xs font-semibold">{pct}%</p>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enquiry funnel */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enquiry Funnel</CardTitle>
            <CardDescription>Status distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const enquiryTotal = enquiryData.reduce((s: number, e: any) => s + e.value, 0);
              return enquiryData.map((e: any) => {
                const widthPct = enquiryTotal > 0 ? (e.value / enquiryTotal) * 100 : 0;
                return (
                  <div key={e.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground capitalize">{e.name}</span>
                      <span className="font-semibold">{e.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${widthPct}%`, background: e.color || '#A855F7' }}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Top products + Review distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products bar chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Products by Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 0, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [fmt(v), 'Revenue']} />
                <Bar dataKey="revenue" radius={[0,4,4,0]} fill="#A855F7" maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Review distribution */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Review Distribution</CardTitle>
            <CardDescription>Star ratings across all products</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={reviewDistribution} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#FBB035" radius={[4,4,0,0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Vendor leaderboard */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vendor Performance</CardTitle>
          <CardDescription>Top vendors by fulfilment revenue this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Vendor</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Orders</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">Share</th>
                </tr>
              </thead>
              <tbody>
                {vendorPerformance.map((v: any, i: number) => (
                  <tr key={v.name} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="h-6 w-6 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-white text-xs flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="font-medium">{v.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right">{v.orders}</td>
                    <td className="py-3 px-2 text-right font-semibold">{fmt(v.revenue)}</td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {v.rating}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-violet-500"
                            style={{ width: `${(v.revenue / (vendorPerformance[0]?.revenue || 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-8 text-right">
                          {Math.round((v.revenue / (vendorPerformance.reduce((s: number, vv: any) => s + vv.revenue, 0) || 1)) * 100)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
