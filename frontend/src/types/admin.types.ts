import type { Role, City, Department } from './enums';

export interface AdminUser {
  id?: string;
  fullName?: string;
  email?: string;
  role?: Role;
  city?: City;
  department?: Department;
  jobTitle?: string;
  phone?: string;
  isActive?: boolean;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  lastLogin?: string | null;
  createdAt?: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  city: City;
  department?: Department;
  jobTitle: string;
  phone?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  jobTitle?: string;
  department?: Department;
  phone?: string;
  city?: City;
  role?: Role;
  isActive?: boolean;
}
