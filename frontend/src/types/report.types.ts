export const ReportType = {
  PARTNERSHIP_PROGRESS: 'PARTNERSHIP_PROGRESS',
  PROJECT_COMPLETION: 'PROJECT_COMPLETION',
  COMMUNICATION_ACTIVITY: 'COMMUNICATION_ACTIVITY',
  BUDGET_UTILIZATION: 'BUDGET_UTILIZATION',
  DOCUMENT_ACTIVITY: 'DOCUMENT_ACTIVITY',
} as const;
export type ReportType = typeof ReportType[keyof typeof ReportType];
export const ReportCity = {
  ADAMA: 'ADAMA',
  AURORA: 'AURORA',
  BOTH: 'BOTH',
} as const;
export type ReportCity = typeof ReportCity[keyof typeof ReportCity];

export interface CreateReportRequest {
  reportType: ReportType;
  city: ReportCity;
  dateFrom: string; 
  dateTo: string; 
}
export interface PartnershipProgressData {
  totalProjects: number;
  byStatus: {
    proposed: number;
    approved: number;
    planned: number;
    inProgress: number;
    onHold: number;
    delayed: number;
    completed: number;
    rejected: number;
  };
  projects: Array<{
    id: string;
    title: string;
    status: string;
    progressPercent: number;
    proposedBy: string;
    startDate: string;
    endDate: string;
  }>;
}

export interface ProjectCompletionData {
  totalProjects: number;
  totalCompleted: number;
  completionRate: number;
  projects: Array<{
    id: string;
    title: string;
    plannedEnd: string;
    status: string;
  }>;
}

export interface CommunicationActivityData {
  totalMessages: number;
  sent: number;
  received: number;
  overdue: number;
  avgResponseDays: number;
  byType: Record<string, number>;
}

export interface BudgetUtilizationData {
  totalPlanned: number;
  totalSpent: number;
  remaining: number;
  percentageUsed: number;
  isOverBudget: boolean;
  byProject: Array<{
    projectId: string;
    projectTitle: string;
    planned: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
    isOverBudget: boolean;
  }>;
}

export interface DocumentActivityData {
  totalDocuments: number;
  byStatus: { draft: number; approved: number; rejected: number };
  byCategory: Record<string, number>;
}

export type ReportData =
  | PartnershipProgressData
  | ProjectCompletionData
  | CommunicationActivityData
  | BudgetUtilizationData
  | DocumentActivityData
  | Record<string, any>;

export interface ReportListItem {
  id: string;
  reportType: ReportType;
  generatedBy: string;
  city: ReportCity;
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  createdAt: string;
}
export interface ReportDetail extends ReportListItem {
  data: ReportData;
}
