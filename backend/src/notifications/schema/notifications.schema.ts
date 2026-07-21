import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType, NotificationPriority } from '../../common/enum/enum';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  recipient!: Types.ObjectId;
  @Prop({ required: true, enum: NotificationType })
  type!: NotificationType;
  @Prop({ required: true })
  title!: string;
  @Prop({ required: true })
  body!: string;
  @Prop({ required: true })
  link!: string;
  @Prop({
    required: true,
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority!: NotificationPriority;
  @Prop({ default: false })
  isRead!: boolean;
  @Prop({ default: null, type: Date })
  readAt!: Date | null;
  createdAt!: Date;
  updatedAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
