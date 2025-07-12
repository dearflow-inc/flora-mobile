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
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WebView from "react-native-webview";

interface EmailReplyActionProps {
  action: UserTaskAction;
  userTask: UserTask;
}

export const EmailReplyAction: React.FC<EmailReplyActionProps> = ({
  action,
  userTask,
}) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const styles = createStyles(colors);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get options and selected option from action data
  const options = action.data?.options || [];
  const [localSelectedOption, setLocalSelectedOption] = useState(
    action.data?.optionPicked
  );
  const selectedOption = localSelectedOption || action.data?.optionPicked;
  const replyContent = action.data?.reply || "";

  // Get the selected tool execution to show email body preview
  const selectedToolExecution = useAppSelector((state) =>
    selectedOption && typeof selectedOption === "string"
      ? selectToolExecutionById(state, selectedOption)
      : null
  );

  // Fetch tool execution if not in store
  useEffect(() => {
    if (
      selectedOption &&
      typeof selectedOption === "string" &&
      !selectedToolExecution
    ) {
      dispatch(fetchToolExecutionByIdAsync(selectedOption));
    }
  }, [selectedOption, selectedToolExecution, dispatch]);

  // Extract email body preview from tool execution
  const getEmailBodyPreview = () => {
    if (!selectedToolExecution) return null;

    try {
      const emailDraft = parseEmailDraftFromToolExecution(
        selectedToolExecution
      );
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

  const handleOptionSelect = (option: any) => {
    // Handle both string and object options
    const optionValue =
      typeof option === "string"
        ? option
        : option.toolExecutionId || option.title || option;

    // Update local state immediately for instant UI feedback
    setLocalSelectedOption(optionValue);

    // Debounce the backend update
    debouncedUpdate({ optionPicked: optionValue });
  };

  const handleEditReply = async () => {
    try {
      // Navigate to the tool execution screen with edit mode
      navigation.navigate("ToolExecution", {
        toolExecutionId: selectedOption,
        isReplyEdit: true,
        userTaskId: userTask.id,
        actionId: action.id,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to open reply editor. Please try again.");
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Action",
      "Are you sure you want to remove this reply action?",
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
          <MaterialIcons name="reply" size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Reply to Email</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Options Chips */}
      {options.length > 0 && (
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Reply Options:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.optionsScrollView}
          >
            {options.map((option: any, index: number) => {
              // Handle both string and object options
              const optionText =
                typeof option === "string"
                  ? option
                  : option.title || "Unknown Option";
              const optionValue =
                typeof option === "string"
                  ? option
                  : option.toolExecutionId || option.title || option;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionChip,
                    selectedOption === optionValue && styles.selectedOptionChip,
                  ]}
                  onPress={() => handleOptionSelect(optionValue)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedOption === optionValue &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {optionText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Reply Content */}
      {replyContent && (
        <View style={styles.replyContainer}>
          <View style={styles.replyHeader}>
            <Text style={styles.sectionTitle}>Reply Content:</Text>
            <TouchableOpacity
              onPress={handleEditReply}
              style={styles.editButton}
            >
              <MaterialIcons name="edit" size={16} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.replyContent}>
            <Text style={styles.replyText} numberOfLines={4}>
              {typeof replyContent === "string"
                ? replyContent.replace(/<[^>]*>/g, "")
                : JSON.stringify(replyContent)}
            </Text>
            <TouchableOpacity
              onPress={handleEditReply}
              style={styles.editOverlay}
            >
              <View style={styles.editOverlayContent}>
                <MaterialIcons name="edit" size={20} color={colors.primary} />
                <Text style={styles.editOverlayText}>Click to edit reply</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Selected Option Display */}
      {selectedOption && (
        <View style={styles.selectedOptionContainer}>
          {emailBodyPreview ? (
            <TouchableOpacity
              style={styles.emailPreviewContainer}
              onPress={handleEditReply}
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
            <Text style={styles.selectedOptionValue}>
              {typeof selectedOption === "string"
                ? selectedOption
                : selectedOption.title || selectedOption}
            </Text>
          )}
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
    optionsContainer: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    optionsScrollView: {
      flexDirection: "row",
    },
    optionChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    selectedOptionChip: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    optionText: {
      fontSize: 12,
      color: colors.text,
    },
    selectedOptionText: {
      color: "#FFFFFF",
      fontWeight: "600",
    },
    replyContainer: {
      marginBottom: 16,
    },
    replyHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
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
    replyContent: {
      position: "relative",
      backgroundColor: colors.surface,
      borderRadius: 6,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    replyText: {
      fontSize: 13,
      color: colors.text,
      lineHeight: 18,
    },
    editOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background + "80",
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
    },
    editOverlayContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    editOverlayText: {
      fontSize: 12,
      color: colors.primary,
      marginLeft: 4,
      fontWeight: "500",
    },
    selectedOptionContainer: {
      flexDirection: "column",
      backgroundColor: colors.primary + "20",
      padding: 8,
      borderRadius: 6,
    },
    selectedOptionLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.success,
      marginBottom: 4,
    },
    selectedOptionValue: {
      fontSize: 12,
      color: colors.success,
    },
    emailPreviewContainer: {
      flex: 1,
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
  });
