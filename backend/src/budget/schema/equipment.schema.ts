import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { City, EquipmentStatus } from '../../common/enum/enum';

@Schema({ timestamps: true })
export class Equipment extends Document {
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Project' })
  project!: Types.ObjectId;
  @Prop({ required: true })
  itemName!: string;
  @Prop({ required: true })
  description!: string;
  @Prop({ required: true, enum: City })
  providedBy!: City;
  @Prop({ required: true })
  quantity!: number;
  @Prop({ required: true })
  estimatedValue!: number;
  @Prop({ required: true })
  providedDate!: Date;
  @Prop({
    required: true,
    enum: EquipmentStatus,
    default: EquipmentStatus.AVAILABLE,
  })
  status!: EquipmentStatus;
  @Prop({ default: null, type: String })
  damagedNote!: string | null;
  @Prop({ default: null, type: Date })
  returnedDate!: Date | null;
  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'User' })
  recordedBy!: Types.ObjectId;
  createdAt!: Date;
  updatedAt!: Date;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);
