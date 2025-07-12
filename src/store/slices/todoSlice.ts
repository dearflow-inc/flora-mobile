import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Todo,
  TodosResponse,
  CreateTodoRequest,
  UpdateTodoRequest,
  UpdateTodoStateRequest,
  TodoSortBy,
} from "@/types/todo";
import { todoService } from "@/services/todoService";

interface TodoState {
  todos: Todo[];
  currentTodo: Todo | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  error: string | null;
  totalTodos: number;
  currentPage: number;
  hasMore: boolean;
}

const initialState: TodoState = {
  todos: [],
  currentTodo: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  error: null,
  totalTodos: 0,
  currentPage: 0,
  hasMore: true,
};

// Async thunks
export const fetchTodosAsync = createAsyncThunk<
  TodosResponse,
  {
    page?: number;
    limit?: number;
    sortBy?: TodoSortBy;
    refresh?: boolean;
  },
  { rejectValue: string }
>(
  "todos/fetchTodos",
  async (
    { page = 0, limit = 10, sortBy = TodoSortBy.MOST_URGENT, refresh = false },
    { rejectWithValue }
  ) => {
    try {
      const response = await todoService.getTodos(page, limit, sortBy);

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch todos");
    }
  }
);

export const fetchTodoByIdAsync = createAsyncThunk<
  Todo,
  string,
  { rejectValue: string }
>("todos/fetchTodoById", async (id, { rejectWithValue }) => {
  try {
    const response = await todoService.getTodoById(id);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch todo");
  }
});

export const createTodoAsync = createAsyncThunk<
  Todo,
  CreateTodoRequest,
  { rejectValue: string }
>("todos/createTodo", async (todoData, { rejectWithValue }) => {
  try {
    const response = await todoService.createTodo(todoData);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create todo");
  }
});

export const updateTodoAsync = createAsyncThunk<
  Todo,
  { id: string; data: UpdateTodoRequest },
  { rejectValue: string }
>("todos/updateTodo", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await todoService.updateTodo(id, data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update todo");
  }
});

export const updateTodoStateAsync = createAsyncThunk<
  Todo,
  { id: string; data: UpdateTodoStateRequest },
  { rejectValue: string }
>("todos/updateTodoState", async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await todoService.updateTodoState(id, data);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update todo state");
  }
});

export const todoSlice = createSlice({
  name: "todos",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentTodo: (state, action: PayloadAction<Todo | null>) => {
      state.currentTodo = action.payload;
    },
    clearCurrentTodo: (state) => {
      state.currentTodo = null;
    },
    resetTodos: (state) => {
      state.todos = [];
      state.currentPage = 1;
      state.hasMore = true;
      state.totalTodos = 0;
    },

    updateTodoFromWebSocket: (state, action: PayloadAction<Todo>) => {
      const todo = action.payload;
      const existingIndex = state.todos.findIndex((t) => t.id === todo.id);

      // If todo is dropped/deleted, remove it from the list
      if (todo.state === "dropped") {
        if (existingIndex !== -1) {
          state.todos.splice(existingIndex, 1);
          state.totalTodos -= 1;
        }
        // Clear current todo if it's the one being removed
        if (state.currentTodo?.id === todo.id) {
          state.currentTodo = null;
        }
      } else {
        // If todo doesn't exist, add it (create case)
        if (existingIndex === -1) {
          state.todos.unshift(todo);
          state.totalTodos += 1;
        } else {
          // Update existing todo
          state.todos[existingIndex] = todo;
        }

        // Also update current todo if it's the same one
        if (state.currentTodo?.id === todo.id) {
          state.currentTodo = todo;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Todos
      .addCase(fetchTodosAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodosAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        const { todos, total } = action.payload;

        if (action.meta.arg.refresh || action.meta.arg.page === 0) {
          state.todos = todos;
          state.currentPage = 0;
        } else {
          state.todos = [...state.todos, ...todos];
        }

        state.totalTodos = total;
        state.hasMore = state.todos.length < total;
        state.currentPage = action.meta.arg.page || 0;
      })
      .addCase(fetchTodosAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch todos";
      })
      // Fetch Todo by ID
      .addCase(fetchTodoByIdAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTodoByIdAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentTodo = action.payload;
      })
      .addCase(fetchTodoByIdAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch todo";
      })
      // Create Todo
      .addCase(createTodoAsync.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createTodoAsync.fulfilled, (state, action) => {
        state.isCreating = false;
        state.todos.unshift(action.payload);
        state.totalTodos += 1;
      })
      .addCase(createTodoAsync.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload || "Failed to create todo";
      })
      // Update Todo
      .addCase(updateTodoAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateTodoAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedTodo = action.payload;
        const index = state.todos.findIndex(
          (todo) => todo.id === updatedTodo.id
        );
        if (index !== -1) {
          state.todos[index] = updatedTodo;
        }
        if (state.currentTodo?.id === updatedTodo.id) {
          state.currentTodo = updatedTodo;
        }
      })
      .addCase(updateTodoAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to update todo";
      })
      // Update Todo State
      .addCase(updateTodoStateAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateTodoStateAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedTodo = action.payload;
        const index = state.todos.findIndex(
          (todo) => todo.id === updatedTodo.id
        );
        if (index !== -1) {
          state.todos[index] = updatedTodo;
        }
        if (state.currentTodo?.id === updatedTodo.id) {
          state.currentTodo = updatedTodo;
        }
      })
      .addCase(updateTodoStateAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to update todo state";
      });
  },
});

export const {
  clearError,
  setCurrentTodo,
  clearCurrentTodo,
  resetTodos,
  updateTodoFromWebSocket,
} = todoSlice.actions;
export default todoSlice.reducer;
