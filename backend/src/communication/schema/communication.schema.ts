import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { City, MessageType, MessagePriority, MessageStatus } from '../../common/enum/enum';
@Schema({ _id: false })
class MessageFrom {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;
  @Prop({ required: true, enum: City })
  city!: City;
  @Prop({ required: true })
  department!: string;
  @Prop({ required: true })
  name!: string;
}

@Schema({ _id: false })
class MessageTo {
  @Prop({ required: true, enum: City })
  city!: City;
  @Prop({ required: true })
  department!: string;
  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId | null;
}

@Schema({ _id: false })
class Attachment {
  @Prop({ required: false, default: null, type: Types.ObjectId, ref: 'Document' })
  documentId!: Types.ObjectId | null;
  @Prop({ required: true })
  fileName!: string;
  @Prop({ required: true })
  fileUrl!: string;
}

@Schema({ timestamps: true })
export class Message extends Document {
  @Prop({ required: true, unique: true })
  referenceNumber!: string;
  @Prop({ default: null, type: Types.ObjectId, ref: 'Message' })
  threadId!: Types.ObjectId | null;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Message' })
  parentId!: Types.ObjectId | null;
  @Prop({ required: true, type: MessageFrom })
  from!: MessageFrom;

  @Prop({ required: true, type: MessageTo })
  to!: MessageTo;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true, enum: MessageType })
  messageType!: MessageType;

  @Prop({ required: true, enum: MessagePriority })
  priority!: MessagePriority;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: [Attachment], default: [] })
  attachments!: Attachment[];

  @Prop({ default: null, type: Types.ObjectId, ref: 'Project' })
  relatedProject!: Types.ObjectId | null;

  @Prop({ required: true, enum: MessageStatus, default: MessageStatus.SENT })
  status!: MessageStatus;

  @Prop({ default: null, type: Date })
  readAt!: Date | null;
  @Prop({ required: true })
  responseDeadline!: Date;

  @Prop({ default: false })
  isEscalated!: boolean;

  @Prop({ default: false })  
  isArchived!: boolean;
  
  createdAt!: Date;
  updatedAt!: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({ subject: 'text', body: 'text' });