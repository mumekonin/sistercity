import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { City, EventType, EventStatus } from '../../common/enum/enum';
@Schema({ _id: false })
class AgendaItem {
  @Prop({ required: true })
  title!: string;
  @Prop({ default: null, type: Number })
  duration!: number | null;
}

@Schema({ _id: false })
class Minutes {
  @Prop({ default: null, type: String })
  summary!: string | null;

  @Prop({ type: [String], default: [] })
  decisions!: string[];

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

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Project' })
  relatedProject!: Types.ObjectId | null;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  organizer!: Types.ObjectId;

  @Prop({ required: true, enum: City })
  organizerCity!: City;

  @Prop({ type: [AgendaItem], default: [] })
  agenda!: AgendaItem[];

  @Prop({ required: true, enum: EventStatus, default: EventStatus.UPCOMING })
  status!: EventStatus;

  @Prop({ type: Minutes, default: {} })
  minutes!: Minutes;

  createdAt!: Date;
  updatedAt!: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);
EventSchema.index({ title: 'text', description: 'text' });
