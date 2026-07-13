import api from './axios';
import type { DocumentFile, DocumentListItem } from '../types/document.types';

export const documentsApi = {
  getAll: async (): Promise<DocumentListItem[]> => {
    const response = await api.get('/documents');
    return response.data;
  },

  getById: async (id: string): Promise<DocumentFile> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  upload: async (formData: FormData): Promise<DocumentFile> => {
    const response = await api.post('/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadVersion: async (id: string, formData: FormData): Promise<DocumentFile> => {
    const response = await api.post(`/documents/${id}/version`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  update: async (id: string, data: any): Promise<DocumentFile> => {
    const response = await api.patch(`/documents/${id}`, data);
    return response.data;
  },

  download: async (id: string): Promise<{ fileUrl: string }> => {
    const response = await api.get(`/documents/${id}/download`);
    return response.data;
  },
};