import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  fetchTodoByIdAsync,
  updateTodoAsync,
  updateTodoStateAsync,
  clearError,
  clearCurrentTodo,
} from "@/store/slices/todoSlice";
import { Todo, TodoState } from "@/types/todo";
import { AppStackParamList } from "@/types/navigation";
import { useTheme } from "@/hooks/useTheme";

type TodoDetailScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "TodoDetail"
>;

type TodoDetailScreenRouteProp = RouteProp<AppStackParamList, "TodoDetail">;

export const TodoDetailScreen = () => {
  const navigation = useNavigation<TodoDetailScreenNavigationProp>();
  const route = useRoute<TodoDetailScreenRouteProp>();
  const { todoId } = route.params;

  const dispatch = useAppDispatch();
  const { currentTodo, isLoading, isUpdating, error } = useAppSelector(
    (state) => state.todos
  );
  const { colors } = useTheme();

  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    if (todoId) {
      dispatch(fetchTodoByIdAsync(todoId));
    }

    return () => {
      dispatch(clearCurrentTodo());
    };
  }, [todoId, dispatch]);

  useEffect(() => {
    if (currentTodo) {
      setTitle(currentTodo.title);
      setDeadline(
        currentTodo.deadline
          ? new Date(currentTodo.deadline).toISOString().split("T")[0]
          : ""
      );
    }
  }, [currentTodo]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (currentTodo) {
      const hasChanges =
        title !== currentTodo.title ||
        deadline !==
          (currentTodo.deadline
            ? new Date(currentTodo.deadline).toISOString().split("T")[0]
            : "");
      setHasUnsavedChanges(hasChanges);
    }
  }, [title, deadline, currentTodo]);

  const handleSave = async () => {
    if (!currentTodo) return;

    // Dismiss the keyboard first
    Keyboard.dismiss();

    try {
      await dispatch(
        updateTodoAsync({
          id: currentTodo.id,
          data: {
            title: title.trim(),
            dueDate: deadline ? new Date(deadline) : undefined,
          },
        })
      ).unwrap();
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to update todo:", error);
    }
  };

  const handleComplete = async () => {
    if (!currentTodo) return;

    const newState =
      currentTodo.state === TodoState.DONE ? TodoState.PENDING : TodoState.DONE;

    try {
      await dispatch(
        updateTodoStateAsync({
          id: currentTodo.id,
          data: { state: newState },
        })
      ).unwrap();

      // Close the detail view when marking as complete
      if (newState === TodoState.DONE) {
        navigation.goBack();
      }
    } catch (error) {
      console.error("Failed to update todo state:", error);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Do you want to save them before leaving?",
        [
          {
            text: "Discard",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
          { text: "Cancel", style: "cancel" },
          { text: "Save", onPress: handleSave },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading todo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentTodo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF5722" />
          <Text style={styles.errorText}>Todo not found</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isCompleted = currentTodo.state === TodoState.DONE;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Note</Text>
          <View
            style={[
              styles.statusBadge,
              isCompleted ? styles.completedBadge : styles.pendingBadge,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCompleted
                  ? styles.completedStatusText
                  : styles.pendingStatusText,
              ]}
            >
              {isCompleted ? "Done" : "Pending"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {hasUnsavedChanges && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <MaterialIcons name="save" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.dueDateContainer}>
          <MaterialIcons name="event" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.dueDateInput}
            value={deadline}
            onChangeText={setDeadline}
            placeholder="Due date (YYYY-MM-DD)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
          />
        </View>

        <TextInput
          style={styles.noteInput}
          value={title}
          onChangeText={setTitle}
          placeholder="Start typing your note..."
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          scrollEnabled={false}
        />
      </View>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isCompleted ? styles.pendingButton : styles.completeButton,
          ]}
          onPress={handleComplete}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons
                name={isCompleted ? "undo" : "check"}
                size={18}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>
                {isCompleted ? "Pending" : "Complete"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    backButton: {
      padding: 4,
      minWidth: 40,
    },
    headerCenter: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    headerRight: {
      minWidth: 40,
      alignItems: "flex-end",
    },
    saveButton: {
      padding: 4,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    completedBadge: {
      backgroundColor: "#E8F5E8",
    },
    pendingBadge: {
      backgroundColor: "#FFF3E0",
    },
    statusText: {
      fontSize: 12,
      fontWeight: "500",
    },
    completedStatusText: {
      color: "#4CAF50",
    },
    pendingStatusText: {
      color: "#FF9800",
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    dueDateContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dueDateInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: colors.textSecondary,
      padding: 0,
    },
    noteInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      padding: 0,
      margin: 0,
    },
    bottomActions: {
      flexDirection: "row",
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    completeButton: {
      backgroundColor: "#4CAF50",
    },
    pendingButton: {
      backgroundColor: "#FF9800",
    },
    deleteButton: {
      backgroundColor: "#FF5722",
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
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
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
