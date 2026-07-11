import { NotificationType, NotificationPriority } from '../../common/enum/enum';
export class NotificationResponse {
  id?: string;
  recipient?: string;
  type?: NotificationType;
  title?: string;
  body?: string;
  link?: string;
  priority?: NotificationPriority;
  isRead?: boolean;
  readAt?: Date | null;
  createdAt?: Date;
}
export class NotificationsWithCountResponse {
  notifications?: NotificationResponse[];
  unreadCount?: number;
}