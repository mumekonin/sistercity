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
export const Role = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CITY_ADMIN: 'CITY_ADMIN',
  DEPT_OFFICER: 'DEPT_OFFICER',
} as const;
export type Role = typeof Role[keyof typeof Role];

export const Department = {
  CITY_ADMINISTRATION: 'CITY_ADMINISTRATION',
  TRANSPORT: 'TRANSPORT',
  URBAN_DEVELOPMENT: 'URBAN_DEVELOPMENT',
  CONSTRUCTION: 'CONSTRUCTION',
  WATER_SANITATION: 'WATER_SANITATION',
  EDUCATION: 'EDUCATION',
  HEALTH: 'HEALTH',
  COMMUNICATION: 'COMMUNICATION',
  ENVIRONMENT: 'ENVIRONMENT',
  PARKS_AND_GREEN_SPACES: 'PARKS_AND_GREEN_SPACES',
} as const;
export type Department = typeof Department[keyof typeof Department];