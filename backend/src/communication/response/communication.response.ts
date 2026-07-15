import { City, MessageType, MessagePriority, MessageStatus, } from '../../common/enum/enum';
export class MessageFromResponse {
  userId?: string;
  city?: City;
  department?: string;
  name?: string;
}
export class MessageToResponse {
  city?: City;
  department?: string;
  userId?: string | null;
}

export class AttachmentResponse {
  documentId?: string;
  fileName?: string;
  fileUrl?: string;
}
export class ThreadItemResponse {
  id?: string;
  referenceNumber?: string;
  from?: MessageFromResponse;
  to?: MessageToResponse;
  body?: string;
  attachments?: AttachmentResponse[];
  createdAt?: Date;
}

export class MessageResponse {
  id?: string;
  referenceNumber?: string;
  threadId?: string | null;
  parentId?: string | null;
  from?: MessageFromResponse;
  to?: MessageToResponse;
  subject?: string;
  messageType?: MessageType;
  priority?: MessagePriority;
  body?: string;
  attachments?: AttachmentResponse[];
  relatedProject?: string | null;
  status?: MessageStatus;
  readAt?: Date | null;
  responseDeadline?: Date;
  isEscalated?: boolean;
  isArchived?: boolean;
  thread?: ThreadItemResponse[];
  createdAt?: Date;
  updatedAt?: Date;
}
export class MessageListResponse {
  id?: string;
  referenceNumber?: string;
  threadId?: string | null;
  subject?: string;
  messageType?: MessageType;
  priority?: MessagePriority;
  from?: MessageFromResponse;
  to?: MessageToResponse;
  status?: MessageStatus;
  isEscalated?: boolean;
  responseDeadline?: Date;
  createdAt?: Date;
}