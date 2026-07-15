export const EventType = {
  WORKSHOP:          'WORKSHOP',
  OFFICIAL_VISIT:    'OFFICIAL_VISIT',
  CULTURAL_EXCHANGE: 'CULTURAL_EXCHANGE',
  INVESTMENT_FORUM:  'INVESTMENT_FORUM',
  COMMITTEE_MEETING: 'COMMITTEE_MEETING',
  TRAINING:          'TRAINING',
  CEREMONY:          'CEREMONY',
} as const;
export type EventType = typeof EventType[keyof typeof EventType];

export const EventStatus = {
  UPCOMING:  'UPCOMING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type EventStatus = typeof EventStatus[keyof typeof EventStatus];

export interface AgendaItem {
  title: string;
  duration?: number | null;
}

export interface Minutes {
  summary?: string | null;
  decisions?: string[];
  confirmedByAdama?: boolean;
  confirmedByAurora?: boolean;
}

export interface Event {
  id: string;
  title: string;
  eventType: EventType;
  hostCity: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  description: string;
  relatedProject?: string | null;
  organizer: string;
  organizerCity: string;
  agenda: AgendaItem[];
  status: EventStatus;
  minutes: Minutes;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventListItem {
  id: string;
  title: string;
  eventType: EventType;
  hostCity: string;
  venue: string;
  startDate: Date;
  endDate: Date;
  isPublic: boolean;
  status: EventStatus;
  organizerCity: string;
  createdAt: Date;
}