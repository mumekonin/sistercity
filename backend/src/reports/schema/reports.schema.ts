import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { ReportType, ReportCity } from '../../common/enum/enum';
@Schema({ timestamps: true })
export class Report extends Document {
  @Prop({ required: true, enum: ReportType })
  reportType!: ReportType;
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  generatedBy!: Types.ObjectId;
  @Prop({ required: true, enum: ReportCity })
  city!: ReportCity;
  @Prop({ required: true })
  dateFrom!: Date;
  @Prop({ required: true })
  dateTo!: Date;
  @Prop({ required: true, type: Object })
  data!: Record<string, any>;
  @Prop({ default: Date.now })
  generatedAt!: Date;
  createdAt!: Date;
  updatedAt!: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
