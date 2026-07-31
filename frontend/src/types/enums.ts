export const DocumentCategory = {
  LEGAL: 'LEGAL',
  PROJECT: 'PROJECT',
  MEETING: 'MEETING',
  FINANCIAL: 'FINANCIAL',
  POLICY: 'POLICY',
  EVIDENCE: 'EVIDENCE',
  ARCHIVE: 'ARCHIVE',
} as const;
export type DocumentCategory = typeof DocumentCategory[keyof typeof DocumentCategory];

export const AccessLevel = {
  PUBLIC: 'PUBLIC',
  BOTH_CITIES: 'BOTH_CITIES',
  OWN_CITY_ONLY: 'OWN_CITY_ONLY',
  DEPARTMENT_ONLY: 'DEPARTMENT_ONLY',
  ADMINS_ONLY: 'ADMINS_ONLY',
} as const;
export type AccessLevel = typeof AccessLevel[keyof typeof AccessLevel];

export const AccessLevelLabel: Record<AccessLevel, string> = {
  PUBLIC: 'Public',
  BOTH_CITIES: 'Both Cities',
  OWN_CITY_ONLY: 'My City Only',
  DEPARTMENT_ONLY: 'My Department Only',
  ADMINS_ONLY: 'Admins Only',
};

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