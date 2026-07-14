// ── MessageType ──────────────────────────────────────────────
export const MessageType = {
  REQUEST:      'REQUEST',
  RESPONSE:     'RESPONSE',
  NOTIFICATION: 'NOTIFICATION',
  INQUIRY:      'INQUIRY',
  COMPLAINT:    'COMPLAINT',
  INVITATION:   'INVITATION',
  APPROVAL:     'APPROVAL',
  REJECTION:    'REJECTION',
} as const;
export type MessageType = typeof MessageType[keyof typeof MessageType];

//  MessagePriority
export const MessagePriority = {
  NORMAL:   'NORMAL',
  URGENT:   'URGENT',
  CRITICAL: 'CRITICAL',
} as const;
export type MessagePriority = typeof MessagePriority[keyof typeof MessagePriority];

//  MessageStatus 
export const MessageStatus = {
  SENT:      'SENT',
  READ:      'READ',
  REPLIED:   'REPLIED',
  ESCALATED: 'ESCALATED',
  CLOSED:    'CLOSED',
} as const;
export type MessageStatus = typeof MessageStatus[keyof typeof MessageStatus];

//  Sub-shapes 
export interface MessageFrom {
  userId: string;
  city: string;
  department: string;
  name: string;
}

export interface MessageTo {
  city: string;
  department: string;
  userId?: string | null;
}

export interface ThreadItem {
  id: string;
  referenceNumber: string;
  from: MessageFrom;
  body: string;
  createdAt: Date;
}

// ── Full message (detail view) ───────────────────────────────
export interface Message {
  id: string;
  referenceNumber: string;
  threadId: string | null;
  parentId: string | null;
  from: MessageFrom;
  to: MessageTo;
  subject: string;
  messageType: MessageType;
  priority: MessagePriority;
  body: string;
  attachments: any[];
  relatedProject: string | null;
  status: MessageStatus;
  readAt: Date | null;
  responseDeadline: Date;
  isEscalated: boolean;
  isArchived: boolean;
  thread: ThreadItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ── List item (inbox/sent rows) ──────────────────────────────
export interface MessageListItem {
  id: string;
  referenceNumber: string;
  threadId: string | null;
  subject: string;
  messageType: MessageType;
  priority: MessagePriority;
  from: MessageFrom;
  to: MessageTo;
  status: MessageStatus;
  isEscalated: boolean;
  responseDeadline: Date;
  createdAt: Date;
}