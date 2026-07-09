import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { NotificationSchema, Notification } from "./schema/notifications.schema";
import { NotificationService } from "./service/notifications.service";
import { NotificationController } from "./controller/notifications.controller";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ])
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule { }