import apiClient from './client';

export interface VendorProfile {
  _id:              string;
  user:             string;
  storeName:        string;
  storeSlug:        string;
  storeDescription: string;
  storeLogo?:       string;
  storeBanner?:     string;
  storeLocation?:   string;
  status:           'pending' | 'approved' | 'rejected' | 'suspended';
  storeRating:      number;
  totalReviews:     number;
  totalProducts:    number;
  totalSales:       number;
  price?:           number;
  businessEmail?:   string;
  businessPhone?:   string;
  returnPolicy?:    string;
  socialLinks?: {
    instagram?: string; facebook?: string; twitter?: string; website?: string;
  };
}

export interface UpdateStorePayload {
  storeName?:        string | undefined;
  storeDescription?: string | undefined;
  storeLogo?:        string | undefined;
  storeBanner?:      string | undefined;
  businessEmail?:    string | undefined;
  businessPhone?:    string | undefined;
  returnPolicy?:     string | undefined;
  socialLinks?:      VendorProfile['socialLinks'] | undefined;
}

const vendorApi = {
  // Get own vendor profile
  getMyStore: () =>
    apiClient.get<{ data: VendorProfile }>('/vendors/me'),

  // Update own store profile
  updateMyStore: (data: UpdateStorePayload) =>
    apiClient.put<{ data: VendorProfile }>('/vendors/me', data),

  // Upload store logo (returns { url })
  uploadLogo: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ data: { url: string } }>('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Upload store banner
  uploadBanner: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ data: { url: string } }>('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Admin: get all vendors
  getAllVendors: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get('/vendors', { params }),

  // Admin: approve / reject
  updateVendorStatus: (id: string, status: string, reason?: string) =>
    apiClient.patch(`/vendors/${id}/status`, { status, reason }),

  // Admin: create a new vendor
  createVendor: (data: Record<string, string>) =>
    apiClient.post('/auth/vendor/register', data),

  // Admin: delete a vendor
  deleteVendor: (id: string) =>
    apiClient.delete(`/vendors/${id}`),
};

export default vendorApi;
