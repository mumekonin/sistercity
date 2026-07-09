import { NotificationPriority, NotificationType } from "src/common/enum/enum";

export class CreateNotificationInternalDto {
  recipient!: string;
  type!: NotificationType;
  title!: string;
  body!: string;
  link!: string;
  priority!: NotificationPriority;
}