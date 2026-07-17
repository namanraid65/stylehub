import apiClient from './client';

export interface Notification {
  _id:       string;
  recipient: string;
  title:     string;
  message:   string;
  type:      'order' | 'system' | 'enquiry' | 'vendor';
  link?:     string;
  isRead:    boolean;
  createdAt: string;
}

const notificationApi = {
  list: (params?: { unreadOnly?: boolean; page?: number; limit?: number }) =>
    apiClient.get<{ success: boolean; notifications: Notification[]; unreadCount: number; total: number }>('/notifications', { params }),

  markRead: (id: string) =>
    apiClient.patch<{ success: boolean }>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<{ success: boolean }>('/notifications/read-all'),

  delete: (id: string) =>
    apiClient.delete<{ success: boolean }>(`/notifications/${id}`),
};

export default notificationApi;
