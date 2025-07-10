import { UserTaskType } from "@/types/userTask";

export interface ActionTypeConfig {
  archiveAction?:
    | "archive"
    | "archive_all"
    | "delete_all"
    | "save_all"
    | "unsubscribe"
    | "schedule";
  defaultAction?:
    | "archive"
    | "read"
    | "delete"
    | "archive_all"
    | "delete_all"
    | "read_all"
    | "save_all"
    | "unsubscribe"
    | "schedule"
    | "send"
    | "create";
  canArchive: boolean;
}

export const actionsByUserTaskType: Record<UserTaskType, ActionTypeConfig> = {
  [UserTaskType.EMAIL_READ]: {
    archiveAction: "archive",
    defaultAction: "archive",
    canArchive: true,
  },
  [UserTaskType.EMAIL_CLEAN_UP]: {
    archiveAction: undefined,
    defaultAction: "delete_all",
    canArchive: false,
  },
  [UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE]: {
    archiveAction: undefined,
    defaultAction: "unsubscribe",
    canArchive: false,
  },
  [UserTaskType.EMAIL_FOLLOW_UP]: {
    archiveAction: undefined,
    defaultAction: "send",
    canArchive: false,
  },
  [UserTaskType.EMAIL_REPLY]: {
    archiveAction: "archive",
    defaultAction: "send",
    canArchive: true,
  },
  [UserTaskType.EMAIL_SEND]: {
    archiveAction: undefined,
    defaultAction: "send",
    canArchive: false,
  },
  [UserTaskType.EMAIL_SCHEDULER]: {
    archiveAction: undefined,
    defaultAction: "schedule",
    canArchive: false,
  },
  [UserTaskType.DELETE_INCOMPLETE_TASKS]: {
    archiveAction: undefined,
    defaultAction: "delete_all",
    canArchive: false,
  },
  [UserTaskType.AUTOSAVE_FILES_TO_STORAGE]: {
    archiveAction: undefined,
    defaultAction: "save_all",
    canArchive: false,
  },
  [UserTaskType.CREATE_TODO]: {
    archiveAction: "archive",
    defaultAction: "create",
    canArchive: true,
  },
};
