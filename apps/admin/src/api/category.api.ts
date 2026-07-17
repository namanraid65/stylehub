import apiClient from './client';

export interface Category {
  _id:          string;
  name:        string;
  slug:        string;
  description?: string;
  image?:      string;
  parent?:     string | Category;
  order:       number;
  createdAt:   string;
}

export interface CreateCategoryPayload {
  name:         string;
  description?: string;
  image?:      string;
  parent?:     string | null;
  order?:      number;
}

const categoryApi = {
  list: () =>
    apiClient.get<{ data: Category[] }>('/categories'),

  getTree: () =>
    apiClient.get<{ data: any }>('/categories/tree'),

  create: (data: CreateCategoryPayload) =>
    apiClient.post<{ data: Category }>('/categories', data),

  update: (id: string, data: Partial<CreateCategoryPayload>) =>
    apiClient.put<{ data: Category }>(`/categories/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/categories/${id}`),
};

export default categoryApi;
