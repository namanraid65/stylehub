import apiClient from './client';

export interface ActivityLog {
  _id:       string;
  actorName: string;
  actorRole: 'admin' | 'vendor' | 'customer' | 'system';
  action:    string;
  entity:    string;
  entityId:  string;
  summary:   string;
  ip:        string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitySummaryEntry {
  _id: string;
  count: number;
}

const activityApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    actorRole?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    apiClient.get<{ logs: ActivityLog[]; total: number }>('/activity', { params }),

  summary: () =>
    apiClient.get<{ summary: ActivitySummaryEntry[]; data?: ActivitySummaryEntry[] }>('/activity/summary'),
};

export default activityApi;
