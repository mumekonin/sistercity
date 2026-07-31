import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  NewsCategory,
  NewsApprovalStatus,
  NewsPostedByCity,
} from '../../common/enum/enum';

@Schema({ timestamps: true })
export class News extends Document {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true, enum: NewsCategory })
  category!: NewsCategory;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: [String], default: [] })
  images!: string[];

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  postedBy!: Types.ObjectId;

  @Prop({ required: true, enum: NewsPostedByCity })
  postedByCity!: NewsPostedByCity;

  @Prop({ required: true })
  isPublic!: boolean;

  @Prop({ default: false })
  isJoint!: boolean;

  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Project' })
  relatedProject!: Types.ObjectId | null;

  @Prop({
    required: true,
    enum: NewsApprovalStatus,
    default: NewsApprovalStatus.DRAFT,
  })
  approvalStatus!: NewsApprovalStatus;

  @Prop({ default: false })
  approvedByAdama!: boolean;

  @Prop({ default: false })
  approvedByAurora!: boolean;

  @Prop({ default: null, type: Date })
  publishedAt!: Date | null;

  @Prop({ default: 0 })
  views!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const NewsSchema = SchemaFactory.createForClass(News);
NewsSchema.index({ title: 'text', body: 'text' });
