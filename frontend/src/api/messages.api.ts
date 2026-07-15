import api from './axios';
import type { Message, MessageListItem } from '../types/message.types';

export const messagesApi = {
  getAll: async (type: string = 'received'): Promise<MessageListItem[]> => {
    const response = await api.get(`/messages?type=${type}`);
    return response.data;
  },

  getById: async (id: string): Promise<Message> => {
    const response = await api.get(`/messages/${id}`);
    return response.data;
  },

  send: async (data: any): Promise<Message> => {
    const response = await api.post('/messages', data);
    return response.data;
  },

  reply: async (id: string, data: any): Promise<Message> => {
    const response = await api.post(`/messages/${id}/reply`, data);
    return response.data;
  },

  update: async (id: string, action: string): Promise<Message> => {
    const response = await api.patch(`/messages/${id}`, { action });
    return response.data;
  },

  getOverdue: async (): Promise<MessageListItem[]> => {
    const response = await api.get('/messages/overdue');
    return response.data;
  },

  uploadAttachment: async (formData: FormData): Promise<{ fileUrl: string; fileName: string }> => {
    const response = await api.post('/messages/upload-attachment', formData);
    return response.data;
  },
};