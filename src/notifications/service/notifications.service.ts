import { BadRequestException, Injectable, NotFoundException,ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationResponse, NotificationsWithCountResponse } from '../response/notifications.response';
@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
  ) {}

  async getNotifications(currentUser: any): Promise<NotificationsWithCountResponse> {
    const notifications = await this.notificationModel
      .find({ recipient: new Types.ObjectId(currentUser.userId) })
      .sort({ createdAt: -1 }) 
      .lean();

    const unreadCount = notifications.filter((n:any) => !n.isRead).length;

    return {
      notifications: notifications.map((n) => this.toNotificationResponse(n)),
      unreadCount,
    };
  }
  private toNotificationResponse(notification: any): NotificationResponse{
    return {
      id: notification._id.toString(),
      recipient: notification.recipient?.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      priority: notification.priority,
      isRead: notification.isRead,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    };
  }
 async markAsRead(id: string, currentUser: any): Promise<NotificationResponse> {
  const notification = await this.notificationModel.findById(id).lean();
  if (!notification) throw new NotFoundException('Notification not found');
  // only recipient can mark as read
  if ((notification as any).recipient.toString() !== currentUser.userId) {
    throw new ForbiddenException('You can only mark your own notifications as read');
  }
  // already read
  if ((notification as any).isRead) {
    throw new BadRequestException('Notification is already marked as read');
  }
  const updated = await this.notificationModel
    .findByIdAndUpdate(id,{ isRead: true, readAt: new Date() },{ new: true }).lean();
  return this.toNotificationResponse(updated);
}
}