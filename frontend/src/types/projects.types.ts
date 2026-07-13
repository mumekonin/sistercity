export type ProjectStatus =
  | 'PROPOSED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'DELAYED'
  | 'COMPLETED';

export type Priority = 'HIGH' | 'MEDIUM' | 'LOW';
export type Responsible = 'ADAMA' | 'AURORA' | 'BOTH';
export type MilestoneStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'URGENT' | 'NORMAL' | 'LOW';
export type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type IssueSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface CityAssignment {
  department: string;
  focalPerson: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  deadline: string;
  responsible: Responsible;
  status: MilestoneStatus;
  completedAt: string | null;
  delayReason: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedCity: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  completedAt: string | null;
}

export interface Issue {
  id: string;
  description: string;
  severity: IssueSeverity;
  affectedCity: Responsible;
  raisedBy: string;
  raisedAt: string;
  status: IssueStatus;
  resolution: string | null;
  resolvedAt: string | null;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  expectedOutcome: string;
  proposedBy: string;
  proposedByUser: string;
  priority: Priority;
  status: ProjectStatus;
  rejectionReason: string | null;
  beneficiary: Responsible;
  adama: CityAssignment | null;
  aurora: CityAssignment | null;
  budgetAdama: number;
  budgetAurora: number;
  budgetTotal: number;
  startDate: string | null;
  endDate: string | null;
  actualStartDate: string | null;
  actualEndDate: string | null;
  progressPercent: number;
  milestones: Milestone[];
  tasks: Task[];
  issues: Issue[];
  completedBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectListItem {
  id: string;
  title: string;
  description: string;
  proposedBy: string;
  priority: Priority;
  status: ProjectStatus;
  beneficiary: Responsible;
  progressPercent: number;
  budgetTotal: number;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// ── DTOs ─────────────────────────────────────────────────────
export interface CreateProjectDto {
  title: string;
  description: string;
  expectedOutcome: string;
  priority: Priority;
  beneficiary: Responsible;
}

export interface UpdateProjectDto {
  action: 'approve' | 'reject' | 'assign' | 'plan' | 'update-status' | 'complete';
  rejectionReason?: string;
  department?: string;
  focalPerson?: string;
  budget?: number;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

export interface CreateMilestoneDto {
  title: string;
  description: string;
  deadline: string;
  responsible: Responsible;
}

export interface UpdateMilestoneDto {
  status: MilestoneStatus;
  delayReason?: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  assignedTo: string;
  priority: TaskPriority;
  dueDate: string;
}

export interface UpdateTaskDto {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
}

export interface CreateIssueDto {
  description: string;
  severity: IssueSeverity;
  affectedCity: Responsible;
}

export interface UpdateIssueDto {
  status: IssueStatus;
  resolution?: string;
}