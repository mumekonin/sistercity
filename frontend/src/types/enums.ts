export const DocumentCategory = {
  AGREEMENT: 'AGREEMENT',
  FINANCIAL: 'FINANCIAL',
  REPORT: 'REPORT',
  MINUTES: 'MINUTES',
  LOGISTICS: 'LOGISTICS',
  LEGAL: 'LEGAL',
  TECHNICAL: 'TECHNICAL',
  OTHER: 'OTHER',
} as const;
export type DocumentCategory = typeof DocumentCategory[keyof typeof DocumentCategory];

export const AccessLevel = {
  BOTH_CITIES: 'BOTH_CITIES',
  CITY_ADMINS: 'CITY_ADMINS',
  DEPARTMENT: 'DEPARTMENT',
} as const;
export type AccessLevel = typeof AccessLevel[keyof typeof AccessLevel];

export const DocumentApprovalStatus = {
  DRAFT: 'DRAFT',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type DocumentApprovalStatus = typeof DocumentApprovalStatus[keyof typeof DocumentApprovalStatus];

export const City = {
  ADAMA: 'ADAMA',
  AURORA: 'AURORA',
} as const;
export type City = typeof City[keyof typeof City];