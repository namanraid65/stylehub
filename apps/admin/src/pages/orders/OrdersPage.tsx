import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, Filter, Truck, CheckCircle2,
  Clock, XCircle, Package, ChevronRight, X, Loader2, RefreshCw,
  Printer, Ban, Calendar, User, Mail, MapPin, DollarSign,
  Download, CheckSquare, Square, IndianRupee, ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogBody } from '../../components/ui/dialog';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import orderApi, { Order, OrderStatus } from '../../api/order.api';
import { cn } from '../../lib/utils';

interface StatusConfigItem {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary';
  icon: React.ElementType;
  nextStatus?: OrderStatus;
  nextLabel?: string;
}

const STATUS_CONFIG: Record<string, StatusConfigItem> = {
  placed:     { label: 'Placed',      variant: 'secondary',   icon: ShoppingCart, nextStatus: 'confirmed',  nextLabel: 'Confirm Order' },
  confirmed:  { label: 'Confirmed',   variant: 'info',        icon: CheckCircle2, nextStatus: 'processing', nextLabel: 'Mark Processing' },
  processing: { label: 'Processing',  variant: 'warning',     icon: Clock,        nextStatus: 'shipped',    nextLabel: 'Mark Shipped' },
  shipped:    { label: 'Shipped',     variant: 'info',        icon: Truck,        nextStatus: 'delivered',  nextLabel: 'Mark Delivered' },
  delivered:  { label: 'Delivered',   variant: 'success',     icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',   variant: 'destructive', icon: XCircle },
  returned:   { label: 'Returned',    variant: 'destructive', icon: Package },
};

const getStatusConfig = (status: string): StatusConfigItem => {
  return STATUS_CONFIG[status] || {
    label: status,
    variant: 'secondary',
    icon: ShoppingCart,
  };
};

// Demo fallback orders when local database has 0 orders
const DEMO_ORDERS: Order[] = [
  {
    _id: 'ord-001',
    orderNumber: 'SH-2026-00047',
    user: { _id: 'u1', name: 'Priya Sharma', email: 'priya.sharma@example.com' },
    status: 'delivered',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    address: {
      fullName: 'Priya Sharma',
      phone: '9876543210',
      line1: 'Flat 402, Sunshine Apartments, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
    },
    subtotal: 3499,
    discount: 350,
    shippingFee: 0,
    total: 3149,
    trackingNumber: 'DTDC987654321',
    statusHistory: [
      { status: 'placed', updatedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
      { status: 'confirmed', updatedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
      { status: 'processing', updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { status: 'shipped', note: 'Shipped via DTDC', updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'delivered', note: 'Handed to customer', updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    items: [
      {
        product: { _id: 'p1', name: 'Ivory Embroidered Anarkali Kurta', images: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600'], slug: 'ivory-anarkali' },
        variant: { size: 'M', color: 'Ivory White', colorHex: '#FDFBF7', sku: 'DESI-ANK-M' },
        quantity: 1,
        price: 3499,
      },
    ],
  },
  {
    _id: 'ord-002',
    orderNumber: 'SH-2026-00046',
    user: { _id: 'u2', name: 'Rahul Verma', email: 'rahul.verma@example.com' },
    status: 'shipped',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    address: {
      fullName: 'Rahul Verma',
      phone: '9812345678',
      line1: 'B-12, Green Park Extension',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110016',
    },
    subtotal: 7200,
    discount: 0,
    shippingFee: 99,
    total: 7299,
    trackingNumber: 'BLUEDART456789',
    statusHistory: [
      { status: 'placed', updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { status: 'confirmed', updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'processing', updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
      { status: 'shipped', note: 'Shipped via BlueDart', updatedAt: new Date(Date.now() - 4 * 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    items: [
      {
        product: { _id: 'p2', name: 'Handcrafted Leather Juttis', images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600'], slug: 'leather-juttis' },
        variant: { size: '42', color: 'Tan Brown', colorHex: '#8B4513', sku: 'SOLE-JUT-42' },
        quantity: 2,
        price: 3600,
      },
    ],
  },
  {
    _id: 'ord-003',
    orderNumber: 'SH-2026-00045',
    user: { _id: 'u3', name: 'Ananya Singh', email: 'ananya.singh@example.com' },
    status: 'processing',
    paymentMethod: 'card',
    paymentStatus: 'paid',
    address: {
      fullName: 'Ananya Singh',
      phone: '9988776655',
      line1: '78-A, Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411001',
    },
    subtotal: 1850,
    discount: 185,
    shippingFee: 0,
    total: 1665,
    statusHistory: [
      { status: 'placed', updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'confirmed', updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
      { status: 'processing', updatedAt: new Date(Date.now() - 6 * 3600000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    items: [
      {
        product: { _id: 'p3', name: 'Midnight Floral Maxi Dress', images: ['https://images.unsplash.com/photo-1479064555552-3ef4979f8908?w=600'], slug: 'floral-maxi' },
        variant: { size: 'S', color: 'Midnight Navy', colorHex: '#1E293B', sku: 'URB-MAX-S' },
        quantity: 1,
        price: 1850,
      },
    ],
  },
  {
    _id: 'ord-004',
    orderNumber: 'SH-2026-00044',
    user: { _id: 'u4', name: 'Karan Mehra', email: 'karan.mehra@example.com' },
    status: 'placed',
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    address: {
      fullName: 'Karan Mehra',
      phone: '9898989898',
      line1: 'C-404, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560038',
    },
    subtotal: 5600,
    discount: 500,
    shippingFee: 0,
    total: 5100,
    statusHistory: [
      { status: 'placed', updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    items: [
      {
        product: { _id: 'p4', name: 'Silk Blend Bandhgala Jacket', images: ['https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600'], slug: 'bandhgala-jacket' },
        variant: { size: 'L', color: 'Royal Black', colorHex: '#000000', sku: 'ETH-JKT-L' },
        quantity: 1,
        price: 5600,
      },
    ],
  },
  {
    _id: 'ord-005',
    orderNumber: 'SH-2026-00043',
    user: { _id: 'u5', name: 'Neha Agarwal', email: 'neha.agarwal@example.com' },
    status: 'cancelled',
    paymentMethod: 'card',
    paymentStatus: 'refunded',
    address: {
      fullName: 'Neha Agarwal',
      phone: '9777766655',
      line1: '12, Salt Lake Sector 5',
      city: 'Kolkata',
      state: 'West Bengal',
      pincode: '700091',
    },
    subtotal: 990,
    discount: 0,
    shippingFee: 99,
    total: 1089,
    statusHistory: [
      { status: 'placed', updatedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
      { status: 'cancelled', note: 'Cancelled by customer', updatedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    items: [
      {
        product: { _id: 'p5', name: 'Gold Filigree Drop Earrings', images: ['https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600'], slug: 'gold-earrings' },
        variant: { size: 'Free Size', color: 'Antique Gold', colorHex: '#D4AF37', sku: 'GLM-EAR-01' },
        quantity: 1,
        price: 990,
      },
    ],
  },
];

const normalizeItems = (order: Order) => {
  if (order.items && order.items.length > 0) {
    return order.items.map((item: any) => ({
      product: item.product,
      name: typeof item.product === 'object' ? item.product.name : item.name || 'Product',
      sku: item.variant?.sku || item.sku || 'SKU',
      price: item.price || 0,
      quantity: item.quantity || 1,
      variant: {
        size: item.variant?.size || 'N/A',
        color: item.variant?.color || 'N/A',
        colorHex: item.variant?.colorHex || '#9ca3af',
        sku: item.variant?.sku || 'SKU',
      },
    }));
  }

  return (((order as any).fulfillments || []) as any[]).flatMap((f: any) =>
    ((f.items || []) as any[]).map((item: any) => ({
      product: item.productId || item.product,
      name: item.name || 'Product',
      sku: item.sku || 'SKU',
      price: item.price || 0,
      quantity: item.quantity || 1,
      variant: {
        size: item.size || 'N/A',
        color: item.color || 'N/A',
        colorHex: item.colorHex || '#9ca3af',
        sku: item.sku || 'SKU',
      },
    }))
  );
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchUpdating, setBatchUpdating] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.allOrders();
      const fetched = res.data?.data || (res as any).data || [];
      if (fetched.length > 0) {
        setOrders(fetched);
      } else {
        setOrders(DEMO_ORDERS);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders(DEMO_ORDERS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (order: Order, newStatus: OrderStatus) => {
    setUpdating(true);
    try {
      await orderApi.updateStatus(order._id, newStatus, trackingNo || undefined, statusNote || undefined);
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Failed to update order status:', err);
      // Fallback local update for demo orders
      setOrders((prev) =>
        prev.map((o) => {
          if (o._id !== order._id) return o;
          const updated: Order = { ...o, status: newStatus };
          const finalTrk = trackingNo || o.trackingNumber;
          if (finalTrk) updated.trackingNumber = finalTrk;
          return updated;
        })
      );
      setSelectedOrder(null);
    } finally {
      setUpdating(false);
      setTrackingNo('');
      setStatusNote('');
    }
  };

  const handleCancelOrder = async (order: Order) => {
    setUpdating(true);
    try {
      await orderApi.cancelOrder(order._id, cancelReason || 'Cancelled by admin');
      await fetchOrders();
      setSelectedOrder(null);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      setOrders((prev) =>
        prev.map((o) => (o._id === order._id ? { ...o, status: 'cancelled' } : o))
      );
      setSelectedOrder(null);
      setShowCancelDialog(false);
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      const res = await orderApi.updatePaymentStatus(orderId, status);
      await fetchOrders();
      if (res.data && res.data.data) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, paymentStatus: status } : o))
      );
      if (selectedOrder?._id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: status } : null));
      }
    }
  };

  const getUserName = (o: Order) => {
    if ((o as any).guestInfo?.name) return (o as any).guestInfo.name;
    if (!o.user) return 'Guest Customer';
    return typeof o.user === 'string' ? o.user : (o.user.name || 'Customer');
  };

  const getUserEmail = (o: Order) => {
    if ((o as any).guestInfo?.email) return (o as any).guestInfo.email;
    if (!o.user || typeof o.user === 'string') return '';
    return o.user.email;
  };

  // Date filtering helper
  const filterByDate = (orderDateStr: string) => {
    if (dateFilter === 'all') return true;
    const orderDate = new Date(orderDateStr).getTime();
    const now = Date.now();
    if (dateFilter === 'today') {
      const todayStart = new Date().setHours(0, 0, 0, 0);
      return orderDate >= todayStart;
    }
    if (dateFilter === '7d') {
      return now - orderDate <= 7 * 24 * 3600 * 1000;
    }
    if (dateFilter === '30d') {
      return now - orderDate <= 30 * 24 * 3600 * 1000;
    }
    return true;
  };

  const filtered = orders.filter((o) => {
    const userName = getUserName(o).toLowerCase();
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      userName.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;
    const matchDate = filterByDate(o.createdAt);
    return matchSearch && matchStatus && matchPayment && matchDate;
  });

  // Bulk Selection Handlers
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((o) => o._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Status Update
  const handleBatchStatusUpdate = async (newStatus: OrderStatus) => {
    if (selectedIds.length === 0 || batchUpdating) return;
    setBatchUpdating(true);
    try {
      await Promise.all(selectedIds.map((id) => orderApi.updateStatus(id, newStatus)));
      await fetchOrders();
      setSelectedIds([]);
    } catch (err) {
      console.error('Failed batch update:', err);
      setOrders((prev) =>
        prev.map((o) => (selectedIds.includes(o._id) ? { ...o, status: newStatus } : o))
      );
      setSelectedIds([]);
    } finally {
      setBatchUpdating(false);
    }
  };

  // CSV Export Helper
  const exportToCSV = (targetOrders: Order[] = filtered) => {
    const headers = [
      'Order Number', 'Date', 'Customer Name', 'Customer Email',
      'Status', 'Payment Method', 'Payment Status', 'Total Items',
      'Subtotal', 'Discount', 'Shipping', 'Grand Total'
    ];

    const rows = targetOrders.map((o) => {
      const items = normalizeItems(o);
      const totalQty = items.reduce((s, i) => s + i.quantity, 0);
      return [
        `"${o.orderNumber}"`,
        `"${new Date(o.createdAt).toLocaleDateString('en-IN')}"`,
        `"${getUserName(o).replace(/"/g, '""')}"`,
        `"${getUserEmail(o)}"`,
        `"${o.status}"`,
        `"${o.paymentMethod}"`,
        `"${o.paymentStatus}"`,
        totalQty,
        o.subtotal,
        o.discount,
        o.shippingFee,
        o.total,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Orders_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary KPIs
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.total : sum), 0);
  const pendingCount = orders.filter((o) => ['placed', 'confirmed', 'processing'].includes(o.status)).length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Browse and manage customer orders across all marketplace stores</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered)} className="gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading} className="gap-2">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
          </Button>
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Revenue</p>
              <h3 className="text-2xl font-bold font-display mt-1">₹{totalRevenue.toLocaleString('en-IN')}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-600">
              <IndianRupee className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Orders</p>
              <h3 className="text-2xl font-bold font-display mt-1">{orders.length}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Fulfillments</p>
              <h3 className="text-2xl font-bold font-display mt-1">{pendingCount}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Completed Deliveries</p>
              <h3 className="text-2xl font-bold font-display mt-1">{deliveredCount}</h3>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Status chips & filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {['all', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => {
                const count = s === 'all' ? orders.length : orders.filter((o) => o.status === s).length;
                const cfg = s !== 'all' ? STATUS_CONFIG[s] : null;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                      statusFilter === s
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-border hover:border-primary/50 text-muted-foreground'
                    )}
                  >
                    {s === 'all' ? `All (${count})` : `${cfg?.label} (${count})`}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <div className="relative flex-1 sm:w-56">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ID or name…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-2 bg-background font-medium focus:outline-none"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-2 bg-background font-medium focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="7d">Past 7 Days</option>
                <option value="30d">Past 30 Days</option>
              </select>
            </div>
          </div>

          {/* Bulk Selection Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-violet-600 text-white rounded-xl flex items-center justify-between shadow-lg transition-all animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <span>{selectedIds.length} orders selected</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBatchStatusUpdate('confirmed')}
                  disabled={batchUpdating}
                  className="h-8 text-xs font-semibold"
                >
                  {batchUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Mark Confirmed'}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBatchStatusUpdate('processing')}
                  disabled={batchUpdating}
                  className="h-8 text-xs font-semibold"
                >
                  {batchUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Mark Processing'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => exportToCSV(orders.filter((o) => selectedIds.includes(o._id)))}
                  className="h-8 text-xs bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Export Selected CSV
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selectedIds.length === filtered.length}
                      onChange={toggleSelectAll}
                      className="rounded border-muted-foreground cursor-pointer"
                    />
                  </TableHead>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      No matching orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const cfg = getStatusConfig(order.status);
                    const StatusIcon = cfg.icon;
                    const isSelected = selectedIds.includes(order._id);

                    return (
                      <TableRow key={order._id} className={cn('hover:bg-muted/40 transition-colors', isSelected && 'bg-violet-50/50 dark:bg-violet-950/20')}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectOne(order._id)}
                            className="rounded border-muted-foreground cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-primary">{order.orderNumber}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{getUserName(order)}</p>
                          <p className="text-[11px] text-muted-foreground">{getUserEmail(order)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {normalizeItems(order).map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                <span
                                  className="h-2 w-2 rounded-full shrink-0"
                                  style={{ background: item.variant.colorHex }}
                                />
                                <span className="text-muted-foreground font-medium truncate max-w-[140px]">
                                  {item.name} ({item.variant.size}) ×{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          ₹{order.total.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'} className="text-[10px] capitalize">
                            {order.paymentStatus} ({order.paymentMethod.toUpperCase()})
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant} className="gap-1.5">
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* ── Order Detail Modal ────────────────────────────────────────────────── */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          {(() => {
            const cfg = getStatusConfig(selectedOrder.status);
            const StatusIcon = cfg.icon;

            return (
              <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-base font-bold text-primary">{selectedOrder.orderNumber}</span>
                        <Badge variant={cfg.variant} className="gap-1">
                          <StatusIcon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Placed on {new Date(selectedOrder.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInvoice(true)}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" /> Print Tax Invoice
                    </Button>
                  </div>
                </DialogHeader>

                <DialogBody className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Items breakdown */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ordered Items</h4>
                    <div className="space-y-2">
                      {normalizeItems(selectedOrder).map((item, i) => (
                        <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl bg-muted/30 border">
                          <div className="h-10 w-10 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 flex items-center justify-center shrink-0">
                            <Package className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{item.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="h-2.5 w-2.5 rounded-full border" style={{ background: item.variant.colorHex }} />
                              <span>Size: {item.variant.size} · Color: {item.variant.color} · SKU: {item.sku}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold font-mono">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ₹{item.price.toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Customer, Shipping, and Payment */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2 text-xs">
                      <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Customer Details</h4>
                      <p className="font-semibold text-sm text-foreground">{getUserName(selectedOrder)}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{getUserEmail(selectedOrder)}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{selectedOrder.address.phone}</p>
                      <div className="pt-2 flex items-center gap-2">
                        <span className="font-medium">Payment:</span>
                        <Badge variant={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                          {selectedOrder.paymentStatus.toUpperCase()} ({selectedOrder.paymentMethod.toUpperCase()})
                        </Badge>
                        {selectedOrder.paymentStatus !== 'paid' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2 border-primary text-primary"
                            onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'paid')}
                          >
                            Mark Paid
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Shipping Address</h4>
                      <p className="font-semibold text-sm text-foreground">{selectedOrder.address.fullName}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedOrder.address.line1}<br />
                        {selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.pincode}
                      </p>
                      {selectedOrder.trackingNumber && (
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-mono text-xs">
                          Tracking #: {selectedOrder.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Financial Breakdown */}
                  <div className="rounded-xl bg-muted/40 p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-mono">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount</span>
                        <span className="font-mono">-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Delivery Fee</span>
                      <span className="font-mono">{selectedOrder.shippingFee ? `₹${selectedOrder.shippingFee}` : 'Free'}</span>
                    </div>
                    <Separator className="my-1" />
                    <div className="flex justify-between font-bold text-sm text-foreground pt-1">
                      <span>Total Amount Paid</span>
                      <span className="font-mono text-primary">₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Status History Timeline */}
                  {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status Audit History</h4>
                      <div className="space-y-2">
                        {selectedOrder.statusHistory.map((h, i) => (
                          <div key={i} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-muted/20 border">
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-violet-600" />
                              <span className="font-semibold capitalize">{h.status}</span>
                              {h.note && <span className="text-muted-foreground">({h.note})</span>}
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(h.updatedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Update Form */}
                  {cfg.nextStatus && selectedOrder.status !== 'cancelled' && (
                    <div className="space-y-3 rounded-xl border-2 border-dashed border-primary/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Next Action Step</p>
                      {cfg.nextStatus === 'shipped' && (
                        <div>
                          <Label htmlFor="trackingNo" className="text-xs">Courier Tracking Number</Label>
                          <Input
                            id="trackingNo"
                            placeholder="e.g. DTDC987654321"
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            className="mt-1 text-xs"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="statusNote" className="text-xs">Status Note (Optional)</Label>
                        <Textarea
                          id="statusNote"
                          rows={2}
                          placeholder="Note for customer or internal audit logs…"
                          value={statusNote}
                          onChange={(e) => setStatusNote(e.target.value)}
                          className="mt-1 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </DialogBody>

                <DialogFooter className="p-4 border-t flex items-center justify-between gap-3">
                  {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowCancelDialog(true)}
                      className="gap-1.5"
                    >
                      <Ban className="h-4 w-4" /> Cancel Order
                    </Button>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>Close</Button>
                    {cfg.nextStatus && selectedOrder.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        onClick={() => handleUpdateStatus(selectedOrder, cfg.nextStatus!)}
                        disabled={updating}
                        className="gap-2"
                      >
                        {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <StatusIcon className="h-4 w-4" />}
                        {cfg.nextLabel}
                      </Button>
                    )}
                  </div>
                </DialogFooter>
              </DialogContent>
            );
          })()}
        </Dialog>
      )}

      {/* ── Cancel Order Dialog ──────────────────────────────────────────────── */}
      {showCancelDialog && selectedOrder && (
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive flex items-center gap-2">
                <Ban className="h-5 w-5" /> Confirm Order Cancellation
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4 pt-2 text-sm">
              <p className="text-muted-foreground text-xs">
                Are you sure you want to cancel order <strong>{selectedOrder.orderNumber}</strong>? This action will restore product stock levels.
              </p>
              <div>
                <Label htmlFor="cancelReason" className="text-xs">Cancellation Reason</Label>
                <Textarea
                  id="cancelReason"
                  placeholder="Reason for cancellation…"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowCancelDialog(false)}>
                Back
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={updating}
                onClick={() => handleCancelOrder(selectedOrder)}
                className="gap-2"
              >
                {updating && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Printable Tax Invoice Modal ───────────────────────────────────────── */}
      {showInvoice && selectedOrder && (
        <Dialog open={showInvoice} onOpenChange={setShowInvoice}>
          <DialogContent className="max-w-3xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b pb-6">
                <div>
                  <h2 className="text-2xl font-bold font-display tracking-tight text-primary">StyleHub</h2>
                  <p className="text-xs text-muted-foreground">Official Marketplace Tax Invoice</p>
                  <p className="text-xs text-muted-foreground">GSTIN: 27AAAAA0000A1Z5</p>
                </div>
                <div className="text-right text-xs space-y-1">
                  <p className="font-mono font-bold text-sm text-foreground">{selectedOrder.orderNumber}</p>
                  <p className="text-muted-foreground">Date: {new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</p>
                  <Badge variant={selectedOrder.paymentStatus === 'paid' ? 'success' : 'warning'}>
                    {selectedOrder.paymentStatus.toUpperCase()} ({selectedOrder.paymentMethod.toUpperCase()})
                  </Badge>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <p className="font-bold text-muted-foreground uppercase mb-1">Billed & Shipped To</p>
                  <p className="font-bold text-sm text-foreground">{selectedOrder.address.fullName}</p>
                  <p className="text-muted-foreground leading-relaxed mt-1">
                    {selectedOrder.address.line1}<br />
                    {selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.pincode}<br />
                    Phone: {selectedOrder.address.phone}<br />
                    Email: {getUserEmail(selectedOrder)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-muted-foreground uppercase mb-1">Fulfillment Status</p>
                  <p className="font-semibold text-sm capitalize">{selectedOrder.status}</p>
                  {selectedOrder.trackingNumber && (
                    <p className="text-muted-foreground mt-1">Courier AWB: {selectedOrder.trackingNumber}</p>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 font-semibold">
                    <th className="p-2">Item</th>
                    <th className="p-2">Variant</th>
                    <th className="p-2 text-right">Price</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {normalizeItems(selectedOrder).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 text-muted-foreground">{item.variant.size} / {item.variant.color}</td>
                      <td className="p-2 text-right font-mono">₹{item.price.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-center font-mono">{item.quantity}</td>
                      <td className="p-2 text-right font-mono font-bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end pt-4">
                <div className="w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal:</span>
                    <span className="font-mono">₹{selectedOrder.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span className="font-mono">-₹{selectedOrder.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping:</span>
                    <span className="font-mono">{selectedOrder.shippingFee ? `₹${selectedOrder.shippingFee}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-2 text-sm text-foreground">
                    <span>Grand Total:</span>
                    <span className="font-mono text-primary">₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t pt-4 flex justify-between items-center text-[10px] text-muted-foreground">
                <p>Thank you for shopping with StyleHub! Computer-generated invoice, signature not required.</p>
                <Button size="sm" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" /> Print Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OrdersPage;
