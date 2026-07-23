import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, Filter, Truck, CheckCircle2,
  Clock, XCircle, Package, ChevronRight, X, Loader2, RefreshCw,
  Printer, Ban, Calendar, User, Mail, MapPin,
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
import { useUser } from '../../stores/auth.store';
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

const DEMO_VENDOR_ORDERS: Order[] = [
  {
    _id: 'v-ord-001',
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
      { status: 'shipped', note: 'Dispatched via DTDC', updatedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { status: 'delivered', note: 'Delivered to recipient', updatedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
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
    _id: 'v-ord-002',
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
    _id: 'v-ord-003',
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

const extractVendorNameStr = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.storeName || val.name || val.vendorName || val.brand || val.title || '';
  }
  return '';
};

const cleanVendorStr = (val: any): string => {
  const str = extractVendorNameStr(val);
  return str
    .toLowerCase()
    .replace(/\s+(vendor|merchant|seller|boutique|store)$/i, '')
    .trim();
};

const filterVendorOrders = (allOrders: any[], user: any) => {
  const userVendorClean = cleanVendorStr(user?.storeName || user?.name || user?.email?.split('@')[0] || 'DesiCouture');
  const userVendorId = (user as any)?.vendorId || (user as any)?._id || '';

  return allOrders.filter((o: any) => {
    if (!o) return false;

    // 1. Order level vendorName
    const oVendorName = cleanVendorStr(o.vendorName || o.vendor);
    if (oVendorName && userVendorClean && (oVendorName.includes(userVendorClean) || userVendorClean.includes(oVendorName))) {
      return true;
    }

    // 2. Fulfillments array
    if (Array.isArray(o.fulfillments) && o.fulfillments.length > 0) {
      const match = o.fulfillments.some((f: any) => {
        const fVendorName = cleanVendorStr(f.vendorName || f.vendor);
        const fVendorId = f.vendorId || f.vendor?._id || '';
        return (
          (userVendorId && fVendorId && userVendorId === fVendorId) ||
          (fVendorName && userVendorClean && (fVendorName.includes(userVendorClean) || userVendorClean.includes(fVendorName)))
        );
      });
      if (match) return true;
    }

    // 3. Items array
    if (Array.isArray(o.items) && o.items.length > 0) {
      const match = o.items.some((item: any) => {
        const itemVendorName = cleanVendorStr(
          item.vendorName || item.vendor || item.brand || item.product?.vendor || item.product?.brand
        );
        const itemVendorId = item.vendorId || item.vendor?._id || item.product?.vendor?._id || '';
        return (
          (userVendorId && itemVendorId && userVendorId === itemVendorId) ||
          (itemVendorName && userVendorClean && (itemVendorName.includes(userVendorClean) || userVendorClean.includes(itemVendorName)))
        );
      });
      if (match) return true;
    }

    // 4. Default fallback if order has no vendor info
    if (!o.vendorName && (!o.fulfillments || o.fulfillments.length === 0) && (!o.items || o.items.length === 0)) {
      return userVendorClean.includes('desi');
    }

    return false;
  });
};

const VendorOrdersPage: React.FC = () => {
  const user = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showPackingSlip, setShowPackingSlip] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.myOrders();
      const apiOrders = res.data?.data || (res as any).data || [];

      if (Array.isArray(apiOrders) && apiOrders.length > 0) {
        const filtered = filterVendorOrders(apiOrders, user);
        setOrders(filtered.length > 0 ? filtered : apiOrders);
      } else {
        const storedOrders = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('stylehub-placed-orders') || '[]') : [];
        const mergedMap = new Map<string, any>();
        if (Array.isArray(storedOrders)) {
          storedOrders.forEach((o: any) => {
            const key = o.orderNumber || o._id;
            if (key) mergedMap.set(key, o);
          });
        }
        DEMO_VENDOR_ORDERS.forEach((o: any) => {
          const key = o.orderNumber || o._id;
          if (key && !mergedMap.has(key)) mergedMap.set(key, o);
        });

        const allMerged = [...mergedMap.values()];
        const vendorFiltered = filterVendorOrders(allMerged, user);
        setOrders(vendorFiltered);
      }
    } catch (err) {
      console.error('Failed to fetch vendor orders:', err);
      const storedOrders = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('stylehub-placed-orders') || '[]') : [];
      const mergedMap = new Map<string, any>();
      if (Array.isArray(storedOrders)) {
        storedOrders.forEach((o: any) => {
          const key = o.orderNumber || o._id;
          if (key) mergedMap.set(key, o);
        });
      }
      DEMO_VENDOR_ORDERS.forEach((o: any) => {
        const key = o.orderNumber || o._id;
        if (key && !mergedMap.has(key)) mergedMap.set(key, o);
      });

      const allMerged = [...mergedMap.values()];
      const vendorFiltered = filterVendorOrders(allMerged, user);
      setOrders(vendorFiltered);
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
      console.error('Failed to update status:', err);
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
      await orderApi.cancelOrder(order._id, cancelReason || 'Cancelled by vendor');
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

  const filtered = orders.filter((o) => {
    const userName = getUserName(o).toLowerCase();
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      userName.includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">My Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage customer orders and fulfillments for your store</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary chips & search */}
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

            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search order ID or name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
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
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const cfg = getStatusConfig(order.status);
                    const StatusIcon = cfg.icon;

                    return (
                      <TableRow key={order._id} className="hover:bg-muted/40 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-primary">{order.orderNumber}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{getUserName(order)}</p>
                          <p className="text-[11px] text-muted-foreground">{getUserEmail(order)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {normalizeItems(order).map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: item.variant.colorHex }} />
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
                            {order.paymentStatus}
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
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedOrder(order)}>
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

      {/* ── Vendor Detail Dialog ──────────────────────────────────────────────── */}
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
                    <Button variant="outline" size="sm" onClick={() => setShowPackingSlip(true)} className="gap-2">
                      <Printer className="h-4 w-4" /> Print Packing Slip
                    </Button>
                  </div>
                </DialogHeader>

                <DialogBody className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Items list */}
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Fulfillment Items</h4>
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
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Customer & Shipping */}
                  <div className="grid gap-6 sm:grid-cols-2 text-xs">
                    <div className="space-y-1.5">
                      <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Customer Info</h4>
                      <p className="font-semibold text-sm text-foreground">{getUserName(selectedOrder)}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{getUserEmail(selectedOrder)}</p>
                      <p className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{selectedOrder.address.phone}</p>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-semibold uppercase tracking-wider text-muted-foreground">Shipping Destination</h4>
                      <p className="font-semibold text-sm text-foreground">{selectedOrder.address.fullName}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {selectedOrder.address.line1}<br />
                        {selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Status update section */}
                  {cfg.nextStatus && selectedOrder.status !== 'cancelled' && (
                    <div className="space-y-3 rounded-xl border-2 border-dashed border-primary/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-primary">Update Fulfillment Status</p>
                      {cfg.nextStatus === 'shipped' && (
                        <div>
                          <Label htmlFor="vendorTrackingNo" className="text-xs">Courier AWB / Tracking Number</Label>
                          <Input
                            id="vendorTrackingNo"
                            placeholder="e.g. DTDC987654321"
                            value={trackingNo}
                            onChange={(e) => setTrackingNo(e.target.value)}
                            className="mt-1 text-xs"
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="vendorStatusNote" className="text-xs">Fulfillment Note (Optional)</Label>
                        <Textarea
                          id="vendorStatusNote"
                          rows={2}
                          placeholder="Note regarding packaging or dispatch…"
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
                <Ban className="h-5 w-5" /> Cancel Order
              </DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-4 pt-2 text-sm">
              <p className="text-muted-foreground text-xs">
                Cancel order <strong>{selectedOrder.orderNumber}</strong>? The customer will be notified and items returned to stock.
              </p>
              <div>
                <Label htmlFor="vCancelReason" className="text-xs">Reason for Cancellation</Label>
                <Textarea
                  id="vCancelReason"
                  placeholder="e.g. Item out of stock"
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
                Confirm Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Vendor Packing Slip Printable Dialog ────────────────────────────── */}
      {showPackingSlip && selectedOrder && (
        <Dialog open={showPackingSlip} onOpenChange={setShowPackingSlip}>
          <DialogContent className="max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-primary">Store Packing Slip</h2>
                  <p className="text-muted-foreground">Order Dispatch Sheet</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-sm">{selectedOrder.orderNumber}</p>
                  <p className="text-muted-foreground">{new Date(selectedOrder.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border p-3 rounded-lg bg-muted/20">
                <div>
                  <p className="font-bold text-muted-foreground uppercase">Deliver To</p>
                  <p className="font-bold text-sm text-foreground">{selectedOrder.address.fullName}</p>
                  <p className="text-muted-foreground mt-1">
                    {selectedOrder.address.line1}<br />
                    {selectedOrder.address.city}, {selectedOrder.address.state} — {selectedOrder.address.pincode}<br />
                    Phone: {selectedOrder.address.phone}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-muted-foreground uppercase">Payment Status</p>
                  <p className="font-bold text-sm text-emerald-600 uppercase">{selectedOrder.paymentStatus}</p>
                  <p className="text-muted-foreground mt-1">Method: {selectedOrder.paymentMethod.toUpperCase()}</p>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40 font-semibold">
                    <th className="p-2">Product Name</th>
                    <th className="p-2">Size / Color</th>
                    <th className="p-2 text-center">Quantity</th>
                    <th className="p-2 text-center">Packed Check</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {normalizeItems(selectedOrder).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2 text-muted-foreground">{item.variant.size} / {item.variant.color}</td>
                      <td className="p-2 text-center font-bold font-mono">{item.quantity}</td>
                      <td className="p-2 text-center">
                        <div className="h-4 w-4 border border-muted-foreground/50 rounded inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t pt-4 flex justify-between items-center text-[10px] text-muted-foreground">
                <p>Checked by: ________________________</p>
                <Button size="sm" onClick={() => window.print()} className="gap-2">
                  <Printer className="h-4 w-4" /> Print Packing Slip
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VendorOrdersPage;
