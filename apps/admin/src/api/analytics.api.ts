import apiClient from './client';

export interface OverviewMetrics {
  revenue:      { value: number; delta: number };
  orders:       { value: number; delta: number };
  newCustomers: { value: number; delta: number };
  activeVendors:{ value: number; delta: number };
}

export interface RevenuePoint {
  label:   string;
  revenue: number;
  orders:  number;
}

export interface CategoryMetric {
  name:    string;
  revenue: number;
  orders:  number;
  pct:     number;
  color?:  string;
}

export interface TopProductMetric {
  name:    string;
  sales:   number;
  revenue: number;
}

export interface VendorPerformanceMetric {
  name:    string;
  orders:  number;
  revenue: number;
  rating:  number;
}

const analyticsApi = {
  getOverview: () =>
    apiClient.get<{ success: boolean; overview: OverviewMetrics }>('/analytics/overview'),

  getRevenue: (period: '7d' | '30d' | '90d' = '30d') =>
    apiClient.get<{ success: boolean; period: string; data: Array<{ _id: string; revenue: number; orders: number }> }>(
      '/analytics/revenue',
      { params: { period } }
    ),

  getCategories: () =>
    apiClient.get<{ success: boolean; categories: CategoryMetric[] }>('/analytics/categories'),

  getTopProducts: () =>
    apiClient.get<{ success: boolean; products: TopProductMetric[] }>('/analytics/top-products'),

  getVendors: () =>
    apiClient.get<{ success: boolean; vendors: VendorPerformanceMetric[] }>('/analytics/vendors'),
};

export default analyticsApi;
