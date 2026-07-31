import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  AccessLevel,
  City,
  DocumentApprovalStatus,
  DocumentCategory,
} from '../../common/enum/enum';
@Schema({ _id: false })
class PreviousVersion {
  @Prop({ required: true })
  fileUrl!: string;
  @Prop({ required: true })
  fileName!: string;
  @Prop({ required: true })
  versionNumber!: number;
  @Prop({ required: true })
  uploadedAt!: Date;
}
const PreviousVersionSchema = SchemaFactory.createForClass(PreviousVersion);
@Schema({ _id: false })
class ActivityLog {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  userId!: Types.ObjectId;
  @Prop({ required: true })
  action!: string;
  @Prop({ required: true, default: Date.now })
  timestamp!: Date;
}
const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
@Schema({ timestamps: true })
export class DocumentFile extends Document {
  @Prop({ required: true })
  title!: string;
  @Prop({ required: true, enum: DocumentCategory })
  category!: DocumentCategory;
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  uploadedBy!: Types.ObjectId;
  @Prop({ required: true, enum: City })
  city!: City;
  @Prop({ required: true })
  department!: string;
  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'Project' })
  relatedProject!: Types.ObjectId | null;
  @Prop({ required: true })
  documentDate!: Date;
  @Prop({ required: true })
  description!: string;
  @Prop({ required: true, enum: AccessLevel })
  accessLevel!: AccessLevel;
  @Prop({ required: true })
  fileUrl!: string;
  @Prop({ required: true })
  fileName!: string;
  @Prop({ required: true })
  fileType!: string;
  @Prop({ required: true })
  fileSize!: number;
  @Prop({ default: 1 })
  versionNumber!: number;
  @Prop({ type: [PreviousVersionSchema], default: [] })
  previousVersions!: PreviousVersion[];
  @Prop({
    required: true,
    enum: DocumentApprovalStatus,
    default: DocumentApprovalStatus.DRAFT,
  })
  approvalStatus!: DocumentApprovalStatus;
  @Prop({ default: null, type: SchemaTypes.ObjectId, ref: 'User' })
  approvedBy!: Types.ObjectId | null;
  @Prop({ default: null, type: String })
  approvalNote!: string | null;
  @Prop({ default: null, type: Date })
  expiryDate!: Date | null;
  @Prop({ default: false })
  isArchived!: boolean;
  @Prop({ type: [ActivityLogSchema], default: [] })
  activityLog!: ActivityLog[];
  createdAt!: Date;
  updatedAt!: Date;
}
export const DocumentFileSchema = SchemaFactory.createForClass(DocumentFile);
