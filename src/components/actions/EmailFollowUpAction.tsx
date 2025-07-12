import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  fetchToolExecutionByIdAsync,
  selectToolExecutionById,
} from "@/store/slices/toolExecutionSlice";
import {
  deleteUserTaskActionAsync,
  updateUserTaskActionDataAsync,
} from "@/store/slices/userTaskSlice";
import { AppStackParamList } from "@/types/navigation";
import { parseEmailDraftFromToolExecution } from "@/types/toolExecution";
import { UserTask, UserTaskAction } from "@/types/userTask";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import WebView from "react-native-webview";

interface EmailFollowUpActionProps {
  action: UserTaskAction;
  userTask: UserTask;
}

export const EmailFollowUpAction: React.FC<EmailFollowUpActionProps> = ({
  action,
  userTask,
}) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const styles = createStyles(colors);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get follow-up data from action data - try different possible field names
  const followUpData =
    action.data?.followUpUserTaskId ||
    action.data?.toolExecutionId ||
    action.data?.optionPicked;

  // Extract the actual tool execution ID
  const toolExecutionId =
    typeof followUpData === "string"
      ? followUpData
      : followUpData?.toolExecutionId || followUpData?.id;

  // Get the tool execution to show email body preview
  const toolExecution = useAppSelector((state) =>
    toolExecutionId ? selectToolExecutionById(state, toolExecutionId) : null
  );

  // Fetch tool execution if not in store
  useEffect(() => {
    if (toolExecutionId && !toolExecution) {
      dispatch(fetchToolExecutionByIdAsync(toolExecutionId));
    }
  }, [toolExecutionId, toolExecution, dispatch]);

  // Extract email body preview from tool execution
  const getEmailBodyPreview = () => {
    if (!toolExecution) return null;

    try {
      const emailDraft = parseEmailDraftFromToolExecution(toolExecution);
      return emailDraft.body;
    } catch (error) {
      console.error("Error parsing email draft:", error);
      return null;
    }
  };

  const emailBodyPreview = getEmailBodyPreview();

  const debouncedUpdate = (newData: any) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      dispatch(
        updateUserTaskActionDataAsync({
          userTaskId: userTask.id,
          request: {
            actionId: action.id,
            actionData: { ...action.data, ...newData },
          },
        })
      );
    }, 300);
  };

  const handleEditFollowUp = async () => {
    try {
      // Navigate to the tool execution screen with edit mode
      navigation.navigate("ToolExecution", {
        toolExecutionId: toolExecutionId,
        isReplyEdit: true,
        userTaskId: userTask.id,
        actionId: action.id,
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to open follow-up editor. Please try again."
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Action",
      "Are you sure you want to remove this follow-up action?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(
                deleteUserTaskActionAsync({
                  userTaskId: userTask.id,
                  actionId: action.id,
                })
              ).unwrap();
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to remove action. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="schedule" size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Follow Up Email</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Follow-up Email Preview */}
      {toolExecutionId && (
        <View style={styles.followUpContainer}>
          {emailBodyPreview ? (
            <TouchableOpacity
              style={styles.emailPreviewContainer}
              onPress={handleEditFollowUp}
              activeOpacity={0.7}
            >
              <WebView
                style={[styles.emailPreviewText, { minHeight: 200 }]}
                source={{
                  html: `<div style="font-family: system-ui; color: ${colors.text}; font-size: 24px; line-height: 24px;">${emailBodyPreview}</div>`,
                }}
                scrollEnabled={false}
              />
              <View style={styles.emailPreviewOverlay}>
                <View style={styles.emailPreviewOverlayContent}>
                  <MaterialIcons name="edit" size={16} color={colors.primary} />
                  <Text style={styles.emailPreviewOverlayText}>Edit</Text>
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading email preview...</Text>
            </View>
          )}
        </View>
      )}

      {!toolExecutionId && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No follow-up email data available.
          </Text>
          {/* Debug: Show raw action data */}
          <Text style={styles.debugText}>
            Debug - Action Data: {JSON.stringify(action.data, null, 2)}
          </Text>
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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginLeft: 8,
    },
    deleteButton: {
      padding: 4,
    },
    followUpContainer: {
      marginBottom: 16,
    },
    followUpHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    editButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    editButtonText: {
      fontSize: 12,
      color: colors.primary,
      marginLeft: 4,
    },
    emailPreviewContainer: {
      flex: 1,
      position: "relative",
    },
    emailPreviewText: {
      fontSize: 12,
      backgroundColor: "transparent",
      lineHeight: 16,
    },
    emailPreviewOverlay: {
      position: "absolute",
      bottom: 8,
      right: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    emailPreviewOverlayContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    emailPreviewOverlayText: {
      fontSize: 12,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: "500",
    },
    loadingContainer: {
      backgroundColor: colors.surface,
      borderRadius: 6,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    noDataContainer: {
      backgroundColor: colors.surface,
      borderRadius: 6,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    noDataText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    debugText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: "monospace",
      marginTop: 8,
    },
  });
