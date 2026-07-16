import { useEffect, useState } from 'react';
import { notificationsApi } from '../api/notifications.api';

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await notificationsApi.getAll();
        setUnreadCount(response.unreadCount ?? 0);
      } catch {
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return unreadCount;
}