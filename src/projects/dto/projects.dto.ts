import { IsString,IsNotEmpty,IsEnum,IsOptional,IsNumber,IsDate,IsMongoId,IsArray,ValidateNested,Min,IsIn,} from 'class-validator';
import { Type } from 'class-transformer';
import {City,Priority,MilestoneStatus,TaskStatus,TaskPriority,IssueStatus,IssueSeverity,Responsible,ProjectStatus,} from '../../common/enum/enum';

export class CreateProjectDto {

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  expectedOutcome!: string;

  @IsEnum(Priority)
  @IsNotEmpty()
  priority!: Priority;

  @IsEnum(Responsible)
  @IsNotEmpty()
  beneficiary!: Responsible;   
}

export class ApproveProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['approve'])
  action!: 'approve';
}

export class RejectProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['reject'])
  action!: 'reject';

  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;   
}

export class AssignProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['assign'])
  action!: 'assign';

  @IsString()
  @IsNotEmpty()
  department!: string;        

  @IsMongoId()
  @IsNotEmpty()
  focalPerson!: string;     
}

export class PlanProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['plan'])
  action!: 'plan';

  @IsNumber()
  @Min(0)
  budget!: number;          

  @IsDate()
  @Type(() => Date)
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  endDate!: Date;
}

export class UpdateProjectStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['update-status'])
  action!: 'update-status';

  @IsEnum(ProjectStatus)
  @IsNotEmpty()
  status!: ProjectStatus;     
}

export class UpdateProjectDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['approve', 'reject', 'assign', 'plan', 'update-status'])
  action!: 'approve' | 'reject' | 'assign' | 'plan' | 'update-status';

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsMongoId()
  focalPerson?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class CreateMilestoneDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsDate()
  @Type(() => Date)
  deadline!: Date;

  @IsEnum(Responsible)
  @IsNotEmpty()
  responsible!: Responsible;  
}

export class UpdateMilestoneDto {
  @IsEnum(MilestoneStatus)
  @IsNotEmpty()
  status!: MilestoneStatus;

  @IsOptional()
  @IsString()
  delayReason?: string;
}

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsMongoId()
  @IsNotEmpty()
  assignedTo!: string;       

  @IsEnum(City)
  @IsNotEmpty()
  assignedCity!: City;        

  @IsEnum(TaskPriority)
  @IsNotEmpty()
  priority!: TaskPriority;

  @IsDate()
  @Type(() => Date)
  dueDate!: Date;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;      

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dueDate?: Date;
}

export class CreateIssueDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(IssueSeverity)
  @IsNotEmpty()
  severity!: IssueSeverity;   

  @IsEnum(Responsible)
  @IsNotEmpty()
  affectedCity!: Responsible; 
}
export class UpdateIssueDto {
  @IsEnum(IssueStatus)
  @IsNotEmpty()
  status!: IssueStatus;   

  @IsOptional()
  @IsString()
  resolution?: string;
}