// Email Types
export interface Author {
  type: AuthorType;
  externalId: string;
  meta?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export enum AuthorType {
  PROFILE = "profile",
  VIRTUAL_ASSISTANT = "virtual_assistant",
  SYSTEM = "system",
  CONTACT = "contact",
}

export interface Message {
  content: {
    type: string;
    body: string;
  }[];
}

export interface TimeFrame {
  start: Date;
  end: Date;
}

export interface EmailUnsubscribeAction {
  id: string;
  type: string;
  url: string;
  text: string;
}

export interface EmailStatus {
  internalRead: boolean;
  internalDeleted: boolean;
  internalImportant: boolean;
  internalArchived: boolean;
  internalSpam: boolean;
}

export interface EmailExternalIdentifier {
  resourceId: string;
  ownerId: string;
  externalType: EmailExternalIdentifierType;
}

export enum EmailExternalIdentifierType {
  GMAIL = "gmail",
  OUTLOOK = "outlook",
  APPLE = "apple",
  YAHOO = "yahoo",
  OTHER = "other",
}

export enum EmailLabel {
  INBOX = "inbox",
  SENT = "sent",
  DRAFT = "draft",
  TRASH = "trash",
  SPAM = "spam",
  STARRED = "starred",
  IMPORTANT = "important",
  UNREAD = "unread",
  ARCHIVED = "archived",
}

export enum EmailReason {
  DIRECT = "direct",
  CC = "cc",
  BCC = "bcc",
  FORWARDED = "forwarded",
  REPLIED = "replied",
}

export enum StyleLabel {
  NEWSLETTER = "newsletter",
  PROMOTIONAL = "promotional",
  TRANSACTIONAL = "transactional",
  PERSONAL = "personal",
  AUTOMATED = "automated",
}

export enum EmailCategory {
  WORK = "work",
  PERSONAL = "personal",
  NEWSLETTER = "newsletter",
  PROMOTIONAL = "promotional",
  SOCIAL = "social",
  UPDATES = "updates",
  FORUMS = "forums",
  SPAM = "spam",
}

export interface Email {
  id: string;
  dfOwner: Author;
  dfInboxId: string;
  title: string;
  description?: string;
  previewText?: string;
  externalIdentifier: EmailExternalIdentifier;
  threadId?: string;
  emailId: string;
  subject: string;
  from: Author;
  to: Author[];
  cc: Author[];
  bcc: Author[];
  reasons: EmailReason[];
  message: Message;
  externalLabels: EmailLabel[];
  internalTags: string[];
  styleLabels: StyleLabel[];
  sentByDearFlow?: boolean;
  sent: Date;
  classificationBlockedDueToPlan?: boolean;
  status?: EmailStatus;
  userTasks?: string[];
  createdAt: Date;
  updatedAt?: Date;
  isEncrypted?: boolean;
  userLookSessions: TimeFrame[];
  unsubscribeActions?: EmailUnsubscribeAction[];
  isOutgoing: boolean;
  likelyhoodToBeFromHuman: number;
  category?: EmailCategory;
}

export interface EmailWithoutContent {
  id: string;
  dfOwner: Author;
  dfInboxId: string;
  title: string;
  description?: string;
  previewText?: string;
  externalIdentifier: EmailExternalIdentifier;
  threadId?: string;
  emailId: string;
  subject: string;
  from: Author;
  to: Author[];
  cc: Author[];
  bcc: Author[];
  reasons: EmailReason[];
  externalLabels: EmailLabel[];
  internalTags: string[];
  styleLabels: StyleLabel[];
  sentByDearFlow?: boolean;
  sent: Date;
  classificationBlockedDueToPlan?: boolean;
  status?: EmailStatus;
  userTasks?: string[];
  createdAt: Date;
  updatedAt?: Date;
  isEncrypted?: boolean;
  userLookSessions: TimeFrame[];
  unsubscribeActions?: EmailUnsubscribeAction[];
  isOutgoing: boolean;
  likelyhoodToBeFromHuman: number;
  category?: EmailCategory;
}

// Request Types
export interface GetEmailsRequest {
  emailIds?: string;
  fromEmail?: string;
  limit?: number;
  page?: number;
}

export interface UpdateEmailStatusRequest {
  status: EmailStatus;
}

export interface SendEmailRequest {
  externalId: string;
  to: Author[];
  subject: string;
  emailBody: string;
  cc?: Author[];
  bcc?: Author[];
  attachments?: any[];
  followUpSettings?: any;
}

export interface AddLookSessionRequest {
  lookSession: TimeFrame;
}

// Response Types
export interface EmailResponse {
  emails: Email[];
}

export interface EmailWithoutContentResponse {
  emails: EmailWithoutContent[];
}

export interface SingleEmailResponse {
  email: Email;
}

export interface MultipleEmailsResponse {
  emails: Email[];
}
