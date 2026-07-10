import { BadRequestException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationResponse, NotificationsWithCountResponse } from '../response/notifications.response';
import { Project } from 'src/projects/schema/projects.schema';
import { Message } from 'src/communication/schema/communication.schema';
import { Event } from 'src/events/schema/events.schema';
import {Notification} from '../schema/notifications.schema'; 
import { EventStatus, MessageStatus, ProjectStatus, Role } from 'src/common/enum/enum';
@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<Event>
  ) { }

  async getNotifications(currentUser: any): Promise<NotificationsWithCountResponse> {
    const notifications = await this.notificationModel
      .find({ recipient: new Types.ObjectId(currentUser.userId) })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return {
      notifications: notifications.map((n) => this.toNotificationResponse(n)),
      unreadCount,
    };
  }
  private toNotificationResponse(notification: any): NotificationResponse {
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
      .findByIdAndUpdate(id, { isRead: true, readAt: new Date() }, { new: true }).lean();
    return this.toNotificationResponse(updated);
  }
  async markAllAsRead(currentUser: any): Promise<{ message: string }> {
    await this.notificationModel.updateMany(
      {
        recipient: new Types.ObjectId(currentUser.userId),
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );

    return { message: 'All notifications marked as read' };
  }
  async getDashboard(currentUser: any): Promise<any> {
    // SUPER_ADMIN dashboard
    if (currentUser.role === Role.SUPER_ADMIN) {
      const [
        totalProjects,
        activeProjects,
        completedProjects,
        urgentMessages,
        upcomingEvents,
        unreadNotifications,
      ] = await Promise.all([
        this.projectModel.countDocuments(),
        this.projectModel.countDocuments({ status: ProjectStatus.IN_PROGRESS }),
        this.projectModel.countDocuments({ status: ProjectStatus.COMPLETED }),
        this.messageModel.countDocuments({
          status: { $in: [MessageStatus.SENT, MessageStatus.READ] },
          isEscalated: true,
        }),
        this.eventModel.countDocuments({ status: EventStatus.UPCOMING }),
        this.notificationModel.countDocuments({
          recipient: new Types.ObjectId(currentUser.userId),
          isRead: false,
        }),
      ]);
      return {
        role: currentUser.role,
        totalProjects,
        activeProjects,
        completedProjects,
        urgentMessages,
        upcomingEvents,
        unreadNotifications,
      };
    }
    // CITY_ADMIN dashboard
    if (currentUser.role === Role.CITY_ADMIN) {
      const [
        activeProjects,
        pendingProjects,
        urgentMessages,
        unreadMessages,
        upcomingEvents,
        unreadNotifications,
      ] = await Promise.all([
        this.projectModel.countDocuments({
          $or: [
            { proposedBy: currentUser.city },
            { 'adama.department': { $exists: true } },
            { 'aurora.department': { $exists: true } },
          ],
          status: ProjectStatus.IN_PROGRESS,
        }),
        this.projectModel.countDocuments({
          proposedBy: currentUser.city,
          status: ProjectStatus.PROPOSED,
        }),
        this.messageModel.countDocuments({
          'to.city': currentUser.city,
          isEscalated: true,
          status: { $in: [MessageStatus.SENT, MessageStatus.READ] },
        }),
        this.messageModel.countDocuments({
          'to.city': currentUser.city,
          status: MessageStatus.SENT,
        }),
        this.eventModel.countDocuments({
          $or: [
            { hostCity: currentUser.city },
            { organizerCity: currentUser.city },
          ],
          status: EventStatus.UPCOMING,
        }),
        this.notificationModel.countDocuments({
          recipient: new Types.ObjectId(currentUser.userId),
          isRead: false,
        }),
      ]);
      return {
        role: currentUser.role,
        city: currentUser.city,
        activeProjects,
        pendingProjects,
        urgentMessages,
        unreadMessages,
        upcomingEvents,
        unreadNotifications,
      };
    }
    // DEPT_OFFICER dashboard
    if (currentUser.role === Role.DEPT_OFFICER) {
      const [
        activeProjects,
        myTasks,
        upcomingEvents,
        unreadMessages,
        unreadNotifications,
      ] = await Promise.all([
        this.projectModel.countDocuments({
          $or: [
            { 'adama.department': currentUser.department },
            { 'aurora.department': currentUser.department },
          ],
          status: ProjectStatus.IN_PROGRESS,
        }),
        this.projectModel.countDocuments({
          tasks: {
            $elemMatch: {
              assignedTo: currentUser.userId,
              status: { $ne: 'DONE' },
            },
          },
        }),
        this.eventModel.countDocuments({
          $or: [
            { hostCity: currentUser.city },
            { organizerCity: currentUser.city },
          ],
          status: EventStatus.UPCOMING,
        }),
        this.messageModel.countDocuments({
          'to.city': currentUser.city,
          'to.department': currentUser.department,
          status: MessageStatus.SENT,
        }),
        this.notificationModel.countDocuments({
          recipient: new Types.ObjectId(currentUser.userId),
          isRead: false,
        }),
      ]);
      return {
        role: currentUser.role,
        city: currentUser.city,
        department: currentUser.department,
        activeProjects,
        myTasks,
        upcomingEvents,
        unreadMessages,
        unreadNotifications,
      };
    }
  }
}