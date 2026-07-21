import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../../api/notifications.api';
import type { Notification } from '../../types/notification.types';

// Google Material Icon component helper
function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-icons-round ${className}`}>{name}</span>;
}

const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
  MESSAGE_RECEIVED:  { icon: 'chat_bubble',       color: 'text-blue-600 dark:text-blue-400',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
  DOCUMENT_UPLOADED: { icon: 'description',        color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  MILESTONE_DELAYED: { icon: 'schedule',           color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  TASK_DUE:          { icon: 'task_alt',           color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  EVENT_REMINDER:    { icon: 'event',              color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  BUDGET_ALERT:      { icon: 'account_balance',    color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30' },
  PROJECT_APPROVED:  { icon: 'verified',           color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  PROJECT_REJECTED:  { icon: 'cancel',             color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-100 dark:bg-red-900/30' },
  ESCALATION:        { icon: 'warning',            color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
};

const priorityConfig: Record<string, { label: string; className: string; dot: string }> = {
  NORMAL:   { label: 'Normal',   className: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',       dot: 'bg-blue-400' },
  URGENT:   { label: 'Urgent',   className: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-400' },
  CRITICAL: { label: 'Critical', className: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',           dot: 'bg-red-500' },
};

type FilterType = 'all' | 'unread' | 'alerts';

// Top-level routes that exist in the router
const KNOWN_ROUTES = [
  '/dashboard', '/cities', '/projects', '/documents',
  '/messages', '/events', '/budget', '/news',
  '/notifications', '/reports', '/admin', '/settings', '/search',
];

// Routes that have a detail page (/:id sub-route defined in the router)
const ROUTES_WITH_DETAIL = ['/projects'];

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await notificationsApi.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    if (notification.link) {
      // Parse the link to get just the pathname (ignore query/hash for routing check)
      let target = notification.link;
      try {
        // Build a full URL so URL() can parse it properly
        const parsed = new URL(notification.link, window.location.origin);
        const pathname = parsed.pathname;
        // Find the matching top-level route
        const topLevelMatch = KNOWN_ROUTES.find(
          (r) => pathname === r || pathname.startsWith(r + '/')
        );
        
        if (topLevelMatch) {
          if (pathname === topLevelMatch) {
            // Exact match (e.g. /messages)
            target = parsed.pathname + parsed.search;
          } else if (ROUTES_WITH_DETAIL.includes(topLevelMatch)) {
            // Has a detail page (e.g. /projects/123)
            target = parsed.pathname + parsed.search;
          } else {
            // No detail page (e.g. /documents/123), strip to top-level list page
            target = topLevelMatch + parsed.search;
          }
        } else {
          // Completely unknown, fallback to dashboard
          target = '/dashboard';
        }
      } catch {
        // If parsing fails, navigate to dashboard
        target = '/dashboard';
      }
      navigate(target);
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'alerts') return n.priority === 'URGENT' || n.priority === 'CRITICAL';
    return true;
  });

  const alertsCount = notifications.filter(
    (n) => n.priority === 'URGENT' || n.priority === 'CRITICAL'
  ).length;

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const filters: { id: FilterType; label: string; count: number }[] = [
    { id: 'all',    label: 'All',    count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
    { id: 'alerts', label: 'Alerts', count: alertsCount },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">

      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a4a8a] dark:text-white flex items-center gap-2">
            <Icon name="notifications" className="text-[#1a4a8a] dark:text-blue-400 text-3xl" />
            Notifications
          </h1>
          <p className="text-blue-400 dark:text-slate-400 mt-1 text-sm">
            System alerts, task updates, and activity across your workspace.
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            {unreadCount} unread
          </span>
        )}
      </div>

      {/* Filter tabs + Mark all */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 p-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex gap-1">
            {filters.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === tab.id
                    ? 'bg-[#1a4a8a] text-white shadow-sm'
                    : 'text-blue-400 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-slate-800 hover:text-[#1a4a8a] dark:hover:text-white'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                    filter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 dark:bg-slate-700 text-blue-500 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-[#1a4a8a] dark:hover:text-white font-medium transition disabled:opacity-50"
            >
              <Icon name="done_all" className="text-base" />
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-blue-100 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin w-8 h-8 border-4 border-[#1a4a8a] border-t-transparent rounded-full" />
            <p className="text-blue-400 dark:text-slate-400 text-sm">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <Icon name="notifications_none" className="text-4xl text-blue-300 dark:text-slate-600" />
            </div>
            <p className="text-[#1a4a8a] dark:text-white font-semibold">
              {filter === 'unread' ? 'All caught up!' : filter === 'alerts' ? 'No active alerts' : 'No notifications yet'}
            </p>
            <p className="text-blue-400 dark:text-slate-400 text-sm mt-1">
              {filter === 'unread'
                ? "You've read all your notifications."
                : 'New activity will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-blue-50 dark:divide-slate-800">
            {filtered.map((notification) => {
              const config = typeConfig[notification.type] ?? {
                icon: 'notifications',
                color: 'text-blue-600 dark:text-blue-400',
                bg: 'bg-blue-100 dark:bg-blue-900/30',
              };
              const priority = priorityConfig[notification.priority] ?? priorityConfig.NORMAL;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleClick(notification)}
                  className={`flex items-start gap-4 p-4 cursor-pointer transition group ${
                    !notification.isRead
                      ? 'bg-blue-50/60 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-slate-800'
                      : 'hover:bg-gray-50/50 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {/* Unread indicator stripe */}
                  {!notification.isRead && (
                    <div className="absolute left-0 w-0.5 h-full bg-[#1a4a8a]" />
                  )}

                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.bg}`}>
                    <Icon name={config.icon} className={`text-xl ${config.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${
                        !notification.isRead
                          ? 'font-semibold text-[#1a4a8a] dark:text-white'
                          : 'font-medium text-slate-700 dark:text-slate-300'
                      }`}>
                        {notification.title}
                      </p>
                      <span className="text-xs text-blue-300 dark:text-slate-500 shrink-0 whitespace-nowrap">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-blue-400 dark:text-slate-400 mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      {/* Priority badge */}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${priority.className}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                        {priority.label}
                      </span>

                      {/* Unread dot */}
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}

                      {/* Link hint */}
                      {notification.link && (
                        <span className="text-xs text-blue-400 dark:text-slate-500 flex items-center gap-0.5">
                          <Icon name="open_in_new" className="text-xs" />
                          View
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark as read button */}
                  {!notification.isRead && (
                    <button
                      onClick={(e) => handleMarkAsRead(e, notification.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-blue-300 hover:bg-blue-100 dark:hover:bg-slate-700 hover:text-[#1a4a8a] dark:hover:text-white transition shrink-0 opacity-0 group-hover:opacity-100"
                      title="Mark as read"
                    >
                      <Icon name="check_circle" className="text-lg" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}