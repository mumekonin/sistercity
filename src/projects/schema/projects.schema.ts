import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {City,MilestoneStatus,Responsible, TaskPriority, TaskStatus, IssueSeverity, IssueStatus,  Priority,  ProjectStatus,} from '../../common/enum/enum';

@Schema({ _id: true })
class Milestone {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  deadline!: Date;

  @Prop({ required: true, enum: Responsible })
  responsible!: Responsible;

  @Prop({ required: true, enum: MilestoneStatus, default: MilestoneStatus.NOT_STARTED })
  status!: MilestoneStatus;

  @Prop({ default: null, type: Date })
  completedAt!: Date | null;

  @Prop({ default: null, type: String })
  delayReason!: string | null;
}
const MilestoneSchema = SchemaFactory.createForClass(Milestone); 

@Schema({ _id: true })
class Task {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  assignedTo!: Types.ObjectId;

  @Prop({ required: true, enum: City })
  assignedCity!: City;

  @Prop({ required: true, enum: TaskPriority })
  priority!: TaskPriority;

  @Prop({ required: true })
  dueDate!: Date;

  @Prop({ required: true, enum: TaskStatus, default: TaskStatus.TODO })
  status!: TaskStatus;

  @Prop({ default: null, type: Date })
  completedAt!: Date | null;
}
const TaskSchema = SchemaFactory.createForClass(Task); 

@Schema({ _id: true })
class Issue {
  @Prop({ required: true })
  description!: string;

  @Prop({ required: true, enum: IssueSeverity })
  severity!: IssueSeverity;

  @Prop({ required: true, enum: Responsible })
  affectedCity!: Responsible;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  raisedBy!: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  raisedAt!: Date;

  @Prop({ required: true, enum: IssueStatus, default: IssueStatus.OPEN })
  status!: IssueStatus;

  @Prop({ default: null, type: String })
  resolution!: string | null;

  @Prop({ default: null, type: Date })
  resolvedAt!: Date | null;
}
const IssueSchema = SchemaFactory.createForClass(Issue);

@Schema({ _id: false })
class CityAssignment {
  @Prop({ required: true })
  department!: string;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  focalPerson!: Types.ObjectId;
}
const CityAssignmentSchema = SchemaFactory.createForClass(CityAssignment);

@Schema({ timestamps: true })
export class Project extends Document {

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ required: true })
  expectedOutcome!: string;

  @Prop({ required: true, enum: City })
  proposedBy!: City;

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  proposedByUser!: Types.ObjectId;

  @Prop({ required: true, enum: Priority })
  priority!: Priority;

  @Prop({ required: true, enum: ProjectStatus, default: ProjectStatus.PROPOSED })
  status!: ProjectStatus;

  @Prop({ default: null, type: String })
  rejectionReason!: string | null;

  @Prop({ required: true, enum: Responsible })
  beneficiary!: Responsible;

  @Prop({ default: null, type: CityAssignmentSchema })  
  adama!: CityAssignment | null;

  @Prop({ default: null, type: CityAssignmentSchema })  
  aurora!: CityAssignment | null;                       
  @Prop({ default: 0 })
  budgetAdama!: number;

  @Prop({ default: 0 })
  budgetAurora!: number;                                

  @Prop({ default: 0 })
  budgetTotal!: number;

  @Prop({ default: null, type: Date })
  startDate!: Date | null;

  @Prop({ default: null, type: Date })
  endDate!: Date | null;

  @Prop({ default: null, type: Date })
  actualStartDate!: Date | null;

  @Prop({ default: null, type: Date })
  actualEndDate!: Date | null;

  @Prop({ default: 0 })
  progressPercent!: number;

  @Prop({ type: [MilestoneSchema], default: [] })       
  milestones!: Milestone[];

  @Prop({ type: [TaskSchema], default: [] })           
  tasks!: Task[];

  @Prop({ type: [IssueSchema], default: [] })          
  issues!: Issue[];

  @Prop({ type: [String], default: [] })
  completedBy!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);