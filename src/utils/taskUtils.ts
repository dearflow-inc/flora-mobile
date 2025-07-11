import { UserTask, UserTaskStatus, UserTaskType } from "@/types/userTask";
import { EmailWithoutContent } from "@/types/email";

export type UserTaskFilter =
  | "inbox"
  | "archived"
  | "draft"
  | "sent"
  | "snoozed"
  | "trash";

export const getFilteredUserTasks = (
  userTasks: UserTask[],
  activeFilter: UserTaskFilter,
  selectedContextViewId: string | null,
  searchQuery: string
): UserTask[] => {
  let filteredTasks = userTasks;

  switch (activeFilter) {
    case "inbox":
      // Incomplete & Actionable
      filteredTasks = userTasks.filter(
        (task) =>
          task.status === UserTaskStatus.PENDING ||
          task.status === UserTaskStatus.FAILED
      );
      break;
    case "archived":
      // Archived & Completed
      filteredTasks = userTasks.filter(
        (task) =>
          task.status === UserTaskStatus.COMPLETED ||
          task.status === UserTaskStatus.COMPLETED_EXTERNAL
      );
      break;
    case "sent":
      // Sent tasks - this might need to be adjusted based on your backend logic
      filteredTasks = userTasks.filter(
        (task) => task.status === UserTaskStatus.COMPLETED_EXTERNAL
      );
      break;
    case "snoozed":
      // Snoozed tasks
      filteredTasks = userTasks.filter(
        (task) => task.status === UserTaskStatus.SNOOZE
      );
      break;
    case "trash":
      // Trash tasks
      filteredTasks = userTasks.filter(
        (task) => task.status === UserTaskStatus.DELETED
      );
      break;
    default:
      break;
  }

  // Apply context view filter
  if (selectedContextViewId) {
    filteredTasks = filteredTasks.filter(
      (task) =>
        selectedContextViewId === "all" ||
        task.contextViewId === selectedContextViewId
    );
  } else {
    // When showing "All" tasks, filter out EMAIL_CLEAN_UP tasks
    filteredTasks = filteredTasks.filter(
      (task) => task.type !== UserTaskType.EMAIL_CLEAN_UP
    );
  }

  // Apply search filter
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  return filteredTasks;
};

export const getFilterCount = (
  userTasks: UserTask[],
  filter: UserTaskFilter
): number => {
  switch (filter) {
    case "inbox":
      return userTasks.filter(
        (task) =>
          task.status === UserTaskStatus.PENDING ||
          task.status === UserTaskStatus.FAILED
      ).length;
    case "archived":
      return userTasks.filter(
        (task) =>
          task.status === UserTaskStatus.COMPLETED ||
          task.status === UserTaskStatus.COMPLETED_EXTERNAL
      ).length;
    case "draft":
      // This will be handled separately in the component since it's not user tasks
      return 0;
    case "sent":
      return userTasks.filter(
        (task) => task.status === UserTaskStatus.COMPLETED_EXTERNAL
      ).length;
    case "snoozed":
      return userTasks.filter((task) => task.status === UserTaskStatus.SNOOZE)
        .length;
    case "trash":
      return userTasks.filter((task) => task.status === UserTaskStatus.DELETED)
        .length;
    default:
      return 0;
  }
};

export const getFilterTitle = (filter: UserTaskFilter): string => {
  switch (filter) {
    case "inbox":
      return "Inbox";
    case "archived":
      return "Archived / Completed";
    case "draft":
      return "Drafts";
    case "sent":
      return "Sent";
    case "snoozed":
      return "Planned / Snoozed";
    case "trash":
      return "Trashed";
    default:
      return "Inbox";
  }
};

export const getFilterIcon = (filter: UserTaskFilter): string => {
  switch (filter) {
    case "inbox":
      return "inbox";
    case "archived":
      return "archive";
    case "draft":
      return "drafts";
    case "sent":
      return "send";
    case "snoozed":
      return "snooze";
    case "trash":
      return "delete";
    default:
      return "inbox";
  }
};

export const isEmailTask = (task: UserTask): boolean => {
  // Check if task type indicates it's email-related
  const emailTaskTypes = [
    UserTaskType.EMAIL_FOLLOW_UP,
    UserTaskType.EMAIL_REPLY,
    UserTaskType.EMAIL_SCHEDULER,
    UserTaskType.EMAIL_READ,
  ];

  if (emailTaskTypes.includes(task.type)) {
    return true;
  }

  // Also check context for email entities
  return task.context.some((ctx) => ctx.type === "email");
};

export const getEmailFromContext = (
  task: UserTask,
  emails: EmailWithoutContent[]
): EmailWithoutContent | undefined => {
  const emailContext = task.context.find((ctx) => ctx.type === "email");

  let emailId = emailContext?.emailId;

  if (task.type === UserTaskType.EMAIL_READ) {
    emailId =
      emailContext?.emailId ||
      task.actions.find((action) => action.type === UserTaskType.EMAIL_READ)
        ?.data.emailId;
  }

  if (emailId) {
    return emails.find((email) => email.id === emailId);
  }

  return undefined;
};

export const getEmailSenderInfo = (
  task: UserTask,
  emails: EmailWithoutContent[]
) => {
  // First try to get email from context
  const relatedEmail = getEmailFromContext(task, emails);
  if (relatedEmail) {
    return {
      name:
        relatedEmail.from.meta?.name ||
        relatedEmail.from.meta?.email ||
        "Unknown",
      isFromEmail: true,
      subject: relatedEmail?.subject || task.title || task.description,
      previewText:
        relatedEmail?.previewText ||
        (task.title && task.title !== task.description ? task.description : ""),
    };
  }

  // If no email found but it's an email task, try to extract from task data
  if (isEmailTask(task)) {
    // Check if task title or description contains email-like info
    const emailMatch = task.description.match(/from[:\s]+([^,\n]+)/i);
    if (emailMatch) {
      return {
        name: emailMatch[1].trim(),
        isFromEmail: true,
        subject: task.title || task.description,
        previewText:
          task.title && task.title !== task.description ? task.description : "",
      };
    }
    return {
      name: "-",
      isFromEmail: true,
      subject: task.title || task.description,
      previewText:
        task.title && task.title !== task.description ? task.description : "",
    };
  }

  return {
    name: "Flora",
    isFromEmail: false,
    subject: task.title || task.description,
    previewText:
      task.title && task.title !== task.description ? task.description : "",
  };
};

export const getTaskActions = (task: UserTask): string[] => {
  // Get actions from the task's actions array
  const actions =
    task.actions
      .filter((action) => action.status === UserTaskStatus.PENDING)
      ?.map((action) => {
        // Convert action type to readable format
        switch (action.type) {
          case UserTaskType.EMAIL_READ:
            return "Read";
          case UserTaskType.EMAIL_REPLY:
            return "Reply";
          case UserTaskType.EMAIL_FOLLOW_UP:
            return "Follow Up";
          case UserTaskType.EMAIL_SCHEDULER:
            return "Schedule";
          case UserTaskType.EMAIL_SEND:
            return "Send";
          case UserTaskType.EMAIL_CLEAN_UP:
            return "Clean Up";
          case UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE:
            return "Unsubscribe";
          default:
            // Remove underscores and capitalize
            return action.type
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }) || [];

  // If no actions are defined, default to "Read"
  return actions.length > 0 ? actions : ["Read"];
};

export const formatTimestamp = (dateInput: string | Date): string => {
  const date = new Date(dateInput);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const itemDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  const timeString = date.toLocaleTimeString([], timeOptions);

  // If it's today, show only time
  if (itemDate.getTime() === today.getTime()) {
    return timeString;
  }

  // If it's before today, show time then date
  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  };

  const dateString_formatted = date.toLocaleDateString([], dateOptions);
  return `${timeString} • ${dateString_formatted}`;
};
