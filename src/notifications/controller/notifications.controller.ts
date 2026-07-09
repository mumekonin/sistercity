import { Controller, Get, Patch, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from '../service/notifications.service';
@Controller('/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }
  @Get('/')
  @UseGuards(AuthGuard('jwt'))
  async getNotifications(@Req() req: any) {
    return this.notificationService.getNotifications(req.user);
  }
  @Patch(':id/read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationService.markAsRead(id, req.user);
  }
}