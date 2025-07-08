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
} from "@/types/userTask";
import { Email } from "@/types/email";
import { AppStackParamList } from "@/types/navigation";
import { EmailContextView } from "@/components/context/EmailContextView";
// import { VideoContextView } from "@/components/context/VideoContextView";
import { TaskActionComponent } from "@/components/actions/TaskActionComponent";

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
  const [contextData, setContextData] = useState<{
    emails?: Email[];
    videos?: any[];
  }>({});

  const { isLoading, error } = useSelector(
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

  const handleToggleStar = () => {
    // TODO: Implement star/unstar functionality
    console.log("Star button pressed");
  };

  const handleArchive = () => {
    // TODO: Implement archive functionality
    console.log("Archive button pressed");
  };

  const handleDelete = () => {
    // TODO: Implement delete functionality
    console.log("Delete button pressed");
  };

  const handleMarkUnread = () => {
    // TODO: Implement mark as unread functionality
    console.log("Mark as unread button pressed");
  };

  const handleMenu = () => {
    // TODO: Implement menu functionality
    console.log("Menu button pressed");
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
        })
      ).unwrap();

      Alert.alert("Success", "Task completed successfully", [
        { text: "OK", onPress: handleBack },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to complete task. Please try again.");
    }
  };

  const handleIgnoreTask = async () => {
    if (!userTask) return;

    Alert.alert("Ignore Task", "Are you sure you want to ignore this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Ignore",
        style: "destructive",
        onPress: async () => {
          try {
            await dispatch(
              updateUserTaskAsync({
                userTaskId: userTask.id,
                request: { status: UserTaskStatus.IGNORED },
              })
            ).unwrap();

            Alert.alert("Task Ignored", "Task has been ignored", [
              { text: "OK", onPress: handleBack },
            ]);
          } catch (error) {
            Alert.alert("Error", "Failed to ignore task. Please try again.");
          }
        },
      },
    ]);
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
  const { width, height } = useWindowDimensions();

  const renderContext = () => {
    if (!userTask?.context || userTask.context.length === 0) {
      return null; // Hide the entire context section when there's no context
    }

    const getWebViewHeight = () => {
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
          <EmailContextView emails={contextData.emails} />
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

  if (error || !userTask) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Task Not Found</Text>
          <Text style={styles.errorText}>
            {error || "The requested task could not be found."}
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
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleToggleStar}
          >
            <MaterialIcons name="auto-awesome" size={24} color={colors.text} />
          </TouchableOpacity>
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
          {pendingActions && pendingActions?.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.suggestionContainer}
                onPress={handleToggleSuggestions}
              >
                <Text style={styles.suggestionText}>{getSuggestionText()}</Text>
                <MaterialIcons
                  name={
                    isSuggestionsExpanded
                      ? "keyboard-arrow-down"
                      : "keyboard-arrow-up"
                  }
                  size={24}
                  color={colors.textSecondary}
                />
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
                  {pendingActions?.map((action, index) => (
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
          )}
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
  });
