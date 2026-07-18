import axios from 'axios';
import { API_URL } from '../utils/constants';

// Read the active token from whichever storage holds it
function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

function storeNewToken(token: string): void {
  // Write to whichever storage the refresh token came from
  if (localStorage.getItem('refreshToken')) {
    localStorage.setItem('token', token);
  } else {
    sessionStorage.setItem('token', token);
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

// Handle 401 → auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const newToken = response.data.token;
          storeNewToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          ['token', 'refreshToken', 'user'].forEach((k) => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
          });
          const publicPaths = ['/', '/login', '/forgot-password', '/reset-password'];
          if (!publicPaths.includes(window.location.pathname)) {
            window.location.href = '/login';
          }
        }
      } else {
        ['token', 'refreshToken', 'user'].forEach((k) => {
          localStorage.removeItem(k);
          sessionStorage.removeItem(k);
        });
        const publicPaths = ['/', '/login', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;