import api from './axios';
import type { NotificationsResponse, SearchResults, DashboardStats } from '../types/notification.types';

export const notificationsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  getAll: async (): Promise<NotificationsResponse> => {
    const response = await api.get('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
};

export const searchApi = {
  search: async (
    query: string,
    type?: string,
  ): Promise<SearchResults> => {
    const params = new URLSearchParams();
    params.append('q', query);
    if (type) params.append('type', type);
    const response = await api.get(`/search?${params.toString()}`);
    return response.data;
  },
};