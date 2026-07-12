import api from './axios';
import type { CityProfile } from '../types/city.types';

export const citiesApi = {
  getAll: async (): Promise<CityProfile[]> => {
    const response = await api.get('/cities');
    return response.data;
  },

  getByCity: async (city: string): Promise<CityProfile> => {
    const response = await api.get(`/cities/${city}`);
    return response.data;
  },

  getDepartments: async (city: string) => {
    const response = await api.get(`/cities/${city}/departments`);
    return response.data;
  },

  update: async (city: string, data: any): Promise<CityProfile> => {
    const response = await api.put(`/cities/${city}`, data);
    return response.data;
  },
};