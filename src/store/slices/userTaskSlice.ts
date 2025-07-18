import { userTaskService } from "@/services/userTaskService";
import {
  CompleteUserTaskRequest,
  CreateUserTaskRequest,
  IgnoreUserTaskRequest,
  RateUserTaskRequest,
  UpdateUserTaskActionDataRequest,
  UpdateUserTaskRequest,
  UserTask,
  UserTasksAnalytics,
  UserTaskStatus,
} from "@/types/userTask";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../index";

interface UserTaskState {
  userTasks: UserTask[];
  analytics: UserTasksAnalytics | null;
  isLoading: boolean;
  error: string | null;
  selectedUserTask: UserTask | null;
  isUpdating: boolean;
  isCreating: boolean;
  isAnalyticsLoading: boolean;
  removedTasks: UserTask[] | null;
}

const initialState: UserTaskState = {
  userTasks: [],
  analytics: null,
  isLoading: false,
  error: null,
  selectedUserTask: null,
  isUpdating: false,
  isCreating: false,
  isAnalyticsLoading: false,
  removedTasks: null,
};

// Async thunks for user task operations
export const fetchUserTasksAsync = createAsyncThunk(
  "userTasks/fetchUserTasks",
  async (params: { status?: UserTaskStatus[]; space?: string } = {}) => {
    const response = await userTaskService.getUserTasks(
      params.status,
      params.space
    );

    return response.userTasks;
  }
);

export const fetchUserTaskByIdAsync = createAsyncThunk(
  "userTasks/fetchUserTaskById",
  async (userTaskId: string) => {
    const response = await userTaskService.getUserTaskById(userTaskId);
    return response.userTask;
  }
);

export const createUserTaskAsync = createAsyncThunk(
  "userTasks/createUserTask",
  async (request: CreateUserTaskRequest) => {
    const response = await userTaskService.createUserTask(request);
    return response.userTask;
  }
);

export const updateUserTaskAsync = createAsyncThunk(
  "userTasks/updateUserTask",
  async (params: { userTaskId: string; request: UpdateUserTaskRequest }) => {
    const response = await userTaskService.updateUserTask(
      params.userTaskId,
      params.request
    );
    return response.userTask;
  }
);

export const updateUserTaskActionDataAsync = createAsyncThunk(
  "userTasks/updateUserTaskActionData",
  async (params: {
    userTaskId: string;
    request: UpdateUserTaskActionDataRequest;
  }) => {
    const response = await userTaskService.updateUserTaskActionData(
      params.userTaskId,
      params.request
    );
    return response.userTask;
  }
);

export const ignoreUserTaskAsync = createAsyncThunk(
  "userTasks/ignoreUserTask",
  async (params: { userTaskId: string; request: IgnoreUserTaskRequest }) => {
    await userTaskService.ignoreUserTask(params.userTaskId, params.request);

    return { userTaskId: params.userTaskId };
  }
);

export const deleteUserTaskAsync = createAsyncThunk(
  "userTasks/deleteUserTask",
  async (userTaskId: string) => {
    await userTaskService.deleteUserTask(userTaskId);

    return {
      userTaskId: userTaskId,
    };
  }
);

export const completeUserTaskAsync = createAsyncThunk(
  "userTasks/completeUserTask",
  async (params: { userTaskId: string; request?: CompleteUserTaskRequest }) => {
    await userTaskService.completeUserTask(params.userTaskId, params.request);

    return { userTaskId: params.userTaskId };
  }
);

export const rateUserTaskAsync = createAsyncThunk(
  "userTasks/rateUserTask",
  async (params: { userTaskId: string; request: RateUserTaskRequest }) => {
    const response = await userTaskService.rateUserTask(
      params.userTaskId,
      params.request
    );
    return response.userTask;
  }
);

export const snoozeUserTaskAsync = createAsyncThunk(
  "userTasks/snoozeUserTask",
  async (params: {
    userTaskId: string;
    msTillReactivate: number;
    timeZone?: string;
  }) => {
    const response = await userTaskService.snoozeUserTask(
      params.userTaskId,
      params.msTillReactivate,
      params.timeZone
    );
    return response.userTask;
  }
);

export const fetchUserTasksAnalyticsAsync = createAsyncThunk(
  "userTasks/fetchUserTasksAnalytics",
  async (params: { startDate?: Date; endDate?: Date } = {}) => {
    const response = await userTaskService.getUserTasksAnalytics(
      params.startDate,
      params.endDate
    );
    return response.analytics;
  }
);

export const deleteUserTaskActionAsync = createAsyncThunk(
  "userTasks/deleteUserTaskAction",
  async (params: { userTaskId: string; actionId: string }) => {
    const response = await userTaskService.deleteUserTaskAction(
      params.userTaskId,
      params.actionId
    );
    return response.userTask;
  }
);

const userTaskSlice = createSlice({
  name: "userTasks",
  initialState,
  reducers: {
    clearUserTaskError: (state) => {
      state.error = null;
    },
    clearSelectedUserTask: (state) => {
      state.selectedUserTask = null;
    },
    setSelectedUserTask: (state, action: PayloadAction<UserTask>) => {
      state.selectedUserTask = action.payload;
    },
    // Optimistic updates
    optimisticallyRemoveUserTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      const removedTask = state.userTasks.find((task) => task.id === taskId);
      if (removedTask) {
        // Store the removed task in a temporary state for potential restoration
        state.removedTasks = state.removedTasks || [];
        state.removedTasks.push(removedTask);
        // Remove from main list
        state.userTasks = state.userTasks.filter((task) => task.id !== taskId);
        if (state.selectedUserTask?.id === taskId) {
          state.selectedUserTask = null;
        }
      }
    },
    restoreUserTask: (state, action: PayloadAction<string>) => {
      const taskId = action.payload;
      if (state.removedTasks) {
        const taskToRestore = state.removedTasks.find(
          (task) => task.id === taskId
        );
        if (taskToRestore) {
          // Restore to main list
          state.userTasks.unshift(taskToRestore);
          // Remove from removed tasks
          state.removedTasks = state.removedTasks.filter(
            (task) => task.id !== taskId
          );
        }
      }
    },
    updateUserTaskFromWebSocket: (state, action: PayloadAction<UserTask>) => {
      const updatedUserTask = action.payload;
      const index = state.userTasks.findIndex(
        (task) => task.id === updatedUserTask.id
      );
      if (index !== -1) {
        state.userTasks[index] = updatedUserTask;
      } else {
        state.userTasks.unshift(updatedUserTask);
      }
      if (state.selectedUserTask?.id === updatedUserTask.id) {
        state.selectedUserTask = updatedUserTask;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user tasks
      .addCase(fetchUserTasksAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTasksAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userTasks = action.payload;
        state.error = null;
        // Clear any removed tasks when refetching
        state.removedTasks = [];
      })
      .addCase(fetchUserTasksAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch user tasks";
      })

      // Fetch user task by ID
      .addCase(fetchUserTaskByIdAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTaskByIdAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedUserTask = action.payload;
        state.error = null;
      })
      .addCase(fetchUserTaskByIdAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch user task";
      })

      // Create user task
      .addCase(createUserTaskAsync.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createUserTaskAsync.fulfilled, (state, action) => {
        state.isCreating = false;
        state.userTasks = state.userTasks.filter(
          (task) => task.id !== action.payload.id
        );
        state.userTasks.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUserTaskAsync.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.error.message || "Failed to create user task";
      })

      // Update user task
      .addCase(updateUserTaskAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserTaskAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.userTasks.findIndex(
          (task) => task.id === action.payload.id
        );
        if (index !== -1) {
          state.userTasks[index] = action.payload;
        }
        if (state.selectedUserTask?.id === action.payload.id) {
          state.selectedUserTask = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUserTaskAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || "Failed to update user task";
      })

      // Update user task action data
      .addCase(updateUserTaskActionDataAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserTaskActionDataAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.userTasks.findIndex(
          (task) => task.id === action.payload.id
        );
        if (index !== -1) {
          state.userTasks[index] = action.payload;
        }
        if (state.selectedUserTask?.id === action.payload.id) {
          state.selectedUserTask = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUserTaskActionDataAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error =
          action.error.message || "Failed to update user task action data";
      })

      // Ignore user task
      .addCase(ignoreUserTaskAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(ignoreUserTaskAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.userTasks.findIndex(
          (task) => task.id === action.payload.userTaskId
        );
        if (index !== -1 && state.userTasks[index]) {
          state.userTasks[index].status = UserTaskStatus.IGNORED;
        }
        state.error = null;
      })
      .addCase(ignoreUserTaskAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || "Failed to ignore user task";
      })

      // Delete user task
      .addCase(deleteUserTaskAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(deleteUserTaskAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Task was already optimistically removed, just clean up removedTasks
        if (state.removedTasks) {
          state.removedTasks = state.removedTasks.filter(
            (task) => task.id !== action.payload.userTaskId
          );
        }
        state.error = null;
      })
      .addCase(deleteUserTaskAsync.rejected, (state, action) => {
        state.isUpdating = false;
        // Restore the task that was optimistically removed
        if (action.meta?.arg) {
          const taskId = action.meta.arg as string;
          const taskToRestore = state.removedTasks?.find(
            (task) => task.id === taskId
          );
          if (taskToRestore) {
            state.userTasks.unshift(taskToRestore);
            state.removedTasks = state.removedTasks.filter(
              (task) => task.id !== taskId
            );
          }
        }
        state.error = action.error.message || "Failed to delete user task";
      })

      // Complete user task
      .addCase(completeUserTaskAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(completeUserTaskAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Task was already optimistically removed, just clean up removedTasks
        if (state.removedTasks) {
          state.removedTasks = state.removedTasks.filter(
            (task) => task.id !== action.payload.userTaskId
          );
        }
        state.error = null;
      })
      .addCase(completeUserTaskAsync.rejected, (state, action) => {
        state.isUpdating = false;
        // Restore the task that was optimistically removed
        if (action.meta?.arg) {
          const taskId = (action.meta.arg as any).userTaskId;
          const taskToRestore = state.removedTasks?.find(
            (task) => task.id === taskId
          );
          if (taskToRestore) {
            state.userTasks.unshift(taskToRestore);
            state.removedTasks = state.removedTasks.filter(
              (task) => task.id !== taskId
            );
          }
        }
        state.error = action.error.message || "Failed to complete user task";
      })

      // Rate user task
      .addCase(rateUserTaskAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(rateUserTaskAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.userTasks.findIndex(
          (task) => task.id === action.payload.id
        );
        if (index !== -1) {
          state.userTasks[index] = action.payload;
        }
        if (state.selectedUserTask?.id === action.payload.id) {
          state.selectedUserTask = action.payload;
        }
        state.error = null;
      })
      .addCase(rateUserTaskAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || "Failed to rate user task";
      })

      // Snooze user task
      .addCase(snoozeUserTaskAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(snoozeUserTaskAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.userTasks.findIndex(
          (task) => task.id === action.payload.id
        );
        if (index !== -1) {
          state.userTasks[index] = action.payload;
        }
        if (state.selectedUserTask?.id === action.payload.id) {
          state.selectedUserTask = action.payload;
        }
        state.error = null;
      })
      .addCase(snoozeUserTaskAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.error.message || "Failed to snooze user task";
      })

      // Fetch user tasks analytics
      .addCase(fetchUserTasksAnalyticsAsync.pending, (state) => {
        state.isAnalyticsLoading = true;
        state.error = null;
      })
      .addCase(fetchUserTasksAnalyticsAsync.fulfilled, (state, action) => {
        state.isAnalyticsLoading = false;
        state.analytics = action.payload;
        state.error = null;
      })
      .addCase(fetchUserTasksAnalyticsAsync.rejected, (state, action) => {
        state.isAnalyticsLoading = false;
        state.error =
          action.error.message || "Failed to fetch user tasks analytics";
      })

      // Delete user task action
      .addCase(deleteUserTaskActionAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(deleteUserTaskActionAsync.fulfilled, (state, action) => {
        state.isUpdating = false;

        const { userTaskId, actionId } = action.meta?.arg as any;

        const index = state.userTasks.findIndex(
          (task) => task?.id === userTaskId
        );
        if (index !== -1) {
          const actionIndex = state.userTasks[index].actions.findIndex(
            (action) => action.id === actionId
          );
          if (actionIndex !== -1) {
            state.userTasks[index].actions.splice(actionIndex, 1);
          }
        }

        state.error = null;
      })
      .addCase(deleteUserTaskActionAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error =
          action.error.message || "Failed to delete user task action";
      });
  },
});

export const {
  clearUserTaskError,
  clearSelectedUserTask,
  setSelectedUserTask,
  optimisticallyRemoveUserTask,
  restoreUserTask,
  updateUserTaskFromWebSocket,
} = userTaskSlice.actions;

// Selectors
export const selectUserTasks = (state: RootState) => state.userTasks.userTasks;
export const selectUserTasksLoading = (state: RootState) =>
  state.userTasks.isLoading;
export const selectUserTasksError = (state: RootState) => state.userTasks.error;
export const selectSelectedUserTask = (state: RootState) =>
  state.userTasks.selectedUserTask;
export const selectUserTasksUpdating = (state: RootState) =>
  state.userTasks.isUpdating;
export const selectUserTasksCreating = (state: RootState) =>
  state.userTasks.isCreating;
export const selectUserTasksAnalytics = (state: RootState) =>
  state.userTasks.analytics;
export const selectUserTasksAnalyticsLoading = (state: RootState) =>
  state.userTasks.isAnalyticsLoading;

// Filtered selectors
export const selectUserTasksByStatus =
  (status: UserTaskStatus) => (state: RootState) =>
    state.userTasks.userTasks.filter((task) => task.status === status);

export const selectPendingUserTasks = (state: RootState) =>
  state.userTasks.userTasks.filter(
    (task) =>
      task.status === UserTaskStatus.PENDING ||
      task.status === UserTaskStatus.FAILED
  );

export const selectInProgressUserTasks = (state: RootState) =>
  state.userTasks.userTasks.filter(
    (task) => task.status === UserTaskStatus.PENDING
  );

export const selectCompletedUserTasks = (state: RootState) =>
  state.userTasks.userTasks.filter(
    (task) =>
      task.status === UserTaskStatus.COMPLETED ||
      task.status === UserTaskStatus.COMPLETED_EXTERNAL
  );

export const selectSnoozedUserTasks = (state: RootState) =>
  state.userTasks.userTasks.filter(
    (task) => task.status === UserTaskStatus.SNOOZE
  );

export const selectIgnoredUserTasks = (state: RootState) =>
  state.userTasks.userTasks.filter(
    (task) => task.status === UserTaskStatus.IGNORED
  );

export const selectDeletedUserTasks = (state: RootState) =>
  state.userTasks.userTasks.filter(
    (task) => task.status === UserTaskStatus.DELETED
  );

export const selectUserTaskById = (state: RootState, taskId: string) =>
  state.userTasks.userTasks.find((task) => task.id === taskId) ||
  (state.userTasks.selectedUserTask?.id === taskId
    ? state.userTasks.selectedUserTask
    : null);

export default userTaskSlice.reducer;
