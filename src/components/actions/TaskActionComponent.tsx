import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import {
  UserTaskAction,
  UserTask,
  UserTaskType,
  UserTaskStatus,
} from "@/types/userTask";
import { CreateTodoAction } from "./CreateTodoAction";

interface TaskActionComponentProps {
  action: UserTaskAction;
  userTask: UserTask;
  onActionUpdate: (actionData: any) => void;
  onActionComplete: () => void;
  onActionDecline: () => void;
}

export const TaskActionComponent: React.FC<TaskActionComponentProps> = ({
  action,
  userTask,
  onActionUpdate,
  onActionComplete,
  onActionDecline,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Only show pending actions
  if (action.status !== UserTaskStatus.PENDING) {
    return null;
  }

  // Render specific action components when available
  const renderSpecificActionComponent = () => {
    switch (action.type) {
      case UserTaskType.CREATE_TODO:
        return <CreateTodoAction action={action} userTask={userTask} />;
      default:
        return null;
    }
  };

  const specificComponent = renderSpecificActionComponent();
  if (specificComponent) {
    return specificComponent;
  }

  const getActionTitle = (actionType: UserTaskType) => {
    switch (actionType) {
      case UserTaskType.EMAIL_REPLY:
        return "Reply to Email";
      case UserTaskType.EMAIL_FOLLOW_UP:
        return "Follow Up Email";
      case UserTaskType.EMAIL_SCHEDULER:
        return "Schedule Email";
      case UserTaskType.EMAIL_READ:
        return "Mark as Read";
      case UserTaskType.EMAIL_SEND:
        return "Send Email";
      case UserTaskType.EMAIL_CLEAN_UP:
        return "Clean Up Email";
      case UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE:
        return "Unsubscribe from Email";
      case UserTaskType.CREATE_TODO:
        return "Create Todo";
      case UserTaskType.DELETE_INCOMPLETE_TASKS:
        return "Delete Incomplete Tasks";
      case UserTaskType.AUTOSAVE_FILES_TO_STORAGE:
        return "Autosave Files";
      default:
        return "Unknown Action";
    }
  };

  const getActionIcon = (actionType: UserTaskType) => {
    switch (actionType) {
      case UserTaskType.EMAIL_REPLY:
        return "reply";
      case UserTaskType.EMAIL_FOLLOW_UP:
        return "schedule";
      case UserTaskType.EMAIL_SCHEDULER:
        return "schedule-send";
      case UserTaskType.EMAIL_READ:
        return "mark-email-read";
      case UserTaskType.EMAIL_SEND:
        return "send";
      case UserTaskType.EMAIL_CLEAN_UP:
        return "cleaning-services";
      case UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE:
        return "unsubscribe";
      case UserTaskType.CREATE_TODO:
        return "add-task";
      case UserTaskType.DELETE_INCOMPLETE_TASKS:
        return "delete-sweep";
      case UserTaskType.AUTOSAVE_FILES_TO_STORAGE:
        return "save";
      default:
        return "help";
    }
  };

  const getActionStatusColor = (status: UserTaskStatus) => {
    switch (status) {
      case UserTaskStatus.PENDING:
        return colors.warning;
      case UserTaskStatus.COMPLETED:
      case UserTaskStatus.COMPLETED_EXTERNAL:
        return colors.success;
      case UserTaskStatus.FAILED:
        return colors.danger;
      case UserTaskStatus.IGNORED:
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getActionDescription = (actionType: UserTaskType, actionData: any) => {
    switch (actionType) {
      case UserTaskType.EMAIL_REPLY:
        return "Generate and send a reply to this email";
      case UserTaskType.EMAIL_FOLLOW_UP:
        return "Schedule a follow-up email";
      case UserTaskType.EMAIL_SCHEDULER:
        return "Schedule this email to be sent later";
      case UserTaskType.EMAIL_READ:
        return "Mark this email as read";
      case UserTaskType.EMAIL_SEND:
        return "Send the composed email";
      case UserTaskType.EMAIL_CLEAN_UP:
        return "Clean up and organize emails";
      case UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE:
        return "Unsubscribe from this email address";
      case UserTaskType.CREATE_TODO:
        return "Create a new todo item";
      case UserTaskType.DELETE_INCOMPLETE_TASKS:
        return "Delete incomplete tasks";
      case UserTaskType.AUTOSAVE_FILES_TO_STORAGE:
        return "Automatically save files to storage";
      default:
        return "Execute this action";
    }
  };

  const renderActionContent = () => {
    // TODO: Implement specific UI for each action type
    // For now, just show the action data as JSON
    const hasData = action.data && Object.keys(action.data).length > 0;

    if (!hasData) {
      return (
        <Text style={styles.actionData}>
          No additional data available for this action.
        </Text>
      );
    }

    return (
      <View style={styles.actionDataContainer}>
        <Text style={styles.actionDataTitle}>Action Data:</Text>
        <Text style={styles.actionData}>
          {JSON.stringify(action.data, null, 2)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionHeader}>
        <View style={styles.actionInfo}>
          <MaterialIcons
            name={getActionIcon(action.type) as any}
            size={20}
            color={getActionStatusColor(action.status)}
          />
          <View style={styles.actionTitleContainer}>
            <Text style={styles.actionTitle}>
              {getActionTitle(action.type)}
            </Text>
            <Text style={styles.actionDescription}>
              {getActionDescription(action.type, action.data)}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getActionStatusColor(action.status) + "20" },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: getActionStatusColor(action.status) },
            ]}
          >
            {action.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {renderActionContent()}

      {action.error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{action.error}</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    actionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
    },
    actionInfo: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
    },
    actionTitleContainer: {
      flex: 1,
      marginLeft: 12,
    },
    actionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    actionDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    actionDataContainer: {
      marginBottom: 12,
    },
    actionDataTitle: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    actionData: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: "monospace",
      backgroundColor: colors.surface,
      padding: 8,
      borderRadius: 4,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.danger + "20",
      padding: 8,
      borderRadius: 4,
      marginBottom: 12,
    },
    errorText: {
      fontSize: 12,
      color: colors.danger,
      marginLeft: 6,
      flex: 1,
    },

    completedContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.success + "20",
      padding: 8,
      borderRadius: 4,
    },
    completedText: {
      fontSize: 12,
      color: colors.success,
      marginLeft: 6,
    },
  });
