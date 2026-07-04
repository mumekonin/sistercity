import { City, EventType, EventStatus } from '../../common/enum/enum';
export class AgendaItemResponse {
  title?: string;
  duration?: number | null;
}
export class MinutesResponse {
  summary?: string | null;
  decisions?: string[];
  confirmedByAdama?: boolean;
  confirmedByAurora?: boolean;
}
export class EventResponse {
  id?: string;
  title?: string;
  eventType?: EventType;
  hostCity?: City;
  venue?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
  description?: string;
  relatedProject?: string | null;
  organizer?: string;
  organizerCity?: City;
  agenda?: AgendaItemResponse[];
  status?: EventStatus;
  minutes?: MinutesResponse;
  createdAt?: Date;
  updatedAt?: Date;
}
export class EventListResponse {
  id?: string;
  title?: string;
  eventType?: EventType;
  hostCity?: City;
  venue?: string;
  startDate?: Date;
  endDate?: Date;
  isPublic?: boolean;
  status?: EventStatus;
  organizerCity?: City;
  createdAt?: Date;
}