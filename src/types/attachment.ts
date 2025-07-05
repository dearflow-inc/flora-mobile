export enum SystemReferenceType {
  EMAIL = "email",
  USER_TASK = "user_task",
  TODO = "todo",
  CONTACT = "contact",
  DOCUMENT = "document",
  VIDEO = "video",
  PROFILE = "profile",
  SYSTEM = "system",
}

export const SystemReferenceTypeDisplay: Record<SystemReferenceType, string> = {
  [SystemReferenceType.EMAIL]: "Email",
  [SystemReferenceType.USER_TASK]: "Task",
  [SystemReferenceType.TODO]: "Todo",
  [SystemReferenceType.CONTACT]: "Contact",
  [SystemReferenceType.DOCUMENT]: "Document",
  [SystemReferenceType.VIDEO]: "Video",
  [SystemReferenceType.PROFILE]: "Profile",
  [SystemReferenceType.SYSTEM]: "System",
};

export const SystemReferenceTypeIcons: Record<SystemReferenceType, string> = {
  [SystemReferenceType.EMAIL]: "email",
  [SystemReferenceType.USER_TASK]: "assignment",
  [SystemReferenceType.TODO]: "check-circle",
  [SystemReferenceType.CONTACT]: "person",
  [SystemReferenceType.DOCUMENT]: "description",
  [SystemReferenceType.VIDEO]: "play-circle",
  [SystemReferenceType.PROFILE]: "account-circle",
  [SystemReferenceType.SYSTEM]: "settings",
};

export interface SystemReference {
  id: string;
  type: SystemReferenceType;
  externalId?: string;
  emailId?: string;
  meta?: {
    name?: string;
    email?: string;
    title?: string;
    description?: string;
    type?: string;
    duration?: string;
    [key: string]: any;
  };
}

export interface ChatAttachment extends SystemReference {
  // Additional properties specific to chat attachments
  createdAt?: string;
  updatedAt?: string;
}
