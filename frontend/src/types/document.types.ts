import type { DocumentCategory, AccessLevel, DocumentApprovalStatus, City } from './enums';

export interface PreviousVersion {
  fileUrl: string;
  fileName: string;
  versionNumber: number;
  uploadedAt: Date;
  changeNote: string | null;
}

export interface ActivityLog {
  userId: string;
  action: string;
  timestamp: Date;
}

export interface DocumentFile {
  id: string;
  title: string;
  category: DocumentCategory;
  uploadedBy: string;
  city: City;
  department: string;
  relatedProject: string | null;
  documentDate: Date;
  description: string;
  accessLevel: AccessLevel;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  versionNumber: number;
  previousVersions: PreviousVersion[];
  approvalStatus: DocumentApprovalStatus;
  approvedBy: string | null;
  approvalNote: string | null;
  expiryDate: Date | null;
  isArchived: boolean;
  activityLog: ActivityLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentListItem {
  id: string;
  title: string;
  category: DocumentCategory;
  uploadedBy: string;
  city: City;
  department: string;
  relatedProject: string | null;
  documentDate: Date;
  description: string;
  accessLevel: AccessLevel;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  versionNumber: number;
  approvalStatus: DocumentApprovalStatus;
  expiryDate: Date | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}