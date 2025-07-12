import { toolExecutionService } from "@/services/toolExecutionService";
import {
  CreateToolExecutionRequest,
  ExecuteToolExecutionRequest,
  ScheduleToolExecutionRequest,
  ToolEndpointAction,
  ToolExecution,
  UpdateToolExecutionRequest,
} from "@/types/toolExecution";
import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction,
} from "@reduxjs/toolkit";

interface ToolExecutionState {
  toolExecutions: ToolExecution[];
  drafts: ToolExecution[]; // Unexecuted tool executions
  currentToolExecution: ToolExecution | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isExecuting: boolean;
  isDeleting: boolean;
  error: string | null;
  // Auto-save state
  autoSaveTimeouts: Record<string, NodeJS.Timeout>;
  pendingUpdates: Record<string, UpdateToolExecutionRequest>;
}

const initialState: ToolExecutionState = {
  toolExecutions: [],
  drafts: [],
  currentToolExecution: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isExecuting: false,
  isDeleting: false,
  error: null,
  autoSaveTimeouts: {},
  pendingUpdates: {},
};

// Async thunks
export const createToolExecutionAsync = createAsyncThunk<
  ToolExecution,
  CreateToolExecutionRequest,
  { rejectValue: string }
>("toolExecutions/create", async (data, { rejectWithValue }) => {
  try {
    return await toolExecutionService.createToolExecution(data);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create tool execution");
  }
});

export const fetchMyToolExecutionsAsync = createAsyncThunk<
  ToolExecution[],
  void,
  { rejectValue: string }
>("toolExecutions/fetchMy", async (_, { rejectWithValue }) => {
  try {
    return await toolExecutionService.getMyToolExecutions();
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch tool executions");
  }
});

export const fetchToolExecutionByIdAsync = createAsyncThunk<
  ToolExecution,
  string,
  { rejectValue: string }
>("toolExecutions/fetchById", async (toolExecutionId, { rejectWithValue }) => {
  try {
    return await toolExecutionService.getToolExecutionById(toolExecutionId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch tool execution");
  }
});

export const updateToolExecutionAsync = createAsyncThunk<
  ToolExecution,
  { toolExecutionId: string; data: UpdateToolExecutionRequest },
  { rejectValue: string }
>(
  "toolExecutions/update",
  async ({ toolExecutionId, data }, { rejectWithValue }) => {
    try {
      return await toolExecutionService.updateToolExecution(
        toolExecutionId,
        data
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to update tool execution"
      );
    }
  }
);

export const executeToolExecutionAsync = createAsyncThunk<
  ToolExecution,
  { toolExecutionId: string; data: ExecuteToolExecutionRequest },
  { rejectValue: string }
>(
  "toolExecutions/execute",
  async ({ toolExecutionId, data }, { rejectWithValue }) => {
    try {
      return await toolExecutionService.executeToolExecution(
        toolExecutionId,
        data
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to execute tool execution"
      );
    }
  }
);

export const scheduleToolExecutionAsync = createAsyncThunk<
  ToolExecution,
  { toolExecutionId: string; data: ScheduleToolExecutionRequest },
  { rejectValue: string }
>(
  "toolExecutions/schedule",
  async ({ toolExecutionId, data }, { rejectWithValue }) => {
    try {
      return await toolExecutionService.scheduleToolExecution(
        toolExecutionId,
        data
      );
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to schedule tool execution"
      );
    }
  }
);

export const unscheduleToolExecutionAsync = createAsyncThunk<
  ToolExecution,
  string,
  { rejectValue: string }
>("toolExecutions/unschedule", async (toolExecutionId, { rejectWithValue }) => {
  try {
    return await toolExecutionService.unscheduleToolExecution(toolExecutionId);
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Failed to unschedule tool execution"
    );
  }
});

let deletingToolExecutionIds: string[] = [];
export const deleteToolExecutionAsync = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("toolExecutions/delete", async (toolExecutionId, { rejectWithValue }) => {
  try {
    if (deletingToolExecutionIds.includes(toolExecutionId)) {
      return toolExecutionId;
    }

    deletingToolExecutionIds.push(toolExecutionId);
    await toolExecutionService.deleteToolExecution(toolExecutionId);
    deletingToolExecutionIds = deletingToolExecutionIds.filter(
      (id) => id !== toolExecutionId
    );
    return toolExecutionId;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete tool execution");
  }
});

export const toolExecutionSlice = createSlice({
  name: "toolExecutions",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentToolExecution: (
      state,
      action: PayloadAction<ToolExecution | null>
    ) => {
      state.currentToolExecution = action.payload;
    },
    clearCurrentToolExecution: (state) => {
      state.currentToolExecution = null;
    },
    // Auto-save functionality
    scheduleAutoSave: (
      state,
      action: PayloadAction<{
        toolExecutionId: string;
        data: UpdateToolExecutionRequest;
      }>
    ) => {
      const { toolExecutionId, data } = action.payload;
      state.pendingUpdates[toolExecutionId] = data;
    },
    clearAutoSave: (state, action: PayloadAction<string>) => {
      const toolExecutionId = action.payload;
      delete state.pendingUpdates[toolExecutionId];
    },
    // WebSocket updates
    updateToolExecutionFromWebSocket: (
      state,
      action: PayloadAction<ToolExecution>
    ) => {
      const toolExecution = action.payload;

      // Update in main tool executions list
      const toolExecutionIndex = state.toolExecutions.findIndex(
        (te) => te.id === toolExecution.id
      );
      if (toolExecutionIndex !== -1) {
        state.toolExecutions[toolExecutionIndex] = toolExecution;
      } else {
        // Add new tool execution
        state.toolExecutions.unshift(toolExecution);
      }

      if (toolExecution.internalListeners.length === 0) {
        // Update drafts (unexecuted tool executions)
        const draftIndex = state.drafts.findIndex(
          (te) => te.id === toolExecution.id
        );
        if (toolExecution.executedAt) {
          // Remove from drafts if executed
          if (draftIndex !== -1) {
            state.drafts.splice(draftIndex, 1);
          }
        } else {
          // Update or add to drafts if not executed
          if (draftIndex !== -1) {
            state.drafts[draftIndex] = toolExecution;
          } else {
            state.drafts.unshift(toolExecution);
          }
        }
      }

      // Update current tool execution if it's the same one
      if (state.currentToolExecution?.id === toolExecution.id) {
        state.currentToolExecution = toolExecution;
      }
    },
    removeToolExecutionFromList: (state, action: PayloadAction<string>) => {
      const toolExecutionId = action.payload;

      // Remove from tool executions list
      state.toolExecutions = state.toolExecutions.filter(
        (te) => te.id !== toolExecutionId
      );

      // Remove from drafts
      state.drafts = state.drafts.filter(
        (te) => te.id !== toolExecutionId && te.internalListeners.length === 0
      );

      // Clear current tool execution if it's the one being removed
      if (state.currentToolExecution?.id === toolExecutionId) {
        state.currentToolExecution = null;
      }

      // Clear any pending updates
      delete state.pendingUpdates[toolExecutionId];
    },
    // Reset state
    resetToolExecutions: (state) => {
      state.toolExecutions = [];
      state.drafts = [];
      state.currentToolExecution = null;
      state.pendingUpdates = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Tool Execution
      .addCase(createToolExecutionAsync.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createToolExecutionAsync.fulfilled, (state, action) => {
        state.isCreating = false;
        const toolExecution = action.payload;

        state.drafts = state.drafts.filter(
          (te) =>
            te.id !== toolExecution.id && te.internalListeners.length === 0
        );

        state.toolExecutions.unshift(toolExecution);

        if (
          !toolExecution.executedAt &&
          toolExecution.internalListeners.length === 0
        ) {
          // Remove from drafts if it exists
          state.drafts = state.drafts.filter(
            (te) => te.id !== toolExecution.id
          );

          // Add to drafts if not executed and has no internal listeners
          state.drafts.unshift(toolExecution);
        }

        state.error = null;
      })
      .addCase(createToolExecutionAsync.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload || "Failed to create tool execution";
      })
      // Fetch My Tool Executions
      .addCase(fetchMyToolExecutionsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyToolExecutionsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.toolExecutions = action.payload;

        // Separate drafts (unexecuted and no internal listeners) from executed tool executions
        state.drafts = action.payload.filter(
          (te) => !te.executedAt && te.internalListeners.length === 0
        );

        state.error = null;
      })
      .addCase(fetchMyToolExecutionsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch tool executions";
      })
      // Fetch Tool Execution by ID
      .addCase(fetchToolExecutionByIdAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchToolExecutionByIdAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentToolExecution = action.payload;
        state.toolExecutions.unshift(action.payload);
        state.error = null;
      })
      .addCase(fetchToolExecutionByIdAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch tool execution";
      })
      // Update Tool Execution
      .addCase(updateToolExecutionAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateToolExecutionAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedToolExecution = action.payload;

        // Update in all relevant arrays
        const updateInArray = (array: ToolExecution[]) => {
          const index = array.findIndex(
            (te) => te.id === updatedToolExecution.id
          );
          if (index !== -1) {
            array[index] = updatedToolExecution;
          }
        };

        updateInArray(state.toolExecutions);
        updateInArray(state.drafts);

        if (state.currentToolExecution?.id === updatedToolExecution.id) {
          state.currentToolExecution = updatedToolExecution;
        }

        // Clear pending update for this tool execution
        delete state.pendingUpdates[updatedToolExecution.id];

        state.error = null;
      })
      .addCase(updateToolExecutionAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to update tool execution";
      })
      // Execute Tool Execution
      .addCase(executeToolExecutionAsync.pending, (state) => {
        state.isExecuting = true;
        state.error = null;
      })
      .addCase(executeToolExecutionAsync.fulfilled, (state, action) => {
        state.isExecuting = false;
        const executedToolExecution = action.payload;

        // Update in tool executions array
        const toolExecutionIndex = state.toolExecutions.findIndex(
          (te) => te.id === executedToolExecution.id
        );
        if (toolExecutionIndex !== -1) {
          state.toolExecutions[toolExecutionIndex] = executedToolExecution;
        }

        // Remove from drafts since it's now executed
        state.drafts = state.drafts.filter(
          (te) => te.id !== executedToolExecution.id
        );

        if (state.currentToolExecution?.id === executedToolExecution.id) {
          state.currentToolExecution = executedToolExecution;
        }

        state.error = null;
      })
      .addCase(executeToolExecutionAsync.rejected, (state, action) => {
        state.isExecuting = false;
        state.error = action.payload || "Failed to execute tool execution";
      })
      // Schedule Tool Execution
      .addCase(scheduleToolExecutionAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(scheduleToolExecutionAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Handle similar to update
        const updatedToolExecution = action.payload;
        const updateInArray = (array: ToolExecution[]) => {
          const index = array.findIndex(
            (te) => te.id === updatedToolExecution.id
          );
          if (index !== -1) {
            array[index] = updatedToolExecution;
          }
        };

        updateInArray(state.toolExecutions);
        updateInArray(state.drafts);

        if (state.currentToolExecution?.id === updatedToolExecution.id) {
          state.currentToolExecution = updatedToolExecution;
        }

        state.error = null;
      })
      .addCase(scheduleToolExecutionAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to schedule tool execution";
      })
      // Unschedule Tool Execution
      .addCase(unscheduleToolExecutionAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(unscheduleToolExecutionAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Handle similar to update
        const updatedToolExecution = action.payload;
        const updateInArray = (array: ToolExecution[]) => {
          const index = array.findIndex(
            (te) => te.id === updatedToolExecution.id
          );
          if (index !== -1) {
            array[index] = updatedToolExecution;
          }
        };

        updateInArray(state.toolExecutions);
        updateInArray(state.drafts);

        if (state.currentToolExecution?.id === updatedToolExecution.id) {
          state.currentToolExecution = updatedToolExecution;
        }

        state.error = null;
      })
      .addCase(unscheduleToolExecutionAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to unschedule tool execution";
      })
      // Delete Tool Execution
      .addCase(deleteToolExecutionAsync.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteToolExecutionAsync.fulfilled, (state, action) => {
        state.isDeleting = false;
        const toolExecutionId = action.payload;

        // Remove from all arrays
        state.toolExecutions = state.toolExecutions.filter(
          (te) => te.id !== toolExecutionId
        );
        state.drafts = state.drafts.filter((te) => te.id !== toolExecutionId);

        if (state.currentToolExecution?.id === toolExecutionId) {
          state.currentToolExecution = null;
        }

        delete state.pendingUpdates[toolExecutionId];

        state.error = null;
      })
      .addCase(deleteToolExecutionAsync.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload || "Failed to delete tool execution";
      });
  },
});

export const {
  clearError,
  setCurrentToolExecution,
  clearCurrentToolExecution,
  scheduleAutoSave,
  clearAutoSave,
  updateToolExecutionFromWebSocket,
  removeToolExecutionFromList,
  resetToolExecutions,
} = toolExecutionSlice.actions;

// Selectors
export const selectToolExecutionById = (
  state: { toolExecutions: ToolExecutionState },
  toolExecutionId: string
) => {
  return (
    state.toolExecutions.toolExecutions.find(
      (te) => te.id === toolExecutionId
    ) ||
    state.toolExecutions.drafts.find((te) => te.id === toolExecutionId) ||
    null
  );
};

// Memoized selectors
const selectDrafts = (state: { toolExecutions: ToolExecutionState }) =>
  state.toolExecutions.drafts;

export const selectDraftsByAction = createSelector(
  [
    selectDrafts,
    (
      state: { toolExecutions: ToolExecutionState },
      action: ToolEndpointAction
    ) => action,
  ],
  (drafts, action) =>
    drafts.filter((te) => te.toolEndpointAction === action && !te.executedAt)
);

export const selectEmailDrafts = createSelector([selectDrafts], (drafts) =>
  drafts.filter(
    (te) =>
      te.toolEndpointAction === ToolEndpointAction.GMAIL_SEND &&
      !te.executedAt &&
      te.internalListeners.length === 0
  )
);

export default toolExecutionSlice.reducer;
