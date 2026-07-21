import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../service/notifications.service';
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}
  @Get('/notifications')
  @UseGuards(AuthGuard('jwt'))
  async getNotifications(@Req() req: any) {
    return this.notificationService.getNotifications(req.user);
  }
  @Patch('/notifications/read-all')
  @UseGuards(AuthGuard('jwt'))
  async markAllAsRead(@Req() req: any) {
    return this.notificationService.markAllAsRead(req.user);
  }
  @Patch('/notifications/:id/read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationService.markAsRead(id, req.user);
  }
  @Get('/dashboard')
  @UseGuards(AuthGuard('jwt'))
  async getDashboard(@Req() req: any) {
    return this.notificationService.getDashboard(req.user);
  }
}
