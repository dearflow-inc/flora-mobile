import { useAppDispatch } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  deleteUserTaskActionAsync,
  updateUserTaskActionDataAsync,
} from "@/store/slices/userTaskSlice";
import { UserTask, UserTaskAction } from "@/types/userTask";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface CreateTodoActionProps {
  action: UserTaskAction;
  userTask: UserTask;
}

export const CreateTodoAction: React.FC<CreateTodoActionProps> = ({
  action,
  userTask,
}) => {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const styles = createStyles(colors);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [title, setTitle] = useState(action.data?.title || "");
  const [deadline, setDeadline] = useState(
    action.data?.deadline
      ? new Date(action.data.deadline)
      : new Date(Date.now())
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
            actionData: newData,
          },
        })
      );
    }, 300);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    debouncedUpdate({ ...action.data, title: newTitle });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDeadline = new Date(selectedDate);
      newDeadline.setHours(deadline.getHours(), deadline.getMinutes());
      setDeadline(newDeadline);
      debouncedUpdate({
        ...action.data,
        deadline: newDeadline.toISOString(),
      });
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDeadline = new Date(deadline);
      newDeadline.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDeadline(newDeadline);
      debouncedUpdate({
        ...action.data,
        deadline: newDeadline.toISOString(),
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Action",
      "Are you sure you want to remove this todo action?",
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
              // Success - the action will be removed from the UI automatically
              // when the Redux store updates
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

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="add-task" size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Create Todo</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="Enter todo title..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Deadline</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons
                name="event"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.dateTimeButtonText}>
                {formatDate(deadline)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialIcons
                name="access-time"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.dateTimeButtonText}>
                {formatTime(deadline)}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Only render DateTimePicker components when they should be shown */}
      {showDatePicker && (
        <DateTimePicker
          value={deadline}
          mode="date"
          display="default"
          onChange={handleDateChange}
          textColor={Platform.OS === "ios" ? colors.text : undefined}
          themeVariant={
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined
          }
          positiveButton={
            Platform.OS === "android"
              ? {
                  label: "OK",
                  textColor: colors.text,
                }
              : undefined
          }
          negativeButton={
            Platform.OS === "android"
              ? {
                  label: "Cancel",
                  textColor: colors.text,
                }
              : undefined
          }
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={deadline}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          textColor={Platform.OS === "ios" ? colors.text : undefined}
          themeVariant={
            Platform.OS === "ios" ? (isDark ? "dark" : "light") : undefined
          }
          positiveButton={
            Platform.OS === "android"
              ? {
                  label: "OK",
                  textColor: colors.text,
                }
              : undefined
          }
          negativeButton={
            Platform.OS === "android"
              ? {
                  label: "Cancel",
                  textColor: colors.text,
                }
              : undefined
          }
        />
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
      opacity: 0.7,
    },
    content: {
      gap: 16,
    },
    fieldContainer: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
    },
    titleInput: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      fontSize: 14,
      color: colors.text,
      minHeight: 80,
    },
    dateTimeContainer: {
      flexDirection: "row",
      gap: 8,
    },
    dateTimeButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      gap: 8,
    },
    dateTimeButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    dateInput: {
      fontSize: 14,
      color: colors.text,
      flex: 1,
      minWidth: 0,
    },
  });
