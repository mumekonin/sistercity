import api from './axios';
import type {
  CreateReportRequest,
  ReportListItem,
  ReportDetail,
} from '../types/report.types';
export const reportsApi = {
  getAll: async (): Promise<ReportListItem[]> => {
    const response = await api.get('/reports');
    return response.data;
  },
  generate: async (data: CreateReportRequest): Promise<ReportDetail> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getById: async (id: string): Promise<ReportDetail> => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  download: async (id: string, type: 'pdf' | 'excel'): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/download`, {
      params: { type },
      responseType: 'blob',
    });
    return response.data;
  },
};
