import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Search, Filter, Truck, CheckCircle2,
  Clock, XCircle, Package, ChevronRight, X, Loader2,
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

const STATUS_CONFIG: Record<string, {
  label: string;
  variant: 'success' | 'warning' | 'info' | 'destructive' | 'secondary';
  icon: React.ElementType;
  nextStatus?: OrderStatus;
  nextLabel?: string;
}> = {
  placed:     { label: 'Placed',      variant: 'secondary',   icon: ShoppingCart, nextStatus: 'confirmed',  nextLabel: 'Confirm Order' },
  confirmed:  { label: 'Confirmed',   variant: 'info',        icon: CheckCircle2, nextStatus: 'processing', nextLabel: 'Mark Processing' },
  processing: { label: 'Processing',  variant: 'warning',     icon: Clock,        nextStatus: 'shipped',    nextLabel: 'Mark Shipped' },
  shipped:    { label: 'Shipped',     variant: 'info',        icon: Truck,        nextStatus: 'delivered',  nextLabel: 'Mark Delivered' },
  delivered:  { label: 'Delivered',   variant: 'success',     icon: CheckCircle2 },
  cancelled:  { label: 'Cancelled',   variant: 'destructive', icon: XCircle },
  returned:   { label: 'Returned',    variant: 'destructive', icon: Package },
};

const normalizeItems = (order: Order) => {
  return (((order as any).fulfillments || []) as any[]).flatMap((f: any) =>
    ((f.items || []) as any[]).map((item: any) => ({
      product: item.productId || item.product,
      name: item.name,
      sku: item.sku,
      price: item.price,
      quantity: item.quantity,
      variant: {
        size: item.size,
        color: item.color,
        colorHex: item.colorHex || '#9ca3af',
        sku: item.sku,
      }
    }))
  ) as {
    product: any;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    variant: {
      size: string;
      color: string;
      colorHex: string;
      sku: string;
    };
  }[];
};

const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [trackingNo, setTrackingNo] = useState('');
  const [statusNote, setStatusNote] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await orderApi.allOrders();
      setOrders(res.data.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
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
      // Refresh list
      await fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      console.error('Failed to update order status:', err);
    } finally {
      setUpdating(false);
      setTrackingNo('');
      setStatusNote('');
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: string) => {
    try {
      const res = await orderApi.updatePaymentStatus(orderId, status);
      await fetchOrders();
      if (res.data && res.data.data) {
        setSelectedOrder(res.data.data);
      } else {
        setSelectedOrder(null);
      }
    } catch (err) {
      console.error('Failed to update payment status:', err);
    }
  };

  const getUserName = (o: Order) => {
    if (!o.user) return 'Guest';
    return typeof o.user === 'string' ? o.user : o.user.name;
  };

  const getUserEmail = (o: Order) => {
    if (!o.user) return '';
    return typeof o.user === 'string' ? '' : o.user.email;
  };

  const filtered = orders.filter((o) => {
    const matchSearch = o.orderNumber.includes(search) ||
      (o.user && typeof o.user !== 'string' && o.user.name.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Orders</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Browse and manage customer orders across all stores</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary chips */}
          <div className="flex gap-2 flex-wrap">
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
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  {s === 'all' ? `All (${count})` : `${cfg?.label} (${count})`}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Order ID or customer name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Table */}
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
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
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      No orders found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((order) => {
                    const cfg = STATUS_CONFIG[order.status] || { label: order.status, variant: 'secondary', icon: ShoppingCart };
                    const StatusIcon = cfg.icon;

                    return (
                      <TableRow key={order._id}>
                        <TableCell className="font-mono text-xs font-semibold">{order.orderNumber}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{getUserName(order)}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {normalizeItems(order).map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5 text-xs">
                                <span
                                  className="h-2.5 w-2.5 rounded-full shrink-0"
                                  style={{ background: item.variant.colorHex }}
                                />
                                <span className="text-muted-foreground">
                                  {item.variant.size} · ×{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-sm">
                          ₹{order.total.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={order.paymentStatus === 'paid' ? 'success' : 'warning'} className="text-[10px]">
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

      {/* ── Order Detail Dialog ────────────────────────────────────────────────── */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        {selectedOrder && (() => {
          const cfg = (STATUS_CONFIG[selectedOrder.status] || { label: selectedOrder.status, variant: 'secondary', icon: ShoppingCart }) as any;
          return (
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono text-base">{selectedOrder.orderNumber}</span>
                  <Badge variant={cfg.variant} className="gap-1">
                    <cfg.icon className="h-3 w-3" />
                    {cfg.label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <DialogBody className="space-y-5">
                {/* Items */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {normalizeItems(selectedOrder).map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {typeof item.product === 'string' ? item.product : item.product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="h-3 w-3 rounded-full border border-border/60" style={{ background: item.variant.colorHex }} />
                            <span className="text-xs text-muted-foreground">
                              {item.variant.size} / {item.variant.color} · Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm font-semibold shrink-0">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Customer & address */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Customer</p>
                    <p className="text-sm font-medium">{getUserName(selectedOrder)}</p>
                    <p className="text-xs text-muted-foreground">
                      {getUserEmail(selectedOrder)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      {selectedOrder.paymentMethod.toUpperCase()} ·{' '}
                      <span className={selectedOrder.paymentStatus === 'paid' ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-amber-500 font-semibold'}>
                        {selectedOrder.paymentStatus.toUpperCase()}
                      </span>
                      {selectedOrder.paymentStatus !== 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-5 text-[10px] px-1.5 py-0 border-primary text-primary hover:bg-primary/10"
                          onClick={() => handleUpdatePaymentStatus(selectedOrder._id, 'paid')}
                        >
                          Mark Paid
                        </Button>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Shipping To</p>
                    <p className="text-sm font-medium">{selectedOrder.address.fullName}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedOrder.address.line1}<br />
                      {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.pincode}
                    </p>
                  </div>
                </div>

                {/* Financials */}
                <div className="rounded-xl bg-muted/50 p-4 space-y-1.5 text-sm">
                  {[
                    { label: 'Subtotal', value: `₹${selectedOrder.subtotal.toLocaleString('en-IN')}` },
                    selectedOrder.discount > 0 && { label: 'Discount', value: `-₹${selectedOrder.discount.toLocaleString('en-IN')}`, color: 'text-green-600 dark:text-green-400' },
                    { label: 'Shipping', value: selectedOrder.shippingFee ? `₹${selectedOrder.shippingFee}` : 'Free' },
                  ].filter(Boolean).map((row) => {
                    const r = row as { label: string; value: string; color?: string };
                    return (
                      <div key={r.label} className="flex justify-between">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className={cn('font-medium', r.color)}>{r.value}</span>
                      </div>
                    );
                  })}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₹{selectedOrder.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Update status section */}
                {cfg.nextStatus && (
                  <div className="space-y-3 rounded-xl border-2 border-dashed border-primary/30 p-4">
                    <p className="text-sm font-semibold">Update Order Status</p>
                    {cfg.nextStatus === 'shipped' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="trackingNo">Tracking Number</Label>
                        <Input
                          id="trackingNo"
                          placeholder="e.g. DTDC1234567890"
                          value={trackingNo}
                          onChange={(e) => setTrackingNo(e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor="statusNote">Note <span className="text-muted-foreground">(optional)</span></Label>
                      <Textarea
                        id="statusNote"
                        rows={2}
                        placeholder="Add a note about this status change…"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </DialogBody>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
                {cfg.nextStatus && (
                  <Button
                    onClick={() => handleUpdateStatus(selectedOrder, cfg.nextStatus!)}
                    disabled={updating}
                    className="gap-2"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <cfg.icon className="h-4 w-4" />}
                    {cfg.nextLabel}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          );
        })()}
      </Dialog>
    </div>
  );
};

export default OrdersPage;
