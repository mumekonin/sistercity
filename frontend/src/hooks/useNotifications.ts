import { useEffect, useState } from 'react';
import api from '../api/axios';

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications');
        setUnreadCount(response.data.unreadCount ?? 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();

    // refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return unreadCount;
}