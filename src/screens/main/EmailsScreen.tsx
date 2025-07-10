import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Alert,
} from "react-native";
import {
  PanGestureHandler,
  State,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  selectEmailDrafts,
  createToolExecutionAsync,
} from "@/store/slices/toolExecutionSlice";
import {
  fetchMyEmailsAsync,
  fetchEmailsByIdsAsync,
} from "@/store/slices/emailSlice";
import {
  fetchUserTasksAsync,
  selectUserTasks,
  selectUserTasksLoading,
} from "@/store/slices/userTaskSlice";
import {
  fetchMyScenarios,
  selectContextViews,
  selectScenariosLoading,
} from "@/store/slices/scenariosSlice";
import { useNavigation } from "@react-navigation/native";
import {
  parseEmailDraftFromToolExecution,
  ToolEndpointAction,
  ParameterType,
} from "@/types/toolExecution";
import { UserTask } from "@/types/userTask";

// Components
import { Header, FloatingActionButton } from "@/components/ui";
import {
  TaskSidebar,
  ContextFilter,
  UserTaskItem,
  EmptyState,
} from "@/components/user-tasks";

// Hooks
import { useTheme } from "@/hooks/useTheme";
import { useSidebar } from "@/hooks/useSidebar";
import { useContextViews } from "@/hooks/useContextViews";
import { useSwipeHandler } from "@/hooks/useSwipeHandler";

// Utils
import { UserTaskFilter, getFilteredUserTasks } from "@/utils/taskUtils";

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

  const onPanGestureEvent = (event: any) => {
    const { translationX, velocityX, state, x, y } = event.nativeEvent;

    // Check if gesture starts within 50px of the left edge
    const isNearLeftEdge = x <= 30;

    // Check if gesture is in the context view area (header + context filter area)
    const contextViewAreaHeight = 120;
    const isInContextViewArea = y <= contextViewAreaHeight;

    if (state === State.BEGAN) {
      // If gesture starts near left edge, open sidebar
      if (isNearLeftEdge) {
        openSidebar();
        return;
      }
    }

    if (!sidebarVisible && (state === State.END || state === State.CANCELLED)) {
      if (!isInContextViewArea) {
        // Handle context view switching gestures only outside context view area
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
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create email draft. Please try again.");
    }
  };

  const handleTaskPress = (task: UserTask) => {
    navigation.navigate("UserTaskDetail", { userTaskId: task.id });
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

  const renderUserTask = ({ item }: { item: UserTask }) => (
    <UserTaskItem
      task={item}
      emails={emails}
      swipeAnimation={getOrCreateSwipeAnimation(item.id)}
      onSwipeEvent={handleSwipeEvent}
      onPress={handleTaskPress}
      onDelete={handleDeleteTaskLocal}
      onArchive={handleArchiveTask}
    />
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onPanGestureEvent}>
        <SafeAreaView style={styles.container}>
          <Header
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onMenuPress={openSidebar}
          />

          <ContextFilter
            contextViews={getContextViewList()}
            selectedContextViewId={selectedContextViewId}
            contextViewSwitchAnimation={contextViewSwitchAnimation}
            onContextViewSelect={setSelectedContextViewId}
            onSwitchToNext={switchToNextContextView}
            onSwitchToPrevious={switchToPreviousContextView}
          />

          {filteredUserTasks.length === 0 && !isLoading && <EmptyState />}

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
        </SafeAreaView>
      </PanGestureHandler>

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
  });
