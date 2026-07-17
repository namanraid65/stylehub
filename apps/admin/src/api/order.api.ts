import apiClient from './client';

export type OrderStatus =
  | 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';

export interface OrderItem {
  product:  { _id: string; name: string; images: string[]; slug: string } | string;
  variant:  { size: string; color: string; colorHex: string; sku: string };
  quantity: number;
  price:    number;
}

export interface Order {
  _id:             string;
  orderNumber:     string;
  user:            { _id: string; name: string; email: string } | string;
  items:           OrderItem[];
  status:          OrderStatus;
  paymentMethod:   string;
  paymentStatus:   string;
  address: {
    fullName: string; phone: string; line1: string;
    city: string; state: string; pincode: string;
  };
  subtotal:        number;
  discount:        number;
  shippingFee:     number;
  total:           number;
  trackingNumber?: string;
  notes?:          string;
  statusHistory:   { status: string; note?: string; updatedAt: string }[];
  createdAt:       string;
}

const mapOrder = (o: any): Order => {
  if (!o) return o;
  return {
    ...o,
    subtotal:    o.totals?.subtotal ?? 0,
    discount:    o.totals?.discount ?? 0,
    shippingFee: o.totals?.delivery ?? 0,
    total:       o.totals?.total ?? 0,
  };
};

const orderApi = {
  // Vendor: own orders only (server filters by vendor)
  myOrders: async (params?: { page?: number; limit?: number; status?: OrderStatus }) => {
    const res = await apiClient.get<{ data: any[]; pagination: unknown }>('/orders/vendor/mine', { params });
    if (res.data && res.data.data) {
      res.data.data = res.data.data.map(mapOrder);
    }
    return res;
  },

  // Admin: all orders
  allOrders: async (params?: { page?: number; limit?: number; status?: OrderStatus }) => {
    const res = await apiClient.get<{ data: any[]; pagination: unknown }>('/orders', { params });
    if (res.data && res.data.data) {
      res.data.data = res.data.data.map(mapOrder);
    }
    return res;
  },

  getById: async (id: string) => {
    const res = await apiClient.get<{ data: any }>(`/orders/${id}`);
    if (res.data && res.data.data) {
      res.data.data = mapOrder(res.data.data);
    }
    return res;
  },

  // Update status (vendor can: confirmed→processing→shipped; admin can do all)
  updateStatus: async (id: string, status: OrderStatus, trackingNumber?: string, note?: string) => {
    const res = await apiClient.patch<{ data: any }>(`/orders/${id}/status`, { status, trackingNumber, note });
    if (res.data && res.data.data) {
      res.data.data = mapOrder(res.data.data);
    }
    return res;
  },

  // Update payment status (vendor/admin)
  updatePaymentStatus: async (id: string, paymentStatus: string) => {
    const res = await apiClient.patch<{ data: any }>(`/orders/${id}/payment-status`, { paymentStatus });
    if (res.data && res.data.data) {
      res.data.data = mapOrder(res.data.data);
    }
    return res;
  },

  // Admin: stats
  stats: () =>
    apiClient.get<{
      data: {
        totalRevenue: number;
        totalOrders: number;
        activeProducts: number;
        activeVendors: number;
        statusDistribution: Array<{ name: string; value: number }>;
        monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
        topVendors: Array<{ name: string; orders: number; revenue: number; rating: number }>;
      }
    }>('/orders/stats'),

  // Admin: analytics
  analytics: () =>
    apiClient.get<{
      data: {
        totalRevenue: number;
        totalOrders: number;
        activeProducts: number;
        activeVendors: number;
        newCustomers: number;
        dailyTrend: Array<{ label: string; revenue: number; orders: number }>;
        categoryDistribution: Array<{ name: string; revenue: number; pct: number; color: string }>;
        topProducts: Array<{ name: string; sales: number; revenue: number }>;
        vendorPerformance: Array<{ name: string; orders: number; revenue: number; rating: number }>;
        enquiryDistribution: Array<{ name: string; value: number; color: string }>;
        reviewDistribution: Array<{ label: string; count: number }>;
      }
    }>('/orders/analytics'),

  // Vendor: stats
  vendorStats: () =>
    apiClient.get<{
      data: {
        totalRevenue: number;
        totalOrders: number;
        pendingFulfillments: number;
        productCount: number;
        statusDistribution: Array<{ name: string; value: number }>;
        monthlyRevenue: Array<{ month: string; revenue: number; orders: number }>;
        topProducts: Array<{ name: string; orders: number; revenue: number; rating: number }>;
      }
    }>('/orders/vendor/stats'),
};

export default orderApi;
