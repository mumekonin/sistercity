export const NewsCategory = {
  ACHIEVEMENT: 'ACHIEVEMENT',
  NEW_AGREEMENT: 'NEW_AGREEMENT',
  PROJECT_UPDATE: 'PROJECT_UPDATE',
  EVENT_ANNOUNCEMENT: 'EVENT_ANNOUNCEMENT',
  JOINT_STATEMENT: 'JOINT_STATEMENT',
  CULTURAL_HIGHLIGHT: 'CULTURAL_HIGHLIGHT',
} as const;
export type NewsCategory = typeof NewsCategory[keyof typeof NewsCategory];

export const NewsApprovalStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type NewsApprovalStatus = typeof NewsApprovalStatus[keyof typeof NewsApprovalStatus];

export const NewsPostedByCity = {
  ADAMA: 'ADAMA',
  AURORA: 'AURORA',
  JOINT: 'JOINT',
} as const;
export type NewsPostedByCity = typeof NewsPostedByCity[keyof typeof NewsPostedByCity];

export interface NewsListItem {
  id?: string;
  title?: string;
  category?: NewsCategory;
  postedByCity?: NewsPostedByCity;
  isPublic?: boolean;
  isJoint?: boolean;
  approvalStatus?: NewsApprovalStatus;
  publishedAt?: Date | null;
  views?: number;
  createdAt?: Date;
}

export interface News {
  id?: string;
  title?: string;
  category?: NewsCategory;
  body?: string;
  images?: string[];
  postedBy?: string;
  postedByCity?: NewsPostedByCity;
  isPublic?: boolean;
  isJoint?: boolean;
  relatedProject?: string | null;
  approvalStatus?: NewsApprovalStatus;
  approvedByAdama?: boolean;
  approvedByAurora?: boolean;
  publishedAt?: Date | null;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
}