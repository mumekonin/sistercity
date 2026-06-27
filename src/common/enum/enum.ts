export enum Role {
  SUPER_ADMIN = "SUPER_ADMIN",
  CITY_ADMIN = "CITY_ADMIN",
  DEPT_OFFICER = "DEPT_OFFICER"
}
export enum City {
  ADAMA = "ADAMA",
  AURORA = "AURORA",
}
export enum Department {
  CITY_ADMINISTRATION = "CITY_ADMINISTRATION",
  TRANSPORT = "TRANSPORT",
  URBAN_DEVELOPMENT = "URBAN_DEVELOPMENT",
  CONSTRUCTION = "CONSTRUCTION",
  WATER_SANITATION = "WATER_SANITATION",
  EDUCATION = "EDUCATION",
  HEALTH = "HEALTH",
  COMMUNICATION = "COMMUNICATION",
  ENVIRONMENT = "ENVIRONMENT",
  PARKS_AND_GREEN_SPACES = "PARKS_AND_GREEN_SPACES",
}
export enum ProjectStatus {
  PROPOSED    = 'PROPOSED',
  APPROVED    = 'APPROVED',
  REJECTED    = 'REJECTED',
  PLANNED     = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD     = 'ON_HOLD',
  DELAYED     = 'DELAYED',
  COMPLETED   = 'COMPLETED',
}

export enum Priority {
  HIGH   = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW    = 'LOW',
}

export enum MilestoneStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED   = 'COMPLETED',
  DELAYED     = 'DELAYED',
}

export enum TaskStatus {
  TODO        = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE        = 'DONE',
}

export enum TaskPriority {
  URGENT = 'URGENT',
  HIGH="HIGH",
  NORMAL = 'NORMAL',
  LOW    = 'LOW',
}

export enum IssueStatus {
  OPEN        = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED    = 'RESOLVED',
}

export enum IssueSeverity {
  CRITICAL = 'CRITICAL',
  MAJOR    = 'MAJOR',
  MINOR    = 'MINOR',
}

export enum Responsible {
  ADAMA  = 'ADAMA',
  SHEGER = 'SHEGER',
  BOTH   = 'BOTH'
}