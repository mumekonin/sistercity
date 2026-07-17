export const NotificationType = {
  MESSAGE_RECEIVED:  'MESSAGE_RECEIVED',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  MILESTONE_DELAYED: 'MILESTONE_DELAYED',
  TASK_DUE:          'TASK_DUE',
  EVENT_REMINDER:    'EVENT_REMINDER',
  BUDGET_ALERT:      'BUDGET_ALERT',
  PROJECT_APPROVED:  'PROJECT_APPROVED',
  PROJECT_REJECTED:  'PROJECT_REJECTED',
  ESCALATION:        'ESCALATION',
} as const;
export type NotificationType = typeof NotificationType[keyof typeof NotificationType];

export const NotificationPriority = {
  NORMAL:   'NORMAL',
  URGENT:   'URGENT',
  CRITICAL: 'CRITICAL',
} as const;
export type NotificationPriority = typeof NotificationPriority[keyof typeof NotificationPriority];

export interface Notification {
  id: string;
  recipient: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  priority: NotificationPriority;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface SearchResults {
  projects: SearchItem[];
  messages: SearchItem[];
  events: SearchItem[];
  news: SearchItem[];
}

export interface SearchItem {
  id: string;
  title?: string;
  subject?: string;
  description?: string;
  status?: string;
  link: string;
  [key: string]: any;
}

export interface DashboardStats {
  role: string;
  city?: string;
  department?: string;
  
  totalProjects?: number;
  activeProjects?: number;
  completedProjects?: number;
  pendingProjects?: number;
  
  urgentMessages?: number;
  unreadMessages?: number;
  
  upcomingEvents?: number;
  unreadNotifications?: number;
  
  myTasks?: number;
}