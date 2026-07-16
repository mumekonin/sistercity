import api from './axios';
import type { News, NewsListItem } from '../types/news.types';

export const newsApi = {
  getAll: async (
    category?: string,
    city?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: NewsListItem[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (city) params.append('city', city);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/news?${params.toString()}`);
    return response.data;
  },

  getManageAll: async (
    category?: string,
    city?: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: NewsListItem[]; total: number; page: number; limit: number }> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (city) params.append('city', city);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/news/manage?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<News> => {
    const response = await api.get(`/news/${id}`);
    return response.data;
  },

  getManageById: async (id: string): Promise<News> => {
    const response = await api.get(`/news/manage/${id}`);
    return response.data;
  },

  create: async (formData: FormData): Promise<News> => {
    const response = await api.post('/news', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, formData: FormData): Promise<News> => {
    const response = await api.patch(`/news/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  updateJson: async (id: string, data: any): Promise<News> => {
    const response = await api.patch(`/news/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  },
};