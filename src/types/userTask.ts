export enum UserTaskType {
  EMAIL_FOLLOW_UP = "email_follow_up",
  EMAIL_REPLY = "email_reply",
  EMAIL_SCHEDULER = "email_scheduler",
  EMAIL_READ = "email_read",
  EMAIL_SEND = "email_send",
  DELETE_INCOMPLETE_TASKS = "delete_incomplete_tasks",
  AUTOSAVE_FILES_TO_STORAGE = "autosave_files_to_storage",
  EMAIL_CLEAN_UP = "email_clean_up",
  CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE = "contact_email_address_unsubscribe",
  CREATE_TODO = "create_todo",
}

export enum UserTaskStatus {
  PENDING = "pending",
  IGNORED = "ignored",
  DELETED = "deleted",
  COMPLETED = "completed",
  COMPLETED_EXTERNAL = "completed_external",
  FAILED = "failed",
  SNOOZE = "snooze",
}

export enum UserTaskIgnoreReason {
  NOT_IMPORTANT_NOW = "not_important_now",
  UNNECESSARY = "unnecessary",
  ALREADY_DONE = "already_done",
  CONTEXT_INACCURATE = "context_inaccurate",
  IRRELEVANT = "irrelevant",
  DELETED = "deleted",
  OTHER = "other",
}

export enum AlertCategory {
  PERSONAL = "personal",
  WORK = "work",
  FINANCE = "finance",
  SOCIAL = "social",
  HEALTH = "health",
  EDUCATION = "education",
  TRAVEL = "travel",
  SHOPPING = "shopping",
  ENTERTAINMENT = "entertainment",
  NEWS = "news",
  OTHER = "other",
}

export enum AuthorType {
  PROFILE = "profile",
  SYSTEM = "system",
  EXTERNAL = "external",
}

export interface Author {
  type: AuthorType;
  externalId: string;
  name?: string;
  email?: string;
  avatar?: string;
}

export interface SystemReference {
  type: string;
  entityId: string;
  emailId?: string;
  metadata?: Record<string, any>;
}

export interface UserTaskAction {
  id: string;
  type: UserTaskType;
  executedAt?: Date;
  status: UserTaskStatus;
  error?: string;
  completionAuthor?: Author;
  data: Record<string, any>;
  context: SystemReference[];
  config: Record<string, any>;
}

export interface UserTask {
  id: string;
  creatorSource?: SystemReference;
  dfOwner: Author;
  categories: AlertCategory[];
  type: UserTaskType;
  avatar?: {
    url?: string;
    alt: string;
  };
  title?: string;
  description: string;
  status: UserTaskStatus;
  ignoreReason?: UserTaskIgnoreReason;
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date;
  context: SystemReference[];
  listeners?: SystemReference[];
  actions: UserTaskAction[];
  error?: string;
  contextViewId: string;
  importance: number;
  notify: boolean;
  userRated?: number;
}

export interface CreateUserTaskRequest {
  type: UserTaskType;
  targetView: string;
  actionConfig: Record<string, any>;
  insertIntoUserTaskId?: string;
  manual?: boolean;
}

export interface UpdateUserTaskRequest {
  title?: string;
  description?: string;
  contextViewId?: string;
  status?: UserTaskStatus;
  updateRules?: Record<string, any>;
}

export interface UpdateUserTaskActionDataRequest {
  actionId: string;
  actionData: Record<string, any>;
}

export interface IgnoreUserTaskRequest {
  reason: UserTaskIgnoreReason;
}

export interface CompleteUserTaskRequest {
  options?: Record<string, any>;
}

export interface RateUserTaskRequest {
  rating: number;
}

export interface UserTasksAnalytics {
  totalTasks: number;
  completedTasks: number;
  ignoredTasks: number;
  pendingTasks: number;
  timeSaved: number;
  averageRating: number;
  tasksByType: Record<UserTaskType, number>;
  tasksByStatus: Record<UserTaskStatus, number>;
}

export interface UserTaskResponse {
  userTask: UserTask;
}

export interface UserTasksResponse {
  userTasks: UserTask[];
}

export interface UserTasksAnalyticsResponse {
  analytics: UserTasksAnalytics;
}

export const UserTaskTypeData = {
  [UserTaskType.EMAIL_FOLLOW_UP]: {
    action: "Follow Up",
    msSaved: 1000 * 60 * 7, // 7 minutes
  },
  [UserTaskType.EMAIL_SCHEDULER]: {
    action: "Schedule Email",
    msSaved: 1000 * 60 * 8, // 8 minutes
  },
  [UserTaskType.EMAIL_REPLY]: {
    action: "Draft Reply",
    msSaved: 1000 * 60 * 5, // 5 minutes
  },
  [UserTaskType.EMAIL_READ]: {
    action: "Read",
    msSaved: 1000 * 60 * 3, // 3 minutes
  },
  [UserTaskType.EMAIL_SEND]: {
    action: "Send Email",
    msSaved: 1000 * 60 * 5, // 5 minutes
  },
  [UserTaskType.DELETE_INCOMPLETE_TASKS]: {
    action: "Delete Incomplete Tasks",
    msSaved: 0,
  },
  [UserTaskType.AUTOSAVE_FILES_TO_STORAGE]: {
    action: "Autosave Files to Storage",
    msSaved: 1000 * 60 * 3, // 3 minutes
  },
  [UserTaskType.EMAIL_CLEAN_UP]: {
    action: "Email Clean Up",
    msSaved: 1000 * 60 * 1, // 1 minute
  },
  [UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE]: {
    action: "Contact Email Address Unsubscribe",
    msSaved: 1000 * 60 * 10, // 10 minutes
  },
  [UserTaskType.CREATE_TODO]: {
    action: "Create Todo",
    msSaved: 1000 * 60 * 2, // 2 minutes
  },
};
