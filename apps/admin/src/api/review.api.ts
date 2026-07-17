import apiClient from './client';

export interface Review {
  _id:          string;
  product:      { _id: string; name: string; slug: string } | string;
  vendor:       string;
  customer:     { _id: string; name: string; email: string } | string;
  rating:       number;
  title:        string;
  body:         string;
  helpfulVotes: number;
  isVerified:   boolean;
  isApproved:   boolean;
  createdAt:    string;
}

const reviewApi = {
  listAll: (params?: { approved?: boolean; page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; reviews: Review[]; total: number }>('/reviews/admin/all', { params }),

  approve: (id: string, approved: boolean, adminNote?: string) =>
    apiClient.patch<{ success: boolean; review: Review }>(`/reviews/${id}/approve`, { approved, adminNote }),

  delete: (id: string) =>
    apiClient.delete(`/reviews/${id}`),
};

export default reviewApi;
