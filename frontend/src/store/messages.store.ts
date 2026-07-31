import { create } from 'zustand';
import api from '../api/axios';

interface MessageStore {
  unreadCount: number;
  _intervalId: ReturnType<typeof setInterval> | null;

  /** Fetch the count once and start polling every 30s */
  startPolling: () => void;

  /** Stop polling (called on logout) */
  stopPolling: () => void;

  /** Immediately refresh the count (call after reading a message) */
  refresh: () => Promise<void>;

  /** Manually decrement when a message is marked read optimistically */
  decrement: () => void;
}

const fetchCount = async (): Promise<number> => {
  try {
    // The endpoint already scopes this to messages the current user has not
    // read; re-filtering on `status` here would drop ones a colleague opened.
    const res = await api.get('/messages?type=unread');
    const data: unknown = res.data;
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
};

export const useMessageStore = create<MessageStore>((set, get) => ({
  unreadCount: 0,
  _intervalId: null,

  startPolling: () => {
    // Avoid double-starting
    if (get()._intervalId !== null) return;

    const run = async () => {
      const count = await fetchCount();
      set({ unreadCount: count });
    };

    run(); // immediate first fetch
    const id = setInterval(run, 30_000);
    set({ _intervalId: id });
  },

  stopPolling: () => {
    const id = get()._intervalId;
    if (id !== null) clearInterval(id);
    set({ _intervalId: null, unreadCount: 0 });
  },

  refresh: async () => {
    const count = await fetchCount();
    set({ unreadCount: count });
  },

  decrement: () => {
    set((s) => ({ unreadCount: Math.max(0, s.unreadCount - 1) }));
  },
}));
