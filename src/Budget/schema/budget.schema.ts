import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { City, ExpenditureStatus, ExpenditureCategory } from '../../common/enum/enum';
@Schema({ _id: true })
class Expenditure {
  @Prop({ required: true, enum: City })
  city!: City;
  @Prop({ required: true, enum: ExpenditureCategory })
  category!: ExpenditureCategory;
  @Prop({ required: true })
  description!: string;
  @Prop({ required: true })
  amount!: number;
  @Prop({ required: true })
  date!: Date;
  @Prop({ required: true })
  receiptUrl!: string;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  recordedBy!: Types.ObjectId;
  @Prop({ required: true, enum: ExpenditureStatus, default: ExpenditureStatus.PENDING })
  status!: ExpenditureStatus;
  @Prop({ default: null, type: Types.ObjectId, ref: 'User' })
  approvedBy!: Types.ObjectId | null;
  @Prop({ default: null, type: String })
  rejectionReason!: string | null;
  @Prop({ default: null, type: Date })
  approvedAt!: Date | null;
}
const ExpenditureSchema = SchemaFactory.createForClass(Expenditure);

@Schema({ timestamps: true })
export class Budget extends Document {

  @Prop({ required: true, type: Types.ObjectId, ref: 'Project', unique: true })
  project!: Types.ObjectId;
  @Prop({ default: 0 })
  spentAdama!: number;
  @Prop({ default: 0 })
  spentAurora!: number;
  @Prop({ default: 0 })
  spentTotal!: number;
  @Prop({ type: [ExpenditureSchema], default: [] })
  expenditures!: Expenditure[];
  createdAt!: Date;
  updatedAt!: Date;
}

export const BudgetSchema = SchemaFactory.createForClass(Budget);