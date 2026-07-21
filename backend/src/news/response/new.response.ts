import {
  NewsCategory,
  NewsApprovalStatus,
  NewsPostedByCity,
} from '../../common/enum/enum';
export class NewsResponse {
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
export class NewsListResponse {
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
