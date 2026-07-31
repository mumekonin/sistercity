import axios from 'axios';
import { API_URL } from '../utils/constants';

// Read the active token from whichever storage holds it
function getToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

// The backend rotates the refresh token on every refresh and invalidates the
// previous one, so both values must be replaced together or the next refresh fails.
function storeTokens(token: string, refreshToken: string): void {
  // Write to whichever storage the refresh token came from
  const storage = localStorage.getItem('refreshToken') ? localStorage : sessionStorage;
  storage.setItem('token', token);
  storage.setItem('refreshToken', refreshToken);
}

function clearSession(): void {
  ['token', 'refreshToken', 'user'].forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
}

function redirectToLoginUnlessPublic(): void {
  const publicPaths = ['/', '/login', '/forgot-password', '/reset-password'];
  if (!publicPaths.includes(window.location.pathname)) {
    window.location.href = '/login';
  }
}

// Shared across concurrent 401s: only one refresh may run at a time, otherwise
// every parallel request spends the same rotated token and all but one fail.
let refreshInFlight: Promise<string> | null = null;

function refreshAccessToken(refreshToken: string): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(`${API_URL}/auth/refresh`, { refreshToken })
      .then((response) => {
        const { token, refreshToken: rotated } = response.data;
        storeTokens(token, rotated);
        return token as string;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
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
          const newToken = await refreshAccessToken(refreshToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          clearSession();
          redirectToLoginUnlessPublic();
        }
      } else {
        clearSession();
        redirectToLoginUnlessPublic();
      }
    }

    return Promise.reject(error);
  },
);

export default api;