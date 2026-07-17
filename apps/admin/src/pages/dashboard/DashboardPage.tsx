import React from 'react';
import {
  ShoppingCart,
  Package,
  Store,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Loader2,
} from 'lucide-react';
import orderApi from '../../api/order.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../stores/auth.store';
import { cn } from '../../lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ─── Mock data (replace with real API calls via TanStack Query) ───────────────
const REVENUE_DATA = [
  { month: 'Jan', revenue: 42000, orders: 120 },
  { month: 'Feb', revenue: 58000, orders: 165 },
  { month: 'Mar', revenue: 51000, orders: 142 },
  { month: 'Apr', revenue: 74000, orders: 210 },
  { month: 'May', revenue: 68000, orders: 190 },
  { month: 'Jun', revenue: 91000, orders: 260 },
  { month: 'Jul', revenue: 84000, orders: 235 },
];

const ORDER_STATUS_DATA = [
  { name: 'Delivered', value: 58, color: '#22c55e' },
  { name: 'Processing', value: 22, color: '#a855f7' },
  { name: 'Shipped',    value: 14, color: '#3b82f6' },
  { name: 'Cancelled',  value: 6,  color: '#ef4444' },
];

const RECENT_ORDERS = [
  { id: 'SH-2026-00047', customer: 'Priya Sharma',   amount: 3499, status: 'delivered',  date: '15 Jul' },
  { id: 'SH-2026-00046', customer: 'Rahul Verma',    amount: 7200, status: 'shipped',    date: '15 Jul' },
  { id: 'SH-2026-00045', customer: 'Ananya Singh',   amount: 1850, status: 'processing', date: '14 Jul' },
  { id: 'SH-2026-00044', customer: 'Karan Mehra',    amount: 5600, status: 'placed',     date: '14 Jul' },
  { id: 'SH-2026-00043', customer: 'Neha Agarwal',   amount: 990,  status: 'cancelled',  date: '13 Jul' },
];

const TOP_VENDORS = [
  { name: 'UrbanThreads', orders: 312, revenue: 184000, rating: 4.8 },
  { name: 'DesiCouture',  orders: 278, revenue: 156000, rating: 4.7 },
  { name: 'SoleMate',     orders: 201, revenue: 98000,  rating: 4.6 },
  { name: 'EthnicVibe',   orders: 189, revenue: 91000,  rating: 4.5 },
];

// ─── Stat card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  title:     string;
  value:     string;
  change:    number;
  icon:      React.ElementType;
  gradient:  string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, gradient, subtitle }) => {
  const isPositive = change >= 0;

  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          {/* Icon badge */}
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white', gradient)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {/* Change badge */}
        <div className={cn(
          'mt-4 flex items-center gap-1.5 text-xs font-medium',
          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
        )}>
          {isPositive
            ? <TrendingUp className="h-3.5 w-3.5" />
            : <TrendingDown className="h-3.5 w-3.5" />}
          <span>{Math.abs(change)}% vs last month</span>
        </div>
      </CardContent>

      {/* Decorative gradient strip at bottom */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-60', gradient)} />
    </Card>
  );
};

// ─── Order status icon ────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary'; icon: React.ElementType }> = {
  delivered:  { label: 'Delivered',  variant: 'success',     icon: CheckCircle2 },
  shipped:    { label: 'Shipped',    variant: 'info',        icon: Truck },
  processing: { label: 'Processing', variant: 'warning',     icon: Clock },
  placed:     { label: 'Placed',     variant: 'secondary',   icon: ShoppingCart },
  cancelled:  { label: 'Cancelled',  variant: 'destructive', icon: XCircle },
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────
const DashboardPage: React.FC = () => {
  const user = useUser();
  const navigate = useNavigate();

  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    secondaryMetric: 0,
  });
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = React.useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = React.useState<any[]>([]);
  const [topVendors, setTopVendors] = React.useState<any[]>([]);
  const [topProducts, setTopProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'vendor') {
          const [statsRes, ordersRes] = await Promise.all([
            orderApi.vendorStats(),
            orderApi.myOrders({ limit: 5 }),
          ]);
          const d = statsRes.data?.data || (statsRes as any).data || {};
          setStats({
            totalRevenue: d.totalRevenue || 0,
            totalOrders: d.totalOrders || 0,
            activeProducts: d.productCount || 0,
            secondaryMetric: d.pendingFulfillments || 0,
          });
          setStatusDistribution(d.statusDistribution || []);
          setMonthlyRevenue(d.monthlyRevenue || []);
          setTopProducts(d.topProducts || []);
          const o = ordersRes.data?.data || (ordersRes as any).data || [];
          setRecentOrders(o.slice(0, 5));
        } else {
          const [statsRes, ordersRes] = await Promise.all([
            orderApi.stats(),
            orderApi.allOrders({ limit: 5 }),
          ]);
          const d = statsRes.data?.data || (statsRes as any).data || {};
          setStats({
            totalRevenue: d.totalRevenue || 0,
            totalOrders: d.totalOrders || 0,
            activeProducts: d.activeProducts || 0,
            secondaryMetric: d.activeVendors || 0,
          });
          setStatusDistribution(d.statusDistribution || []);
          setMonthlyRevenue(d.monthlyRevenue || []);
          setTopVendors(d.topVendors || []);
          const o = ordersRes.data?.data || (ordersRes as any).data || [];
          setRecentOrders(o.slice(0, 5));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [user]);

  const getUserName = (o: any) => {
    if (o.guestInfo?.name) return o.guestInfo.name;
    if (!o.user) return 'Guest Customer';
    return typeof o.user === 'string' ? o.user : (o.user.name || 'Customer');
  };

  const isVendor = user?.role === 'vendor';

  const ORDER_STATUS_COLORS: Record<string, string> = {
    delivered: '#22c55e',
    shipped: '#3b82f6',
    processing: '#a855f7',
    placed: '#f59e0b',
    cancelled: '#ef4444',
  };

  const ORDER_STATUS_LABELS: Record<string, string> = {
    delivered: 'Delivered',
    shipped: 'Shipped',
    processing: 'Processing',
    placed: 'Placed',
    cancelled: 'Cancelled',
  };

  const totalDistributionSum = statusDistribution.reduce((acc, curr) => acc + curr.value, 0);
  
  const statusChartData = statusDistribution.length > 0 
    ? statusDistribution.map((item) => {
        const percentage = totalDistributionSum > 0 ? Math.round((item.value / totalDistributionSum) * 100) : 0;
        return {
          name: ORDER_STATUS_LABELS[item.name] || item.name.charAt(0).toUpperCase() + item.name.slice(1),
          value: percentage || item.value,
          color: ORDER_STATUS_COLORS[item.name] || '#9ca3af',
        };
      })
    : ORDER_STATUS_DATA;

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">
            Good evening, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isVendor ? "Here's what's happening with your store today." : "Here's what's happening with StyleHub today."}
          </p>
        </div>
        <div className="flex gap-2">
          {isVendor ? (
            <Button size="sm" onClick={() => navigate('/vendor/products/new')}>+ Add Product</Button>
          ) : (
            <>
              <Button variant="outline" size="sm">Export Report</Button>
              <Button size="sm" onClick={() => navigate('/products')}>Manage Products</Button>
            </>
          )}
        </div>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={isVendor ? "Store Revenue" : "Total Revenue"}
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          change={12.5}
          icon={IndianRupee}
          gradient="gradient-violet"
          subtitle={isVendor ? "Your store sales" : "Jul 2026"}
        />
        <StatCard
          title={isVendor ? "Store Orders" : "Total Orders"}
          value={stats.totalOrders.toLocaleString('en-IN')}
          change={8.2}
          icon={ShoppingCart}
          gradient="gradient-blue"
          subtitle="This month"
        />
        <StatCard
          title="Active Products"
          value={stats.activeProducts.toLocaleString('en-IN')}
          change={-2.4}
          icon={Package}
          gradient="gradient-green"
          subtitle={isVendor ? "In your shop catalog" : "Across all vendors"}
        />
        <StatCard
          title={isVendor ? "Pending Shipments" : "Active Vendors"}
          value={stats.secondaryMetric.toLocaleString('en-IN')}
          change={4.1}
          icon={isVendor ? Truck : Store}
          gradient="gradient-amber"
          subtitle={isVendor ? "Orders to pack & ship" : "3 pending approval"}
        />
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Revenue area chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue & orders for 2026</CardDescription>
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                  Orders
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyRevenue.length > 0 ? monthlyRevenue : REVENUE_DATA} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="hsl(262 83% 58%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(262 83% 58%)"
                  strokeWidth={2}
                  fill="url(#gradRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order status donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Distribution this month</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(v: number) => [`${v}%`]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="w-full space-y-2 mt-2">
              {statusChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-semibold">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────────── */}
      <div className={cn("grid gap-4", isVendor ? "grid-cols-1" : "lg:grid-cols-2")}>

        {/* Recent orders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary gap-1 h-7 px-2"
                onClick={() => navigate(isVendor ? '/vendor/orders' : '/orders')}
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentOrders.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No recent orders.
                </div>
              ) : (
                recentOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, variant: 'secondary', icon: ShoppingCart };
                  const amount = isVendor
                    ? (order.fulfillments?.find((f: any) => f.vendorName?.toLowerCase().includes('desi') || f.vendorName?.toLowerCase() === user?.name?.toLowerCase())?.subtotal || order.total)
                    : order.total;
                  return (
                    <div key={order._id} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                        <cfg.icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{getUserName(order)}</p>
                        <p className="text-xs text-muted-foreground">{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">₹{amount.toLocaleString('en-IN')}</p>
                        <Badge variant={cfg.variant} className="mt-0.5 text-[10px] px-1.5 py-0">
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top vendors — Admin only */}
        {!isVendor && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Top Vendors</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary gap-1 h-7 px-2"
                  onClick={() => navigate('/vendors')}
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(topVendors.length > 0 ? topVendors : TOP_VENDORS).map((vendor, i) => (
                  <div key={vendor.name} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors">
                    <span className="text-muted-foreground font-bold text-sm w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="h-8 w-8 rounded-lg gradient-violet flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {vendor.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.orders} orders · ⭐ {vendor.rating}</p>
                    </div>
                    <p className="text-sm font-semibold text-right shrink-0">
                      ₹{(vendor.revenue / 1000).toFixed(0)}k
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isVendor && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Top Selling Products</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary gap-1 h-7 px-2"
                  onClick={() => navigate('/vendor/products')}
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {(topProducts.length > 0 ? topProducts : [
                  { name: 'Ivory Floral Anarkali Set', orders: 48, revenue: 167952, rating: 4.8 },
                  { name: 'Camel Ribbed Co-ord Set', orders: 35, revenue: 97965, rating: 4.7 },
                  { name: 'Peach Georgette Sharara', orders: 22, revenue: 61578, rating: 4.5 }
                ]).map((product, i) => (
                  <div key={product.name} className="flex items-center gap-3 px-6 py-3 hover:bg-muted/40 transition-colors">
                    <span className="text-muted-foreground font-bold text-sm w-5 text-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="h-8 w-8 rounded-lg gradient-indigo flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {product.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.orders} units sold · ⭐ {product.rating}</p>
                    </div>
                    <p className="text-sm font-semibold text-right shrink-0">
                      ₹{(product.revenue / 1000).toFixed(0)}k
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
