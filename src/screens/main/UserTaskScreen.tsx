import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { useTheme } from "@/hooks/useTheme";
import {
  selectUserTaskById,
  selectUserTasks,
  completeUserTaskAsync,
  updateUserTaskAsync,
  updateUserTaskActionDataAsync,
  setSelectedUserTask,
  rateUserTaskAsync,
  createUserTaskAsync,
  deleteUserTaskAsync,
  snoozeUserTaskAsync,
  ignoreUserTaskAsync,
} from "@/store/slices/userTaskSlice";
import {
  fetchEmailsByThreadIdAsync,
  fetchEmailByIdAsync,
} from "@/store/slices/emailSlice";
import {
  UserTask,
  UserTaskType,
  UserTaskStatus,
  UserTaskAction,
  SystemReference,
  UserTaskTypeData,
  CreateUserTaskRequest,
  CompleteUserTaskRequest,
  UserTaskIgnoreReason,
} from "@/types/userTask";
import { Email } from "@/types/email";
import { AppStackParamList } from "@/types/navigation";
import { EmailContextView } from "@/components/context/EmailContextView";
// import { VideoContextView } from "@/components/context/VideoContextView";
import { TaskActionComponent } from "@/components/actions/TaskActionComponent";
import { actionsByUserTaskType } from "@/utils/userTaskActions";

type UserTaskScreenProps = NativeStackNavigationProp<
  AppStackParamList,
  "UserTaskDetail"
>;

interface UserTaskScreenParams {
  userTaskId: string;
}

export const UserTaskScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<UserTaskScreenProps>();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { userTaskId } = (route.params as UserTaskScreenParams) || {};

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSuggestionsExpanded, setIsSuggestionsExpanded] = useState(false);
  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [contextData, setContextData] = useState<{
    emails?: Email[];
    videos?: any[];
  }>({});

  const { isLoading, isCreating } = useSelector(
    (state: RootState) => state.userTasks
  );
  const userTasks = useSelector(selectUserTasks);
  const userTask = useSelector((state: RootState) =>
    selectUserTaskById(state, userTaskId)
  );

  useEffect(() => {
    if (userTask?.context?.length === 0) {
      setIsSuggestionsExpanded(userTask.context.length === 0);
    }
  }, [userTask?.context?.length]);

  const { threadEmails, currentEmail } = useSelector(
    (state: RootState) => state.emails
  );

  const styles = createStyles(colors);

  useEffect(() => {
    // If the task is not in the current list, we might need to refresh the list
    // For now, just set the selected task if we find it
    if (userTaskId && userTask) {
      dispatch(setSelectedUserTask(userTask));
    }
  }, [userTaskId, userTask, dispatch]);

  useEffect(() => {
    if (userTask?.context) {
      loadContextData();
    }
  }, [userTask]);

  const loadContextData = async () => {
    if (!userTask?.context) return;

    const emails: Email[] = [];
    const videos: any[] = [];

    for (const contextItem of userTask.context) {
      if (contextItem.type === "email" && contextItem.emailId) {
        try {
          // First get the email by ID
          const emailResult = await dispatch(
            fetchEmailByIdAsync(contextItem.emailId)
          );
          if (
            emailResult.type === "emails/fetchEmailById/fulfilled" &&
            emailResult.payload
          ) {
            const email = emailResult.payload as Email;
            emails.push(email);

            // If the email has a threadId, fetch the entire thread
            if (email.threadId) {
              const threadResult = await dispatch(
                fetchEmailsByThreadIdAsync(email.threadId)
              );
              if (
                threadResult.type ===
                  "emails/fetchEmailsByThreadId/fulfilled" &&
                threadResult.payload &&
                Array.isArray(threadResult.payload)
              ) {
                // Add any additional emails from the thread that weren't already included
                const additionalEmails = threadResult.payload.filter(
                  (threadEmail: Email) =>
                    !emails.some(
                      (existingEmail) => existingEmail.id === threadEmail.id
                    )
                );
                emails.push(...additionalEmails);
              }
            }
          }
        } catch (error) {
          console.error("Failed to load email context:", error);
        }
      } else if (contextItem.type === "video") {
        // TODO: Implement video context loading
        videos.push(contextItem);
      }
    }

    setContextData({ emails, videos });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // For now, just reload the context data since we don't have fetchUserTaskByIdAsync
    await loadContextData();
    setIsRefreshing(false);
  };

  const handleArchive = async () => {
    if (!userTask) return;

    try {
      const actionConfig = actionsByUserTaskType[userTask.type];
      const actionToUse =
        actionConfig.archiveAction || actionConfig.defaultAction || "archive";

      const completeRequest: CompleteUserTaskRequest = {
        options:
          userTask.actions.length > 0
            ? userTask.actions.map((action) => ({
                userTaskActionId: action.id,
                options: {
                  ignore: !actionConfig.canArchive,
                  action: actionToUse,
                },
              }))
            : [
                {
                  userTaskActionId: "default",
                  options: {
                    ignore: false,
                    action: actionToUse,
                  },
                },
              ],
      };

      await dispatch(
        completeUserTaskAsync({
          userTaskId: userTask.id,
          request: completeRequest,
        })
      ).unwrap();

      Alert.alert("Success", "Task archived successfully", [
        { text: "OK", onPress: handleBack },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to archive task. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!userTask) return;

    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(deleteUserTaskAsync(userTask.id)).unwrap();
            Alert.alert("Task Deleted", "Task has been deleted", [
              { text: "OK", onPress: handleBack },
            ]);
          } catch (error) {
            Alert.alert("Error", "Failed to delete task. Please try again.");
          }
        },
      },
    ]);
  };

  const handleMarkUnread = async () => {
    if (!userTask) return;

    try {
      // Snooze the task for 1 hour (3600000 ms)
      await dispatch(
        snoozeUserTaskAsync({
          userTaskId: userTask.id,
          msTillReactivate: 3600000, // 1 hour
        })
      ).unwrap();

      Alert.alert("Task Snoozed", "Task has been snoozed for 1 hour", [
        { text: "OK", onPress: handleBack },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to snooze task. Please try again.");
    }
  };

  const handleMenu = () => {
    setIsMenuModalVisible(true);
  };

  const handleCreateTodo = async () => {
    if (!userTask || !contextData.emails || contextData.emails.length === 0)
      return;

    setIsMenuModalVisible(false);
    setIsCreatingTask(true);
    setIsSuggestionsExpanded(true); // Expand suggestions immediately

    try {
      const firstEmail = contextData.emails[0];
      const createRequest: CreateUserTaskRequest = {
        type: UserTaskType.CREATE_TODO,
        targetView: userTask.contextViewId,
        actionConfig: {
          emailId: firstEmail.id,
        },
        insertIntoUserTaskId: userTask.id,
        manual: false,
      };

      await dispatch(createUserTaskAsync(createRequest)).unwrap();

      // Refresh the current task to get the new action
      // Since we don't have fetchUserTaskByIdAsync, we'll just reload context
      await loadContextData();
    } catch (error) {
      Alert.alert("Error", "Failed to create todo task. Please try again.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCreateReply = async () => {
    if (!userTask || !contextData.emails || contextData.emails.length === 0)
      return;

    setIsMenuModalVisible(false);
    setIsCreatingTask(true);
    setIsSuggestionsExpanded(true); // Expand suggestions immediately

    try {
      const firstEmail = contextData.emails[0];
      const createRequest: CreateUserTaskRequest = {
        type: UserTaskType.EMAIL_REPLY,
        targetView: userTask.contextViewId,
        actionConfig: {
          emailId: firstEmail.id,
        },
        insertIntoUserTaskId: userTask.id,
        manual: false,
      };

      await dispatch(createUserTaskAsync(createRequest)).unwrap();

      // Refresh the current task to get the new action
      // Since we don't have fetchUserTaskByIdAsync, we'll just reload context
      await loadContextData();
    } catch (error) {
      Alert.alert("Error", "Failed to create reply task. Please try again.");
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleCloseMenuModal = () => {
    setIsMenuModalVisible(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleCompleteTask = async () => {
    if (!userTask) return;

    try {
      await dispatch(
        completeUserTaskAsync({
          userTaskId: userTask.id,
          request: {
            options: userTask.actions
              .filter((action) => action.status === UserTaskStatus.PENDING)
              .map((action) => ({
                userTaskActionId: action.id,
              })),
          },
        })
      ).unwrap();
    } catch (error) {
      Alert.alert("Error", "Failed to complete task. Please try again.");
    }
  };

  const handleIgnoreTask = async () => {
    if (!userTask) return;

    await dispatch(
      ignoreUserTaskAsync({
        userTaskId: userTask.id,
        request: { reason: UserTaskIgnoreReason.OTHER },
      })
    ).unwrap();
    navigation.goBack();
  };

  const handleActionUpdate = async (actionId: string, actionData: any) => {
    if (!userTask) return;

    try {
      await dispatch(
        updateUserTaskActionDataAsync({
          userTaskId: userTask.id,
          request: {
            actionId,
            actionData,
          },
        })
      ).unwrap();
    } catch (error) {
      Alert.alert("Error", "Failed to update action. Please try again.");
    }
  };

  const handleToggleImportant = async () => {
    if (!userTask) return;

    try {
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to update task importance. Please try again."
      );
    }
  };

  const handleToggleSuggestions = () => {
    setIsSuggestionsExpanded(!isSuggestionsExpanded);
  };

  // Helper function to determine if task should navigate to EmailThreadScreen
  const shouldNavigateToEmailThread = (task: UserTask): boolean => {
    const isCompleted =
      task.status === UserTaskStatus.COMPLETED ||
      task.status === UserTaskStatus.COMPLETED_EXTERNAL;
    const isEmailRelated = task.context.some((ctx) => ctx.type === "email");
    const isEmailCleanUp = task.type === UserTaskType.EMAIL_CLEAN_UP;

    return isCompleted && isEmailRelated && !isEmailCleanUp;
  };

  const { width, height } = useWindowDimensions();

  const renderContext = () => {
    if (!userTask?.context || userTask.context.length === 0) {
      return null; // Hide the entire context section when there's no context
    }

    // If task is completed, expand context to full height
    const isCompleted =
      userTask.status === UserTaskStatus.COMPLETED ||
      userTask.status === UserTaskStatus.COMPLETED_EXTERNAL;

    const getWebViewHeight = () => {
      if (isCompleted) {
        // Full height minus header for completed tasks
        return Math.floor(height - 120);
      }
      // Original height calculation for pending tasks
      return Math.floor(height - (pendingActions?.length || 0 ? 335 : 300));
    };

    return (
      <View
        style={[
          styles.contextContainer,
          {
            height: getWebViewHeight(),
            maxHeight: getWebViewHeight(),
            width: width,
          },
        ]}
      >
        {/* Email Context */}
        {contextData.emails && contextData.emails.length > 0 && (
          <EmailContextView
            emails={contextData.emails}
            extraHeightDeduction={isCompleted ? 0 : 175}
          />
        )}

        {/* Video Context */}
        {contextData.videos && contextData.videos.length > 0 && (
          <View>
            <Text style={styles.taskDescription}>
              Video context display coming soon...
            </Text>
          </View>
        )}
      </View>
    );
  };

  const pendingActions = userTask?.actions?.filter(
    (action) => action.status === UserTaskStatus.PENDING
  );

  // Helper function to get the complete button text
  const getCompleteButtonText = () => {
    if (!userTask?.actions || pendingActions?.length === 0) {
      return "Done";
    }
    const actionCount = pendingActions?.length || 0;
    return `Approve ${actionCount} Action${actionCount > 1 ? "s" : ""}`;
  };

  // Helper function to generate suggestion text based on action types
  const getSuggestionText = () => {
    if (isCreatingTask) {
      return "Flora is preparing suggestions...";
    }

    if (!userTask?.actions || pendingActions?.length === 0) {
      return "Flora has no suggestions";
    }

    // Get unique action types
    const actionTypes = [
      ...new Set(pendingActions?.map((action) => action.type)),
    ];

    // Map to human-readable descriptions
    const actionDescriptions = actionTypes.map(
      (type) => UserTaskTypeData[type]?.action || type.replace(/_/g, " ")
    );

    // Format the suggestion text
    return `Flora prepared a ${actionDescriptions
      .map((action) => action.toLowerCase())
      .join(", ")}`;
  };

  const renderMenuModal = () => {
    const hasEmailContext = contextData.emails && contextData.emails.length > 0;

    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={handleCloseMenuModal}
          activeOpacity={1}
        />
        <View style={styles.menuModal}>
          <TouchableOpacity
            style={[
              styles.menuItem,
              !hasEmailContext && styles.menuItemDisabled,
            ]}
            onPress={handleCreateTodo}
            disabled={!hasEmailContext}
          >
            <MaterialIcons
              name="check-box"
              size={20}
              color={hasEmailContext ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.menuItemText,
                !hasEmailContext && styles.menuItemTextDisabled,
              ]}
            >
              Create Todo
            </Text>
          </TouchableOpacity>
          <View style={styles.menuSeparator} />
          <TouchableOpacity
            style={[
              styles.menuItem,
              !hasEmailContext && styles.menuItemDisabled,
            ]}
            onPress={handleCreateReply}
            disabled={!hasEmailContext}
          >
            <MaterialIcons
              name="reply"
              size={20}
              color={hasEmailContext ? colors.text : colors.textSecondary}
            />
            <Text
              style={[
                styles.menuItemText,
                !hasEmailContext && styles.menuItemTextDisabled,
              ]}
            >
              Create Reply
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading && !userTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading task...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Task Not Found</Text>
          <Text style={styles.errorText}>
            {"The requested task could not be found."}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          {/* Show email thread button for completed email tasks */}
          {userTask &&
            shouldNavigateToEmailThread(userTask) &&
            contextData.emails &&
            contextData.emails.length > 0 && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  const emailContext = userTask.context.find(
                    (ctx) => ctx.type === "email"
                  );
                  const relatedEmail = contextData.emails?.find(
                    (email) => email.id === emailContext?.emailId
                  );
                  if (relatedEmail?.threadId) {
                    navigation.navigate("EmailThreadDetail", {
                      threadId: relatedEmail.threadId,
                    });
                  }
                }}
              >
                <MaterialIcons name="email" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          <TouchableOpacity style={styles.headerButton} onPress={handleArchive}>
            <MaterialIcons name="archive" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleDelete}>
            <MaterialIcons name="delete" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleMarkUnread}
          >
            <MaterialIcons name="markunread" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleMenu}>
            <MaterialIcons name="more-vert" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content - takes up remaining space */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Task Info */}
          <View style={styles.taskInfoContainer}>
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>
                {userTask.title || userTask.description}
              </Text>
              {userTask.status === UserTaskStatus.PENDING && (
                <TouchableOpacity
                  style={styles.starButton}
                  onPress={() => handleToggleImportant()}
                >
                  <MaterialIcons
                    name="star"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>

            {userTask.title && userTask.description !== userTask.title && (
              <Text style={styles.taskDescription}>{userTask.description}</Text>
            )}
          </View>

          {/* Context Section - takes up remaining space */}
          <View style={styles.contextWrapper}>{renderContext()}</View>
        </ScrollView>
      </View>

      {/* Fixed Bottom Buttons */}
      {userTask.status === UserTaskStatus.PENDING && (
        <View
          style={[
            styles.bottomButtonsContainer,
            { height: isSuggestionsExpanded ? height - 222 : undefined },
          ]}
        >
          {/* Show suggestion text only if there are actions */}
          <View>
            <TouchableOpacity
              style={styles.suggestionContainer}
              onPress={handleToggleSuggestions}
            >
              <Text style={styles.suggestionText}>{getSuggestionText()}</Text>
              {isCreatingTask ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <MaterialIcons
                  name={
                    isSuggestionsExpanded
                      ? "keyboard-arrow-down"
                      : "keyboard-arrow-up"
                  }
                  size={24}
                  color={colors.textSecondary}
                />
              )}
            </TouchableOpacity>
            {isSuggestionsExpanded && (
              <ScrollView
                style={[
                  styles.expandedActionsContainer,
                  { maxHeight: height - 330 },
                ]}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
              >
                {pendingActions
                  ?.sort((a, b) =>
                    a.type === UserTaskType.EMAIL_CLEAN_UP
                      ? 1
                      : b.type === UserTaskType.EMAIL_CLEAN_UP
                      ? -1
                      : 0
                  )
                  .map((action, index) => (
                    <TaskActionComponent
                      key={action.id}
                      action={action}
                      userTask={userTask}
                      onActionUpdate={(actionData) =>
                        handleActionUpdate(action.id, actionData)
                      }
                      onActionComplete={() => {
                        console.log("Action completed:", action.id);
                      }}
                      onActionDecline={() => {
                        console.log("Action declined:", action.id);
                      }}
                    />
                  ))}
              </ScrollView>
            )}
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.ignoreButton]}
              onPress={handleIgnoreTask}
            >
              <MaterialIcons name="close" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Ignore Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.completeButton]}
              onPress={handleCompleteTask}
            >
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>
                {getCompleteButtonText()}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {isMenuModalVisible && renderMenuModal()}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 16,
    },
    errorText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 7,
      paddingLeft: 3,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    headerRight: {
      flexDirection: "row",
    },
    headerButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    taskInfoContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      paddingLeft: 12,
      paddingRight: 9,
    },
    taskHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    taskTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    starButton: {
      padding: 4,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    taskDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    taskMeta: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    contextContainer: {
      backgroundColor: colors.surface,
      flex: 1,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      gap: 6,
    },
    completeButton: {
      backgroundColor: colors.success,
    },
    ignoreButton: {
      backgroundColor: colors.danger,
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 13,
      fontWeight: "600",
    },
    suggestionContainer: {
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    suggestionText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: "italic",
      flex: 1,
    },
    expandedActionsContainer: {
      marginTop: 8,
      marginBottom: 12,
    },
    buttonsContainer: {
      flexDirection: "row",
      gap: 12,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contextWrapper: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    bottomButtonsContainer: {
      backgroundColor: colors.surface,
      padding: 16,
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    modalOverlay: {
      position: "absolute",
      top: 60,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "flex-start",
      alignItems: "flex-end",
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 1000,
    },
    modalBackdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    menuModal: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 8,
      marginTop: 60, // Position below the header
      marginRight: 16,
      minWidth: 160,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    menuItemText: {
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
    },
    menuSeparator: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginVertical: 8,
    },
    menuItemDisabled: {
      opacity: 0.6,
    },
    menuItemTextDisabled: {
      color: colors.textSecondary,
    },
  });
