import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { City, EventType, EventStatus, RsvpStatus} from '../../common/enum/enum';
@Schema({ _id: false })
class AgendaItem {
  @Prop({ required: true })
  title!: string;

  @Prop({ default: null, type: Number })
  duration!: number | null;

  @Prop({ required: true, enum: City })
  proposedBy!: City;

  @Prop({ default: false })
  isApproved!: boolean;
}

@Schema({ _id: false })
class Invitee {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;

  @Prop({ required: true, enum: RsvpStatus, default: RsvpStatus.PENDING })
  rsvp!: RsvpStatus;

  @Prop({ default: null, type: String })
  declineReason!: string | null;
}

@Schema({ _id: false })
class ActionItem {
  @Prop({ required: true })
  task!: string;

  @Prop({ required: true, enum: City })
  responsibleCity!: City;

  @Prop({ required: true })
  dueDate!: Date;
}

@Schema({ _id: false })
class Minutes {
  @Prop({ default: null, type: String })
  summary!: string | null;

  @Prop({ type: [String], default: [] })
  decisions!: string[];

  @Prop({ type: [ActionItem], default: [] })
  actionItems!: ActionItem[];

  @Prop({ default: false })
  confirmedByAdama!: boolean;

  @Prop({ default: false })
  confirmedByAurora!: boolean;
}
@Schema({ timestamps: true })
export class Event extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, enum: EventType })
  eventType!: EventType;

  @Prop({ required: true, enum: City })
  hostCity!: City;

  @Prop({ required: true })
  venue!: string;

  @Prop({ required: true })
  startDate!: Date;

  @Prop({ required: true })
  endDate!: Date;

  @Prop({ required: true })
  isPublic!: boolean;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: null, type: Types.ObjectId, ref: 'Project' })
  relatedProject!: Types.ObjectId | null;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  organizer!: Types.ObjectId;

  @Prop({ required: true, enum: City })
  organizerCity!: City;

  @Prop({ type: [AgendaItem], default: [] })
  agenda!: AgendaItem[];

  @Prop({ type: [Invitee], default: [] })
  invitees!: Invitee[];
  @Prop({ type: [String], default: [] })
  attendedUserIds!: string[];

  @Prop({ required: true, enum: EventStatus, default: EventStatus.UPCOMING })
  status!: EventStatus;

  @Prop({ type: Minutes, default: {} })
  minutes!: Minutes;

  createdAt!: Date;
  updatedAt!: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);