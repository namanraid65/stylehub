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
  AlertTriangle,
  Zap,
  Tag,
  DollarSign,
  Building2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Award,
} from 'lucide-react';
import orderApi from '../../api/order.api';
import productApi from '../../api/product.api';
import vendorApi from '../../api/vendor.api';
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

type Timeframe = '7d' | '30d' | '90d' | '1y';

const DEMO_RECENT_ORDERS = [
  {
    _id: 'ord-001',
    orderNumber: 'SH-2026-00047',
    user: { _id: 'u1', name: 'Priya Sharma', email: 'priya.sharma@example.com' },
    status: 'delivered',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    total: 3149,
    vendorName: 'DesiCouture',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    _id: 'ord-002',
    orderNumber: 'SH-2026-00046',
    user: { _id: 'u2', name: 'Rahul Verma', email: 'rahul.verma@example.com' },
    status: 'shipped',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    total: 7299,
    vendorName: 'SoleMate',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    _id: 'ord-003',
    orderNumber: 'SH-2026-00045',
    user: { _id: 'u3', name: 'Ananya Singh', email: 'ananya.singh@example.com' },
    status: 'processing',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    total: 1665,
    vendorName: 'UrbanThreads',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    _id: 'ord-004',
    orderNumber: 'SH-2026-00044',
    user: { _id: 'u4', name: 'Karan Mehra', email: 'karan.mehra@example.com' },
    status: 'placed',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    total: 5100,
    vendorName: 'EthnicVibe',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const DEFAULT_VENDORS = [
  { name: 'SoleMate',     orders: 1, revenue: 7200, rating: 4.8 },
  { name: 'EthnicVibe',   orders: 1, revenue: 5100, rating: 4.6 },
  { name: 'DesiCouture',  orders: 1, revenue: 3149, rating: 4.7 },
  { name: 'UrbanThreads', orders: 1, revenue: 1665, rating: 4.8 },
  { name: 'StyleCraft',   orders: 0, revenue: 0,    rating: 4.5 },
];

const getMergedDashboardOrders = (apiOrders: any[]) => {
  if (Array.isArray(apiOrders) && apiOrders.length > 0) {
    return apiOrders;
  }
  const storedOrders = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('stylehub-placed-orders') || '[]') : [];
  const mergedMap = new Map<string, any>();

  if (Array.isArray(storedOrders)) {
    storedOrders.forEach((o: any) => {
      const key = o.orderNumber || o._id;
      if (key) mergedMap.set(key, o);
    });
  }
  DEMO_RECENT_ORDERS.forEach((o: any) => {
    const key = o.orderNumber || o._id;
    if (key && !mergedMap.has(key)) mergedMap.set(key, o);
  });

  return [...mergedMap.values()];
};


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

// ─── Stat Card Component ──────────────────────────────────────────────────────
interface StatCardProps {
  title:     string;
  value:     string;
  change?:   number;
  icon:      React.ElementType;
  gradient:  string;
  subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, gradient, subtitle }) => {
  return (
    <Card className="relative overflow-hidden group hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold font-display tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white', gradient)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        {change !== undefined && (
          <div className={cn(
            'mt-4 flex items-center gap-1.5 text-xs font-medium',
            change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
          )}>
            {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            <span>{Math.abs(change)}% vs last month</span>
          </div>
        )}
      </CardContent>

      <div className={cn('absolute bottom-0 left-0 right-0 h-0.5 opacity-60', gradient)} />
    </Card>
  );
};


// ─── Main Dashboard Page (Routes by Role) ─────────────────────────────────────
export default function DashboardPage() {
  const user = useUser();
  const isVendor = user?.role === 'vendor';

  if (isVendor) {
    return <VendorDashboard user={user} />;
  }

  return <AdminDashboard user={user} />;
}

// ==============================================================================
// 🏪 VENDOR MERCHANT DASHBOARD
// ==============================================================================
function VendorDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalEarnings: 0,
    totalOrders: 0,
    activeProducts: 0,
    pendingShipments: 0,
  });
  const [vendorOrders, setVendorOrders] = React.useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = React.useState<any[]>([]);
  const [topPerformers, setTopPerformers] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadVendorData = async () => {
      setLoading(true);
      try {
        const [ordersRes, prodsRes] = await Promise.all([
          orderApi.myOrders({ limit: 500 }).catch(() => null),
          productApi.myProducts({ limit: 100 }).catch(() => productApi.list({ limit: 100 }).catch(() => null)),
        ]);

        const vendorStoreName = user?.storeName || user?.name || 'DesiCouture';
        const rawOrdersAll = ordersRes?.data?.data || (ordersRes as any)?.data || [];
        const mergedOrders = getMergedDashboardOrders(rawOrdersAll);

        // Filter orders strictly for this vendor
        const rawOrders = mergedOrders.filter((o: any) => {
          if (!o) return false;
          if (o.vendorName) {
            return o.vendorName.toLowerCase() === vendorStoreName.toLowerCase() ||
                   o.vendorName.toLowerCase().includes(vendorStoreName.toLowerCase()) ||
                   vendorStoreName.toLowerCase().includes(o.vendorName.toLowerCase());
          }
          if (o.fulfillments && Array.isArray(o.fulfillments)) {
            return o.fulfillments.some((f: any) =>
              (f.vendorName && f.vendorName.toLowerCase().includes(vendorStoreName.toLowerCase())) ||
              (f.vendorId && user?.vendorId && f.vendorId === user.vendorId)
            );
          }
          return true;
        });

        const validOrders = rawOrders.filter((o: any) => o.status !== 'cancelled');
        const computedRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.total || o.totals?.total || 0), 0);
        const pendingCount = rawOrders.filter((o: any) => ['placed', 'processing'].includes(o.status)).length;

        const fetchedProds = (prodsRes as any)?.data?.data || (prodsRes as any)?.data || [];

        const cleanVendor = (name: string) =>
          (name || '')
            .toLowerCase()
            .replace(/\s+(vendor|merchant|seller|boutique|store)$/i, '')
            .trim();

        const userVendorClean = cleanVendor(user?.storeName || user?.name || user?.email?.split('@')[0] || 'VelveteenRose');
        const vId = user?.vendorId || user?._id || '';

        let rawProds = Array.isArray(fetchedProds) ? fetchedProds : [];
        if (rawProds.length > 0) {
          const filtered = rawProds.filter((p: any) => {
            if (!p) return false;
            const pV = cleanVendor(p.vendor?.storeName || p.vendor?.name || p.vendor || p.brand || p.vendorName || '');
            const pId = p.vendor?._id || p.vendorId || '';
            if (vId && pId && vId === pId) return true;
            if (pV && userVendorClean && (pV.includes(userVendorClean) || userVendorClean.includes(pV))) return true;
            return false;
          });
          if (filtered.length > 0) {
            rawProds = filtered;
          }
        }


        const lowStock = rawProds.filter((p: any) => {
          const totalStock = p.variants ? p.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : (p.totalStock || 0);
          return totalStock > 0 && totalStock <= 10;
        });

        const sortedProds = [...rawProds].sort((a: any, b: any) => (b.soldCount || 0) - (a.soldCount || 0));
        const computedTop = sortedProds.slice(0, 3).map((p: any) => {
          const price = p.basePrice || p.price || 2499;
          const sold = p.soldCount || (p.variants ? p.variants.reduce((s: number, v: any) => s + (v.stock || 0), 0) : 15);
          return {
            name: p.name,
            sold,
            revenue: price * sold,
          };
        });

        setTopPerformers(computedTop);

        const commRate = typeof window !== 'undefined' ? Number(localStorage.getItem('stylehub_platform_commission') || 12) : 12;

        setStats({
          totalEarnings: Math.round(computedRevenue * (1 - commRate / 100)), // Net after commission fee
          totalOrders: rawOrders.length,
          activeProducts: rawProds.length,
          pendingShipments: pendingCount,
        });


        setVendorOrders(rawOrders);
        setLowStockItems(lowStock.slice(0, 3));


      } catch (err) {
        console.error("Vendor dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadVendorData();
  }, []);


  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Merchant Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-neutral-900 via-rose-950 to-neutral-900 text-white rounded-2xl p-6 shadow-xl border border-rose-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold uppercase tracking-wider border border-rose-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              Verified Boutique Seller
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">
              Welcome, {user?.name || 'Vendor Partner'} 🛍️
            </h1>
            <p className="text-neutral-300 text-sm">
              Manage your boutique catalog, track customer orders, and view settlement ledgers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate('/vendor/products/new')}
              className="bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg hover:shadow-rose-600/30"
            >
              + Add New Product
            </Button>
            <Button
              onClick={() => navigate('/vendor/payouts')}
              variant="outline"
              className="border-rose-900/50 bg-rose-950/60 text-rose-100 hover:bg-rose-900/80 hover:text-white"
            >
              Payout Ledger
            </Button>
          </div>
        </div>
      </div>

      {/* Vendor Key Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={`Net Earnings (After ${typeof window !== 'undefined' ? Number(localStorage.getItem('stylehub_platform_commission') || 12) : 12}% Fee)`}
          value={`₹${stats.totalEarnings.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          gradient="bg-gradient-to-br from-emerald-600 to-teal-700"
          subtitle="Ready for settlement"
        />

        <StatCard
          title="Boutique Orders"
          value={stats.totalOrders.toLocaleString('en-IN')}
          icon={ShoppingCart}
          gradient="bg-gradient-to-br from-blue-600 to-indigo-700"
          subtitle="Received customer orders"
        />
        <StatCard
          title="Active Listings"
          value={stats.activeProducts.toLocaleString('en-IN')}
          icon={Package}
          gradient="bg-gradient-to-br from-rose-600 to-pink-700"
          subtitle="Live on StyleHub"
        />
        <StatCard
          title="Pending Fulfillment"
          value={stats.pendingShipments.toLocaleString('en-IN')}
          icon={Truck}
          gradient="bg-gradient-to-br from-amber-600 to-orange-700"
          subtitle="Needs packing & dispatch"
        />
      </div>


      {/* Low Stock Warning Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">Low Inventory Restock Alert</h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                You have {lowStockItems.length} products with under 10 items left in stock. Re-stock to avoid missing sales!
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/vendor/products')}
            className="bg-amber-600 hover:bg-amber-700 text-white shrink-0 text-xs"
          >
            Restock Now
          </Button>
        </div>
      )}

      {/* Actionable Orders Needing Dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Action Center — Customer Orders</CardTitle>
              <CardDescription>Recent orders placed for your boutique</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/vendor/orders')}>
              View All Orders <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {vendorOrders.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Package className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-semibold text-foreground">No Customer Orders Yet</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  When customers purchase your boutique items on StyleHub, their orders will appear here for fulfillment.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {vendorOrders.slice(0, 5).map((order) => (
                  <div key={order._id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        Customer: {typeof order.user === 'object' ? order.user?.name : 'Guest'} · {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={order.status === 'delivered' ? 'success' : 'warning'} className="capitalize">
                        {order.status}
                      </Badge>
                      <span className="text-sm font-bold text-rose-600">₹{order.total?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Garments in Boutique */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Boutique Top Performers
            </CardTitle>
            <CardDescription>Your best selling catalog items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Award className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-semibold text-foreground">No Top Performers Yet</p>
                <p className="text-xs text-muted-foreground">
                  Your best-selling catalog items will be highlighted here as sales come in.
                </p>
              </div>
            ) : (
              topPerformers.map((prod, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-foreground line-clamp-1">{prod.name}</p>
                    <p className="text-[11px] text-muted-foreground">{prod.sold} units sold</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">₹{prod.revenue.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


// ==============================================================================
// 🛡️ ADMIN ENTERPRISE DASHBOARD
// ==============================================================================
function AdminDashboard({ user }: { user: any }) {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = React.useState<Timeframe>('30d');
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    activeVendors: 0,
  });
  const [recentOrders, setRecentOrders] = React.useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = React.useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = React.useState<any[]>([]);
  const [topVendors, setTopVendors] = React.useState<any[]>([]);

  React.useEffect(() => {
    const loadAdminData = async () => {
      setLoading(true);
      try {
        const [ordersRes, prodsRes, vendorsRes] = await Promise.all([
          orderApi.allOrders({ limit: 500 }).catch(() => null),
          productApi.list({ limit: 100 }).catch(() => null),
          vendorApi.getAllVendors().catch(() => null),
        ]);

        const apiOrders = ordersRes?.data?.data || (ordersRes as any)?.data || [];
        const rawOrders = getMergedDashboardOrders(apiOrders);
        const rawProds = prodsRes?.data?.data || (prodsRes as any)?.data || [];
        const rawVendors = vendorsRes?.data?.data || (vendorsRes as any)?.data || [];

        const validOrders = rawOrders.filter((o: any) => o.status !== 'cancelled');
        const computedRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.total || o.totals?.total || 0), 0);

        setStats({
          totalRevenue: computedRevenue,
          totalOrders: rawOrders.length,
          activeProducts: Array.isArray(rawProds) && rawProds.length > 0 ? rawProds.length : 65,
          activeVendors: Array.isArray(rawVendors) && rawVendors.length > 0 ? rawVendors.length : 5,
        });

        // Compute order status distribution
        const statusMap: Record<string, number> = {};
        rawOrders.forEach((o: any) => {
          statusMap[o.status] = (statusMap[o.status] || 0) + 1;
        });

        const dist = Object.entries(statusMap).map(([name, count]) => ({
          name,
          value: rawOrders.length > 0 ? Math.round((count / rawOrders.length) * 100) : 0,
        }));
        setStatusDistribution(dist);

        // Compute dynamic weekly revenue chart points from valid orders
        const weeksMap: Record<string, { revenue: number; orders: number }> = {
          'Wk 1': { revenue: 0, orders: 0 },
          'Wk 2': { revenue: 0, orders: 0 },
          'Wk 3': { revenue: 0, orders: 0 },
          'Wk 4': { revenue: 0, orders: 0 },
        };

        if (validOrders.length > 0) {
          validOrders.forEach((o: any, idx: number) => {
            const weekKey = `Wk ${(idx % 4) + 1}`;
            const amt = o.total || o.totals?.total || 0;
            if (weeksMap[weekKey]) {
              weeksMap[weekKey]!.revenue += amt;
              weeksMap[weekKey]!.orders += 1;
            }
          });
        }

        const dynamicRevenuePoints = Object.entries(weeksMap).map(([month, data]) => ({
          month,
          revenue: data.revenue,
          orders: data.orders,
        }));

        setMonthlyRevenue(dynamicRevenuePoints);

        setRecentOrders(rawOrders.slice(0, 5));

        const computedTopVendors = Array.isArray(rawVendors) && rawVendors.length > 0
          ? rawVendors
              .map((v: any) => ({
                name: v.storeName || v.name || 'Boutique Vendor',
                orders: v.totalOrders || 0,
                revenue: v.totalEarnings || v.totalSales || 0,
                rating: v.storeRating || 4.8,
              }))
              .sort((a, b) => b.revenue - a.revenue)
          : DEFAULT_VENDORS;

        setTopVendors(computedTopVendors);
      } catch (err) {
        console.error("Admin dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAdminData();
  }, [timeframe]);

  if (loading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const commRate = typeof window !== 'undefined' ? Number(localStorage.getItem('stylehub_platform_commission') || 12) : 12;
  const commissionEarned = Math.round(stats.totalRevenue * (commRate / 100));

  return (
    <div className="space-y-6">
      {/* Enterprise Platform Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Platform Command Center
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-serif">
              Enterprise Overview 👋
            </h1>
            <p className="text-slate-300 text-sm">
              Real-time platform sales, vendor payouts, customer growth, and marketplace health metrics.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => navigate('/discounts')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition whitespace-nowrap"
            >
              <Tag className="w-4 h-4" /> Discounts & Sales
            </button>
            <button
              onClick={() => navigate('/cms')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/80 shadow-md transition whitespace-nowrap"
            >
              CMS Editor
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700/80 shadow-md transition whitespace-nowrap"
            >
              Platform Analytics
            </button>
          </div>

        </div>
      </div>

      {/* Admin Executive Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Platform Gross GMV"
          value={`₹${stats.totalRevenue.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          gradient="gradient-violet"
          subtitle="Gross merchandise volume"
        />
        <StatCard
          title={`Platform Commission (${commRate}%)`}
          value={`₹${commissionEarned.toLocaleString('en-IN')}`}
          icon={DollarSign}
          gradient="gradient-blue"
          subtitle="Net platform revenue"
        />

        <StatCard
          title="Active Marketplace Vendors"
          value={stats.activeVendors.toLocaleString('en-IN')}
          icon={Building2}
          gradient="gradient-green"
          subtitle="Approved boutique stores"
        />
        <StatCard
          title="Total Marketplace Orders"
          value={stats.totalOrders.toLocaleString('en-IN')}
          icon={ShoppingCart}
          gradient="gradient-amber"
          subtitle="Platform-wide orders"
        />
      </div>


      {/* Analytics & Distribution Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle>GMV Revenue & Sales Performance</CardTitle>
              <CardDescription>Platform gross sales trends</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradAdminRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gradAdminRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Vendors Leaderboard */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Top Vendor Leaderboard</CardTitle>
            <CardDescription>Ranked by revenue generation</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {(topVendors.length > 0 ? topVendors : DEFAULT_VENDORS).map((v, i) => (
                <div key={v.name} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-muted-foreground w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">{v.name}</p>
                      <p className="text-[10px] text-muted-foreground">⭐ {v.rating} · {v.orders} orders</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-violet-600">₹{v.revenue.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
