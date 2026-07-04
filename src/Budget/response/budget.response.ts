import {City,ExpenditureCategory,ExpenditureStatus,EquipmentStatus} from '../../common/enum/enum';
export class ExpenditureResponse {
  id!: string;
  city!: City;
  category!: ExpenditureCategory;
  description!: string;
  amount!: number;
  date!: Date;
  receiptUrl!: string;
  recordedBy!: string;            
  status!: ExpenditureStatus;
  approvedBy!: string | null;     
  rejectionReason!: string | null;
  approvedAt!: Date | null;
}
export class BudgetResponse {
  id!: string;
  project!: string;               
  plannedAdama!: number;
  plannedAurora!: number;
  plannedTotal!: number;
  spentAdama!: number;
  spentAurora!: number;
  spentTotal!: number;
  remainingAdama!: number;      
  remainingAurora!: number;       
  remainingTotal!: number;      
  expenditures!: ExpenditureResponse[];
  createdAt!: Date;
  updatedAt!: Date;
}
export class BudgetSummaryResponse {
  projectId!: string;
  projectTitle!: string;          
  plannedTotal!: number;
  spentTotal!: number;
  remainingTotal!: number;
  percentageUsed!: number;        
  isOverBudget!: boolean;         
}
export class EquipmentResponse {
  id!: string;
  project!: string;              
  itemName!: string;
  description!: string;
  providedBy!: City;
  quantity!: number;
  estimatedValue!: number;
  providedDate!: Date;
  status!: EquipmentStatus;
  damagedNote!: string | null;
  returnedDate!: Date | null;
  recordedBy!: string;            
  createdAt!: Date;
  updatedAt!: Date;
}