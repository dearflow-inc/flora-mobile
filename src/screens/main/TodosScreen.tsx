import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  clearError,
  fetchTodosAsync,
  updateTodoStateAsync,
} from "@/store/slices/todoSlice";
import { AppStackParamList } from "@/types/navigation";
import { Todo, TodoSortBy, TodoState } from "@/types/todo";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TodosScreenNavigationProp = NativeStackNavigationProp<
  AppStackParamList,
  "Main"
>;

export const TodosScreen = () => {
  const navigation = useNavigation<TodosScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { todos, isLoading, error, totalTodos, hasMore, currentPage } =
    useAppSelector((state) => state.todos);
  const { colors } = useTheme();

  const [refreshing, setRefreshing] = useState(false);
  const styles = createStyles(colors);

  useEffect(() => {
    // Set up the todo service with auth token when user changes
    if (isAuthenticated) {
      // The auth token should be set by the auth slice
      loadTodos(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const loadTodos = async (refresh: boolean = false) => {
    const page = refresh ? 0 : currentPage;
    try {
      await dispatch(
        fetchTodosAsync({
          page,
          limit: 20,
          sortBy: TodoSortBy.MOST_URGENT,
          refresh,
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to load todos:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTodos(true);
    setRefreshing(false);
  };

  const handleTodoPress = (todo: Todo) => {
    navigation.navigate("TodoDetail", { todoId: todo.id });
  };

  const handleToggleTodo = async (todo: Todo) => {
    const newState =
      todo.state === TodoState.DONE ? TodoState.PENDING : TodoState.DONE;

    try {
      await dispatch(
        updateTodoStateAsync({
          id: todo.id,
          data: { state: newState },
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to update todo state:", error);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Tomorrow";
    } else if (diffDays === -1) {
      return "Yesterday";
    } else if (diffDays < 0) {
      return `${Math.abs(diffDays)} days ago`;
    } else {
      return `${diffDays} days`;
    }
  };

  const sortedTodos = [...todos].sort((a, b) => {
    // Sort by deadline, with items without deadline at the end
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const isCompleted = item.state === TodoState.DONE;
    const formattedDate = formatDate(item.deadline?.toString());
    const isOverdue =
      item.deadline && new Date(item.deadline) < new Date() && !isCompleted;

    return (
      <TouchableOpacity
        style={[styles.todoItem, isCompleted && styles.completedTodoItem]}
        onPress={() => handleTodoPress(item)}
      >
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => handleToggleTodo(item)}
        >
          <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
            {isCompleted && (
              <MaterialIcons name="check" size={16} color="#FFFFFF" />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.todoContent}>
          <Text
            style={[styles.todoTitle, isCompleted && styles.completedTodoTitle]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {formattedDate && (
            <Text
              style={[
                styles.todoDate,
                isOverdue && styles.overdueTodoDate,
                isCompleted && styles.completedTodoDate,
              ]}
            >
              {formattedDate}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.detailButton}
          onPress={() => handleTodoPress(item)}
        >
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons
        name="check-circle-outline"
        size={64}
        color={colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>No todos yet</Text>
      <Text style={styles.emptySubtitle}>
        Your todos will appear here once you create them
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Todos</Text>
        <Text style={styles.headerSubtitle}>
          {totalTodos} {totalTodos === 1 ? "item" : "items"}
        </Text>
      </View>

      {isLoading && todos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading todos...</Text>
        </View>
      ) : (
        <FlatList
          data={sortedTodos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          /* onEndReached={() => {
            if (hasMore && !isLoading) {
              loadTodos(false);
            }
          }} */
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={() =>
            isLoading && todos.length > 0 ? (
              <View style={styles.loadingMore}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
        />
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
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
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
    listContainer: {
      padding: 16,
    },
    todoItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    completedTodoItem: {
      opacity: 0.7,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    checkedBox: {
      backgroundColor: "#4CAF50",
      borderColor: "#4CAF50",
    },
    todoContent: {
      flex: 1,
    },
    todoTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 4,
    },
    completedTodoTitle: {
      textDecorationLine: "line-through",
      color: colors.textSecondary,
    },
    todoDate: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    overdueTodoDate: {
      color: "#FF5722",
      fontWeight: "500",
    },
    completedTodoDate: {
      color: colors.textSecondary,
    },
    detailButton: {
      padding: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 100,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
      paddingHorizontal: 40,
    },
    loadingMore: {
      padding: 20,
      alignItems: "center",
    },
  });
