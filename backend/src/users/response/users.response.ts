export class UserResponse {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  city?: string;
  department?: string;
  jobTitle?: string;
  phone?: string;
  isActive?: boolean;
  isLocked?: boolean;
  failedLoginAttempts?: number;
  lastLogin?: Date;
  createdAt?: Date;
}