import { AppDispatch, RootState } from "@/store";
import {
  fetchEmailsByIdsAsync,
  fetchMyEmailsAsync,
} from "@/store/slices/emailSlice";
import {
  fetchMyScenarios,
  selectContextViews,
  selectScenariosLoading,
} from "@/store/slices/scenariosSlice";
import {
  createToolExecutionAsync,
  fetchMyToolExecutionsAsync,
  selectEmailDrafts,
} from "@/store/slices/toolExecutionSlice";
import {
  fetchUserTasksAsync,
  selectUserTasks,
  selectUserTasksLoading,
} from "@/store/slices/userTaskSlice";
import { AuthorType, EmailLabel, EmailWithoutContent } from "@/types/email";
import {
  ParameterType,
  parseEmailDraftFromToolExecution,
  ToolEndpointAction,
  ToolExecution,
} from "@/types/toolExecution";
import { UserTask, UserTaskType } from "@/types/userTask";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
  State,
} from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";

// Components
import { EmailDraftItem } from "@/components/emails/EmailDraftItem";
import { EmailItem } from "@/components/emails/EmailItem";
import { FloatingActionButton, Header } from "@/components/ui";
import {
  ContextFilter,
  EmptyState,
  TaskSidebar,
  UserTaskItem,
} from "@/components/user-tasks";

// Hooks
import { useContextViews } from "@/hooks/useContextViews";
import { useSidebar } from "@/hooks/useSidebar";
import { useSwipeHandler } from "@/hooks/useSwipeHandler";
import { useTheme } from "@/hooks/useTheme";

// Utils
import { getFilteredUserTasks, UserTaskFilter } from "@/utils/taskUtils";

export const EmailsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<UserTaskFilter>("inbox");

  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  // Redux selectors
  const { emails, isLoading: emailsLoading } = useSelector(
    (state: RootState) => state.emails
  );
  const drafts = useSelector(selectEmailDrafts);
  const userTasks = useSelector(selectUserTasks);
  const isLoading = useSelector(selectUserTasksLoading);
  const contextViews = useSelector(selectContextViews);
  const scenariosLoading = useSelector(selectScenariosLoading);

  // Custom hooks
  const {
    sidebarVisible,
    sidebarTranslateX,
    openSidebar,
    closeSidebar,
    SIDEBAR_WIDTH,
  } = useSidebar();

  const {
    selectedContextViewId,
    setSelectedContextViewId,
    contextViewSwitchAnimation,
    getContextViewList,
    switchToNextContextView,
    switchToPreviousContextView,
  } = useContextViews(contextViews || []);

  // Swipe handler
  const {
    getOrCreateSwipeAnimation,
    handleSwipeEvent,
    handleArchiveTaskWithData,
    handleDeleteTask,
  } = useSwipeHandler();

  const styles = createStyles(colors);

  useEffect(() => {
    dispatch(fetchUserTasksAsync({}));
    dispatch(fetchMyEmailsAsync());
    dispatch(fetchMyScenarios());
  }, []);

  // Fetch data when filter changes
  useEffect(() => {
    // Always fetch user tasks for inbox, archived, and snoozed filters
    if (
      activeFilter === "inbox" ||
      activeFilter === "archived" ||
      activeFilter === "snoozed"
    ) {
      dispatch(fetchUserTasksAsync({}));
      dispatch(fetchMyScenarios());
    }

    // Fetch emails for sent and trash filters
    if (activeFilter === "sent" || activeFilter === "trash") {
      dispatch(fetchMyEmailsAsync());
    }

    // Fetch tool executions (drafts) for draft filter
    if (activeFilter === "draft") {
      dispatch(fetchMyToolExecutionsAsync());
    }
  }, [activeFilter, dispatch]);

  // Auto-select context view to null when inbox filter is selected
  useEffect(() => {
    if (activeFilter === "inbox") {
      setSelectedContextViewId(null);
    }
  }, [activeFilter, setSelectedContextViewId]);

  // Fetch missing emails by IDs when user tasks reference emails that aren't in the store
  useEffect(() => {
    const emailIdsToFetch = userTasks
      .map((task) => {
        const emailContext = task.context.find((ctx) => ctx.type === "email");
        return emailContext?.emailId;
      })
      .filter(
        (id): id is string => !!id && !emails.find((email) => email.id === id)
      );

    if (emailIdsToFetch.length > 0) {
      dispatch(fetchEmailsByIdsAsync(emailIdsToFetch));
    }
  }, [userTasks.length, emails.length]);

  const [startedLeftSwipe, setStartedLeftSwipe] = useState(false);
  const onPanGestureEvent = (event: any) => {
    const { translationX, translationY, velocityX, state, x } =
      event.nativeEvent;

    // Check if gesture starts within 50px of the left edge
    const isNearLeftEdge = x <= 30;

    // Only handle horizontal gestures, let vertical gestures pass through to FlatList
    const isHorizontalGesture = Math.abs(translationX) > Math.abs(translationY);

    if (state === State.BEGAN) {
      if (isNearLeftEdge) {
        setStartedLeftSwipe(true);
      }
    }

    if (
      startedLeftSwipe &&
      (state === State.END || state === State.CANCELLED)
    ) {
      // If gesture starts near left edge, open sidebar
      if (Math.abs(velocityX) > 20) {
        openSidebar();
      }
      setStartedLeftSwipe(false);
      return;
    }

    if (!sidebarVisible && (state === State.END || state === State.CANCELLED)) {
      // Only handle horizontal gestures for context view switching
      if (isHorizontalGesture) {
        const minSwipeDistance = 50;
        const minVelocity = 300;

        if (
          Math.abs(translationX) > minSwipeDistance ||
          Math.abs(velocityX) > minVelocity
        ) {
          if (translationX > 0 || velocityX > 0) {
            // Right swipe - go to previous context view
            switchToPreviousContextView();
          } else {
            // Left swipe - go to next context view
            switchToNextContextView();
          }
        }
      }
    }
  };

  const handleCreateEmail = async () => {
    try {
      const toolExecution = await dispatch(
        createToolExecutionAsync({
          toolEndpointAction: ToolEndpointAction.GMAIL_SEND,
          input: [
            {
              parameterId: "to",
              type: ParameterType.ARRAY,
              value: "[]",
            },
            {
              parameterId: "subject",
              type: ParameterType.STRING,
              value: "",
            },
            {
              parameterId: "body",
              type: ParameterType.ARRAY,
              value: "[]",
            },
          ],
          internalListeners: [],
        })
      ).unwrap();

      navigation.navigate("ToolExecution", {
        toolExecutionId: toolExecution.id,
        canBeDeleted: true,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create email draft. Please try again.");
    }
  };

  const handleTaskPress = (task: UserTask) => {
    // For completed tasks, check if it's email-related and not EMAIL_CLEAN_UP
    if (activeFilter === "archived") {
      const isEmailRelated = task.context.some((ctx) => ctx.type === "email");
      const isEmailCleanUp = task.type === UserTaskType.EMAIL_CLEAN_UP;

      if (isEmailRelated && !isEmailCleanUp) {
        // Get the email from context to get the threadId
        const emailContext = task.context.find((ctx) => ctx.type === "email");
        const relatedEmail = emails.find(
          (email) => email.id === emailContext?.emailId
        );

        if (relatedEmail?.threadId) {
          navigation.navigate("EmailThreadDetail", {
            threadId: relatedEmail.threadId,
          });
          return;
        }
      }
    }

    // Default navigation to UserTaskDetail with filter context
    navigation.navigate("UserTaskDetail", {
      userTaskId: task.id,
      activeFilter,
      selectedContextViewId,
      searchQuery,
    });
  };

  const handleDeleteTaskLocal = async (taskId: string) => {
    try {
      await handleDeleteTask(taskId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete task. Please try again.");
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      await handleArchiveTaskWithData(taskId, userTasks);
    } catch (error) {
      Alert.alert("Error", "Failed to archive task. Please try again.");
    }
  };

  const handleFilterSelect = (filter: UserTaskFilter) => {
    setActiveFilter(filter);
    closeSidebar();
  };

  const filteredUserTasks = getFilteredUserTasks(
    userTasks,
    activeFilter,
    selectedContextViewId,
    searchQuery
  );

  // Calculate counts for sent and trashed emails
  const sentEmailsCount = emails.filter(
    (email) => email.from.type === AuthorType.PROFILE
  ).length;

  const trashedEmailsCount = emails.filter(
    (email) =>
      email.externalLabels?.includes(EmailLabel.TRASH) ||
      email.status?.internalDeleted === true
  ).length;

  // Filter emails for sent and trash filters
  const filteredEmails = emails
    .filter((email) => {
      if (activeFilter === "sent") {
        // Show only outgoing emails for sent filter
        return email.from.type === AuthorType.PROFILE;
      } else if (activeFilter === "trash") {
        // Show only trashed emails for trash filter
        return (
          email.externalLabels?.includes(EmailLabel.TRASH) ||
          email.status?.internalDeleted === true
        );
      }
      return false;
    })
    .filter((email) => {
      if (!searchQuery) return true;
      const searchLower = searchQuery.toLowerCase();
      return (
        email.subject?.toLowerCase().includes(searchLower) ||
        email.previewText?.toLowerCase().includes(searchLower) ||
        email.to.some((r) =>
          r.meta?.email?.toLowerCase().includes(searchLower)
        ) ||
        email.cc.some((r) =>
          r.meta?.email?.toLowerCase().includes(searchLower)
        ) ||
        email.bcc.some((r) =>
          r.meta?.email?.toLowerCase().includes(searchLower)
        )
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.sent);
      const bDate = new Date(b.sent);
      return bDate.getTime() - aDate.getTime();
    });

  // Filter email drafts based on search query
  const filteredEmailDrafts = drafts
    .filter((draft) => {
      if (!searchQuery) return true;

      const emailData = parseEmailDraftFromToolExecution(draft);
      const searchLower = searchQuery.toLowerCase();

      return (
        emailData.subject?.toLowerCase().includes(searchLower) ||
        emailData.body?.toLowerCase().includes(searchLower) ||
        emailData.to.some((r) => r.email.toLowerCase().includes(searchLower)) ||
        emailData.cc.some((r) => r.email.toLowerCase().includes(searchLower)) ||
        emailData.bcc.some((r) => r.email.toLowerCase().includes(searchLower))
      );
    })
    .sort((a, b) => {
      const aDate = new Date(a.updatedAt);
      const bDate = new Date(b.updatedAt);
      return bDate.getTime() - aDate.getTime();
    });

  const renderUserTask = ({ item }: { item: UserTask }) => (
    <UserTaskItem
      task={item}
      emails={emails}
      onPress={handleTaskPress}
      onDelete={handleDeleteTaskLocal}
      onArchive={handleArchiveTask}
      activeFilter={activeFilter}
    />
  );

  const renderEmailDraft = ({ item }: { item: ToolExecution }) => {
    // Check if this draft has a referenceDfEmailId (indicating it's a reply)
    const hasReferenceDfEmailId = item.input.some(
      (param) => param.parameterId === "referenceDfEmailId" && param.value
    );

    return (
      <EmailDraftItem
        key={item.id}
        toolExecution={item}
        onPress={(toolExecution) => {
          navigation.navigate("ToolExecution", {
            toolExecutionId: toolExecution.id,
            isReply: hasReferenceDfEmailId,
          });
        }}
      />
    );
  };

  const renderEmail = ({ item }: { item: EmailWithoutContent }) => (
    <EmailItem
      key={item.id}
      email={item}
      swipeAnimation={getOrCreateSwipeAnimation(item.id)}
      onSwipeEvent={handleSwipeEvent}
      onPress={(email) => {
        // Navigate to email thread if threadId exists
        if (email.threadId) {
          navigation.navigate("EmailThreadDetail", {
            threadId: email.threadId,
          });
        } else {
          // Fallback to alert if no threadId
          Alert.alert("Email", `Subject: ${email.subject}`);
        }
      }}
    />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuPress={openSidebar}
        />

        {/* Only show ContextFilter when not in drafts mode */}
        {activeFilter !== "draft" &&
          activeFilter !== "sent" &&
          activeFilter !== "trash" && (
            <ContextFilter
              contextViews={getContextViewList()}
              selectedContextViewId={selectedContextViewId}
              contextViewSwitchAnimation={contextViewSwitchAnimation}
              onContextViewSelect={setSelectedContextViewId}
              onSwitchToNext={switchToNextContextView}
              onSwitchToPrevious={switchToPreviousContextView}
            />
          )}

        <PanGestureHandler
          onHandlerStateChange={onPanGestureEvent}
          activeOffsetX={[-20, 20]}
          failOffsetY={[-20, 20]}
        >
          <View style={styles.contentContainer}>
            {/* Show email drafts when draft filter is active */}
            {activeFilter === "draft" && (
              <>
                {filteredEmailDrafts.length === 0 && !isLoading && (
                  <View style={styles.emptyStateContainer}>
                    <MaterialIcons
                      name="drafts"
                      size={64}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.emptyStateTitle}>No Drafts</Text>
                    <Text style={styles.emptyStateText}>
                      You do not have any email drafts yet.
                    </Text>
                  </View>
                )}

                {filteredEmailDrafts.length > 0 && (
                  <FlatList
                    data={filteredEmailDrafts}
                    renderItem={renderEmailDraft}
                    keyExtractor={(item) => item.id}
                    style={styles.emailsList}
                    contentContainerStyle={styles.emailsContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={isLoading}
                    onRefresh={() => {
                      dispatch(fetchMyToolExecutionsAsync());
                    }}
                  />
                )}
              </>
            )}

            {/* Show sent emails when sent filter is active */}
            {activeFilter === "sent" && (
              <>
                {filteredEmails.length === 0 && !emailsLoading && (
                  <View style={styles.emptyStateContainer}>
                    <MaterialIcons
                      name="send"
                      size={64}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.emptyStateTitle}>No Sent Emails</Text>
                    <Text style={styles.emptyStateText}>
                      You have not sent any emails yet.
                    </Text>
                  </View>
                )}

                {filteredEmails.length > 0 && (
                  <FlatList
                    data={filteredEmails}
                    renderItem={renderEmail}
                    keyExtractor={(item) => item.id}
                    style={styles.emailsList}
                    contentContainerStyle={styles.emailsContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={emailsLoading}
                    onRefresh={() => {
                      dispatch(fetchMyEmailsAsync());
                    }}
                  />
                )}
              </>
            )}

            {/* Show trashed emails when trash filter is active */}
            {activeFilter === "trash" && (
              <>
                {filteredEmails.length === 0 && !emailsLoading && (
                  <View style={styles.emptyStateContainer}>
                    <MaterialIcons
                      name="delete"
                      size={64}
                      color={colors.textSecondary}
                    />
                    <Text style={styles.emptyStateTitle}>
                      No Trashed Emails
                    </Text>
                    <Text style={styles.emptyStateText}>
                      You do not have any trashed emails.
                    </Text>
                  </View>
                )}

                {filteredEmails.length > 0 && (
                  <FlatList
                    data={filteredEmails}
                    renderItem={renderEmail}
                    keyExtractor={(item) => item.id}
                    style={styles.emailsList}
                    contentContainerStyle={styles.emailsContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={emailsLoading}
                    onRefresh={() => {
                      dispatch(fetchMyEmailsAsync());
                    }}
                  />
                )}
              </>
            )}

            {/* Show user tasks for other filters (not draft, not sent, not trash) */}
            {activeFilter !== "draft" &&
              activeFilter !== "sent" &&
              activeFilter !== "trash" && (
                <>
                  {filteredUserTasks.length === 0 && !isLoading && (
                    <EmptyState />
                  )}

                  {filteredUserTasks.length > 0 && (
                    <FlatList
                      data={filteredUserTasks}
                      renderItem={renderUserTask}
                      keyExtractor={(item) => item.id}
                      style={styles.emailsList}
                      contentContainerStyle={styles.emailsContainer}
                      showsVerticalScrollIndicator={false}
                      refreshing={isLoading || scenariosLoading}
                      onRefresh={() => {
                        dispatch(fetchUserTasksAsync({}));
                        dispatch(fetchMyScenarios());
                      }}
                    />
                  )}
                </>
              )}
          </View>
        </PanGestureHandler>
      </SafeAreaView>

      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={closeSidebar}
          activeOpacity={1}
        />
      )}

      <TaskSidebar
        sidebarTranslateX={sidebarTranslateX}
        sidebarVisible={sidebarVisible}
        activeFilter={activeFilter}
        userTasks={userTasks}
        emailDraftsCount={drafts.length}
        sentEmailsCount={sentEmailsCount}
        trashedEmailsCount={trashedEmailsCount}
        onFilterSelect={handleFilterSelect}
        onClose={closeSidebar}
      />

      <FloatingActionButton
        onPress={handleCreateEmail}
        icon="add"
        text="Compose"
      />
    </GestureHandlerRootView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contentContainer: {
      flex: 1,
    },
    emailsList: {
      flex: 1,
    },
    emailsContainer: {
      paddingTop: 0,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 50,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
  });
