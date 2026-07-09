import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../service/notifications.service';
import { NotificationsWithCountResponse } from '../response/notifications.response';
@Controller('/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getNotifications( @Req() req: any): Promise<NotificationsWithCountResponse> {
    return this.notificationService.getNotifications(req.user);
  }
}