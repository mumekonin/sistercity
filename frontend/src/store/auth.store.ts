import { create } from 'zustand';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  city: string;
  department: string;
  jobTitle: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  /** keepSignedIn=true → localStorage (persists); false → sessionStorage (session only) */
  setAuth: (user: User, token: string, refreshToken: string, keepSignedIn?: boolean) => void;
  clearAuth: () => void;
}

// Returns whichever storage currently holds the active token
function getActiveStorage(): Storage {
  return localStorage.getItem('token') ? localStorage : sessionStorage;
}

function loadUser(): User | null {
  try {
    const raw = getActiveStorage().getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const KEYS = ['token', 'refreshToken', 'user'] as const;

export const useAuthStore = create<AuthStore>((set) => ({
  user: loadUser(),
  token: localStorage.getItem('token') || sessionStorage.getItem('token'),

  setAuth: (user, token, refreshToken, keepSignedIn = true) => {
    // Wipe both storages first to avoid stale tokens in either place
    KEYS.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });

    const storage = keepSignedIn ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('refreshToken', refreshToken);
    storage.setItem('user', JSON.stringify(user));

    set({ user, token });
  },

  clearAuth: () => {
    KEYS.forEach((k) => {
      localStorage.removeItem(k);
      sessionStorage.removeItem(k);
    });
    set({ user: null, token: null });
  },
}));