import {
  City,
  Priority,
  ProjectStatus,
  MilestoneStatus,
  TaskStatus,
  TaskPriority,
  IssueStatus,
  IssueSeverity,
  Responsible,
} from '../../common/enum/enum';

export interface MilestoneResponse {
  id: string;
  title: string;
  description: string;
  deadline: Date;
  responsible: Responsible;
  status: MilestoneStatus;
  completedAt: Date | null;
  delayReason: string | null;
}

export interface TaskResponse {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedCity: City;
  priority: TaskPriority;
  dueDate: Date;
  status: TaskStatus;
  completedAt: Date | null;
}

export interface IssueResponse {
  id: string;
  description: string;
  severity: IssueSeverity;
  affectedCity: Responsible;
  raisedBy: string;
  raisedAt: Date;
  status: IssueStatus;
  resolution: string | null;
  resolvedAt: Date | null;
}

export interface CityAssignmentResponse {
  department: string;
  focalPerson: string;
}

export interface ProjectResponse {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  proposedBy: City;
  proposedByUser: string;
  priority: Priority;
  status: ProjectStatus;
  rejectionReason: string | null;
  beneficiary: Responsible;
  adama: CityAssignmentResponse | null;
  aurora: CityAssignmentResponse | null;
  budgetAdama: number;
  budgetAurora: number;
  /** Whether each city has submitted its plan; a planned budget may legitimately be 0. */
  adamaPlanned: boolean;
  auroraPlanned: boolean;
  budgetTotal: number;
  startDate: Date | null;
  endDate: Date | null;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  progressPercent: number;
  milestones: MilestoneResponse[];
  tasks: TaskResponse[];
  issues: IssueResponse[];
  completedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}
export interface ProjectListResponse {
  id: string;
  title: string;
  description: string;
  proposedBy: City;
  priority: Priority;
  status: ProjectStatus;
  beneficiary: Responsible;
  progressPercent: number;
  budgetTotal: number;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
}
