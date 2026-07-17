import apiClient from './client';

export interface Customer {
  _id:          string;
  name:         string;
  email:        string;
  phone?:       string;
  avatar?:      string;
  isActive:     boolean;
  isVerified:   boolean;
  createdAt:    string;
  orderCount:   number;
  totalSpent:   number;
}

const customerApi = {
  // Admin: get all customers
  getAllCustomers: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Customer[]; pagination: any }>('/customers', { params }),

  // Admin: suspend / activate customer
  updateStatus: (id: string, isActive: boolean) =>
    apiClient.patch<{ data: Customer }>(`/customers/${id}/status`, { isActive }),
};

export default customerApi;
