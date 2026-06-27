import { DocumentCategory, AccessLevel, DocumentApprovalStatus, City } from '../../common/enum/enum';
export class PreviousVersionResponse {
  fileUrl!: string;
  fileName!: string;
  versionNumber!: number;
  uploadedAt!: Date;
  changeNote!: string | null;
}
export class ActivityLogResponse {
  userId!: string;
  action!: string;
  timestamp!: Date;
}
export class DocumentResponse {
  id!: string;
  title!: string;
  category!: DocumentCategory;
  uploadedBy!: string;
  city!: City;
  department!: string;
  relatedProject!: string | null;
  documentDate!: Date;
  description!: string;
  accessLevel!: AccessLevel;
  fileUrl!: string;
  fileName!: string;
  fileType!: string;
  fileSize!: number;
  versionNumber!: number;
  previousVersions!: PreviousVersionResponse[];
  approvalStatus!: DocumentApprovalStatus;
  approvedBy!: string | null;
  approvalNote!: string | null;
  expiryDate!: Date | null;
  isArchived!: boolean;
  activityLog!: ActivityLogResponse[];
  createdAt!: Date;
  updatedAt!: Date;
}
export class DocumentListResponse {
  id!: string;
  title!: string;
  category!: DocumentCategory;
  uploadedBy!: string;
  city!: City;
  department!: string;
  relatedProject!: string | null;
  documentDate!: Date;
  description!: string;
  accessLevel!: AccessLevel;
  fileUrl!: string;
  fileName!: string;
  fileType!: string;
  fileSize!: number;
  versionNumber!: number;
  approvalStatus!: DocumentApprovalStatus;
  expiryDate!: Date | null;
  isArchived!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}