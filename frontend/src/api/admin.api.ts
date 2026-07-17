import api from './axios';
import type { AdminUser, CreateUserRequest, UpdateUserRequest } from '../types/admin.types';

export const adminApi = {
  getAllUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get('/users/allUsersByRole');
    return response.data;
  },
  createUser: async (data: CreateUserRequest): Promise<AdminUser> => {
    const response = await api.post('/users/create', data);
    return response.data;
  },
  updateUser: async (id: string, data: UpdateUserRequest): Promise<AdminUser> => {
    const response = await api.patch(`/users/updateUser/${id}`, data);
    return response.data;
  },
};
