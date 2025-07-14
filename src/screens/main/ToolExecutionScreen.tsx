import { useTheme } from "@/hooks/useTheme";
import { AppDispatch, RootState } from "@/store";
import {
  deleteToolExecutionAsync,
  fetchToolExecutionByIdAsync,
} from "@/store/slices/toolExecutionSlice";
import {
  parseEmailDraftFromToolExecution,
  ToolEndpointAction,
} from "@/types/toolExecution";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { ComposeEmail } from "../../components/tool-execution/ComposeEmail";
import { EditReplyEmail } from "../../components/tool-execution/EditReplyEmail";

type ToolExecutionScreenParams = {
  toolExecutionId: string;
  isReplyEdit?: boolean;
  isReply?: boolean;
  actionId?: string;
  userTaskId?: string;
  canBeDeleted?: boolean;
};

export const ToolExecutionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const {
    toolExecutionId,
    isReplyEdit,
    isReply,
    actionId,
    userTaskId,
    canBeDeleted,
  } = (route.params as ToolExecutionScreenParams) || {};
  const { width } = useWindowDimensions();

  const { currentToolExecution, isLoading } = useSelector(
    (state: RootState) => state.toolExecutions
  );

  // Change tracking state
  const [hasChanges, setHasChanges] = useState(false);
  const hasChangesRef = useRef(false);
  const isInitialRender = useRef(true);

  const styles = createStyles(colors);

  useEffect(() => {
    if (toolExecutionId) {
      dispatch(fetchToolExecutionByIdAsync(toolExecutionId));
    }
  }, [toolExecutionId, dispatch]);

  // Keep the ref in sync with the state
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);

  // Track when user leaves the screen
  useFocusEffect(
    React.useCallback(() => {
      // When screen comes into focus, reset change tracking
      isInitialRender.current = false;

      return () => {
        // When screen loses focus, check if we should delete the tool execution
        if (
          toolExecutionId &&
          !hasChangesRef.current &&
          canBeDeleted &&
          !isInitialRender.current
        ) {
          console.log("Deleting unused tool execution");

          dispatch(deleteToolExecutionAsync(toolExecutionId)).catch((error) => {
            console.warn("Failed to delete unused tool execution:", error);
          });
        }
      };
    }, [toolExecutionId, canBeDeleted, dispatch])
  );

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSendComplete = () => {
    navigation.goBack();
  };

  const handleDidChange = () => {
    setHasChanges(true);
    hasChangesRef.current = true;
    isInitialRender.current = false;
  };

  const getScreenTitle = () => {
    if (!currentToolExecution) return "Tool Execution";

    if (isReplyEdit || isReply) {
      // Try to get the email subject from the tool execution
      try {
        const emailDraft =
          parseEmailDraftFromToolExecution(currentToolExecution);
        if (emailDraft?.subject) {
          return emailDraft.subject;
        }
      } catch (error) {
        console.warn("Failed to parse email draft for title:", error);
      }
      return isReplyEdit ? "Edit Reply" : "Reply";
    }

    switch (currentToolExecution.toolEndpointAction) {
      case ToolEndpointAction.GMAIL_SEND:
        return "Compose Email";
      default:
        return "Tool Execution";
    }
  };

  const renderToolExecutionContent = () => {
    if (!currentToolExecution) return null;
    // Handle reply editing mode
    if (isReplyEdit && actionId && userTaskId) {
      return (
        <EditReplyEmail
          toolExecution={currentToolExecution}
          actionId={actionId}
          userTaskId={userTaskId}
          onFinishEditing={handleSendComplete}
          onDidChange={handleDidChange}
        />
      );
    }

    switch (currentToolExecution.toolEndpointAction) {
      case ToolEndpointAction.GMAIL_SEND:
        return (
          <ComposeEmail
            toolExecution={currentToolExecution}
            onSend={handleSendComplete}
            onDidChange={handleDidChange}
          />
        );
      default:
        return (
          <View style={styles.unsupportedContainer}>
            <MaterialIcons
              name="build"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.unsupportedTitle}>Tool Execution</Text>
            <Text style={styles.unsupportedText}>
              Action: {currentToolExecution.toolEndpointAction}
            </Text>
            <Text style={styles.unsupportedText}>
              This tool execution type is not yet supported in the mobile app.
            </Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentToolExecution) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF5722" />
          <Text style={styles.errorText}>Tool execution not found</Text>
          <TouchableOpacity style={styles.button} onPress={handleBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { maxWidth: width - 100 }]}
          numberOfLines={1}
        >
          {getScreenTitle()}
        </Text>
        <View style={styles.headerButton} />
      </View>

      {renderToolExecutionContent()}
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
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      color: "#FF5722",
      marginTop: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginRight: 12,
    },
    unsupportedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    unsupportedTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    unsupportedText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
