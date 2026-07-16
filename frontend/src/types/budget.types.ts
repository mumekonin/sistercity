export const ExpenditureCategory = {
  PERSONNEL: 'PERSONNEL',
  EQUIPMENT: 'EQUIPMENT',
  MATERIALS: 'MATERIALS',
  TRAVEL: 'TRAVEL',
  SERVICES: 'SERVICES',
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  OTHER: 'OTHER',
} as const;
export type ExpenditureCategory = typeof ExpenditureCategory[keyof typeof ExpenditureCategory];

export const ExpenditureStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ExpenditureStatus = typeof ExpenditureStatus[keyof typeof ExpenditureStatus];

export const EquipmentStatus = {
  AVAILABLE: 'AVAILABLE',
  IN_USE: 'IN_USE',
  DAMAGED: 'DAMAGED',
  RETURNED: 'RETURNED',
  REPAIRED: 'REPAIRED',
} as const;
export type EquipmentStatus = typeof EquipmentStatus[keyof typeof EquipmentStatus];

export interface Expenditure {
  id: string;
  city: string;
  category: ExpenditureCategory;
  description: string;
  amount: number;
  date: Date;
  receiptUrl: string;
  recordedBy: string;
  status: ExpenditureStatus;
  approvedBy: string | null;
  rejectionReason: string | null;
  approvedAt: Date | null;
}

export interface Budget {
  id: string | null;
  project: string;
  plannedAdama: number;
  plannedAurora: number;
  plannedTotal: number;
  spentAdama: number;
  spentAurora: number;
  spentTotal: number;
  remainingAdama: number;
  remainingAurora: number;
  remainingTotal: number;
  expenditures: Expenditure[];
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface BudgetSummary {
  projectId: string;
  projectTitle: string;
  plannedTotal: number;
  spentTotal: number;
  remainingTotal: number;
  percentageUsed: number;
  isOverBudget: boolean;
}

export interface Equipment {
  id: string;
  project: string;
  itemName: string;
  description: string;
  providedBy: string;
  quantity: number;
  estimatedValue: number;
  providedDate: Date;
  status: EquipmentStatus;
  damagedNote: string | null;
  returnedDate: Date | null;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}