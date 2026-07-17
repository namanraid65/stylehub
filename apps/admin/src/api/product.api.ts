import apiClient from './client';

export interface ProductVariant {
  _id?:         string;
  size:         string;
  sizeCategory: string;
  color:        string;
  colorHex:     string;
  sku:          string;
  price?:       number | undefined;
  stock:        number;
  images:       string[];
  isActive:     boolean;
}

export interface Product {
  _id:             string;
  name:            string;
  slug:            string;
  description:     string;
  category:        string | { _id: string; name: string; slug: string };
  vendor:          string;
  brand:           string;
  sku:             string;
  tags:            string[];
  images:          string[];
  gender:          string;
  material?:       string;
  careInstructions?:string;
  basePrice:       number;
  compareAtPrice?: number;
  currency:        string;
  variants:        ProductVariant[];
  status:          'draft' | 'active' | 'inactive' | 'archived';
  isFeatured:      boolean;
  totalStock:      number;
  avgRating:       number;
  reviewCount:     number;
  soldCount:       number;
  createdAt:       string;
}

export interface CreateProductPayload {
  name:              string;
  description:       string;
  category:          string;
  brand:             string;
  sku:               string;
  tags:              string[];
  images:            string[];
  gender:            string;
  material?:         string | undefined;
  careInstructions?: string | undefined;
  basePrice:         number;
  compareAtPrice?:   number | undefined;
  variants:          Omit<ProductVariant, '_id'>[];
  status:            string;
  isFeatured:        boolean;
}

const productApi = {
  // Public / shared
  list: (params?: Record<string, unknown>) =>
    apiClient.get<{ data: Product[]; pagination: unknown }>('/products', { params }),

  getBySlug: (slug: string) =>
    apiClient.get<{ data: Product }>(`/products/${slug}`),

  // Vendor: own products
  myProducts: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: Product[]; pagination: unknown }>('/products/vendor/mine', { params }),

  // Create
  create: (data: CreateProductPayload) =>
    apiClient.post<{ data: Product }>('/products', data),

  // Update (by Mongo ID)
  update: (id: string, data: Partial<CreateProductPayload>) =>
    apiClient.put<{ data: Product }>(`/products/${id}`, data),

  // Update variant stock
  updateStock: (id: string, variantId: string, stock: number) =>
    apiClient.patch(`/products/${id}/variants/${variantId}/stock`, { stock }),

  // Archive (soft-delete)
  archive: (id: string) =>
    apiClient.delete(`/products/${id}`),

  // Upload product image → returns { url }
  uploadImage: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return apiClient.post<{ data: { url: string } }>('/upload/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default productApi;
