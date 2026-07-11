export interface LoginRequest {
  email: string;
  password: string;
}
export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    city: string;
    department: string;
    jobTitle: string;
  };
}