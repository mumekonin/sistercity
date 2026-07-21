import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NotificationSchema,
  Notification,
} from './schema/notifications.schema';
import { NotificationService } from './service/notifications.service';
import { NotificationController } from './controller/notifications.controller';
import { ProjectSchema, Project } from 'src/projects/schema/projects.schema';
import {
  MessageSchema,
  Message,
} from 'src/communication/schema/communication.schema';
import { EventSchema, Event } from 'src/events/schema/events.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
