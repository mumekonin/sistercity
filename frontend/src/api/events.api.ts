import api from './axios';
import type { Event, EventListItem } from '../types/event.types';

export const eventsApi = {
  getAll: async (month?: number, year?: number): Promise<EventListItem[]> => {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const response = await api.get(`/events?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  create: async (data: any): Promise<Event> => {
    const response = await api.post('/events', data);
    return response.data;
  },

  update: async (id: string, data: any): Promise<Event> => {
    const response = await api.put(`/events/${id}`, data);
    return response.data;
  },

  cancel: async (id: string): Promise<Event> => {
    const response = await api.patch(`/events/${id}/cancel`);
    return response.data;
  },

  updateMinutes: async (id: string, data: any): Promise<Event> => {
    const response = await api.patch(`/events/${id}/minutes`, data);
    return response.data;
  },
};