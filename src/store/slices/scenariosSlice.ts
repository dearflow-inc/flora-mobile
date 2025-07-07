import {
  createSlice,
  createAsyncThunk,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { RootState } from "../index";
import { scenariosService } from "@/services/scenariosService";
import {
  Scenarios,
  ContextView,
  CreateContextViewRequest,
  UpdateContextViewRequest,
  ScenarioItem,
  CreateScenarioItemRequest,
  ScenarioTag,
  CreateScenarioTagRequest,
} from "@/types/scenarios";

interface ScenariosState {
  scenarios: Scenarios | null;
  loading: boolean;
  error: string | null;
  contextViewsLoading: boolean;
  contextViewsError: string | null;
  scenarioItemsLoading: boolean;
  scenarioItemsError: string | null;
  tagsLoading: boolean;
  tagsError: string | null;
}

const initialState: ScenariosState = {
  scenarios: null,
  loading: false,
  error: null,
  contextViewsLoading: false,
  contextViewsError: null,
  scenarioItemsLoading: false,
  scenarioItemsError: null,
  tagsLoading: false,
  tagsError: null,
};

// Async thunks
export const fetchMyScenarios = createAsyncThunk(
  "scenarios/fetchMyScenarios",
  async (_, { rejectWithValue }) => {
    try {
      const scenarios = await scenariosService.fetchMyScenarios();
      return scenarios;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchScenariosByProfileId = createAsyncThunk(
  "scenarios/fetchScenariosByProfileId",
  async (profileId: string, { rejectWithValue }) => {
    try {
      const scenarios = await scenariosService.fetchScenariosByProfileId(
        profileId
      );
      return scenarios;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createContextView = createAsyncThunk(
  "scenarios/createContextView",
  async (data: CreateContextViewRequest, { rejectWithValue }) => {
    try {
      const contextView = await scenariosService.createContextView(data);
      return contextView;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateContextView = createAsyncThunk(
  "scenarios/updateContextView",
  async (
    { id, data }: { id: string; data: UpdateContextViewRequest },
    { rejectWithValue }
  ) => {
    try {
      const contextView = await scenariosService.updateContextView(id, data);
      return contextView;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteContextView = createAsyncThunk(
  "scenarios/deleteContextView",
  async (id: string, { rejectWithValue }) => {
    try {
      await scenariosService.deleteContextView(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createScenarioItem = createAsyncThunk(
  "scenarios/createScenarioItem",
  async (data: CreateScenarioItemRequest, { rejectWithValue }) => {
    try {
      const scenarioItem = await scenariosService.createScenarioItem(data);
      return scenarioItem;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateScenarioItem = createAsyncThunk(
  "scenarios/updateScenarioItem",
  async (
    { id, data }: { id: string; data: Partial<ScenarioItem> },
    { rejectWithValue }
  ) => {
    try {
      const scenarioItem = await scenariosService.updateScenarioItem(id, data);
      return scenarioItem;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteScenarioItem = createAsyncThunk(
  "scenarios/deleteScenarioItem",
  async (id: string, { rejectWithValue }) => {
    try {
      await scenariosService.deleteScenarioItem(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createScenarioTag = createAsyncThunk(
  "scenarios/createScenarioTag",
  async (data: CreateScenarioTagRequest, { rejectWithValue }) => {
    try {
      const scenarioTag = await scenariosService.createScenarioTag(data);
      return scenarioTag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateScenarioTag = createAsyncThunk(
  "scenarios/updateScenarioTag",
  async (
    {
      internalId,
      data,
    }: { internalId: string; data: { tag: Partial<ScenarioTag> } },
    { rejectWithValue }
  ) => {
    try {
      const scenarioTag = await scenariosService.updateScenarioTag(
        internalId,
        data
      );
      return scenarioTag;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteScenarioTag = createAsyncThunk(
  "scenarios/deleteScenarioTag",
  async (internalId: string, { rejectWithValue }) => {
    try {
      await scenariosService.deleteScenarioTag(internalId);
      return internalId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const scenariosSlice = createSlice({
  name: "scenarios",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearContextViewsError: (state) => {
      state.contextViewsError = null;
    },
    clearScenarioItemsError: (state) => {
      state.scenarioItemsError = null;
    },
    clearTagsError: (state) => {
      state.tagsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch scenarios
      .addCase(fetchMyScenarios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchMyScenarios.fulfilled,
        (state, action: PayloadAction<Scenarios>) => {
          state.loading = false;
          state.scenarios = action.payload;
        }
      )
      .addCase(fetchMyScenarios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchScenariosByProfileId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchScenariosByProfileId.fulfilled,
        (state, action: PayloadAction<Scenarios>) => {
          state.loading = false;
          state.scenarios = action.payload;
        }
      )
      .addCase(fetchScenariosByProfileId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Context Views
      .addCase(createContextView.pending, (state) => {
        state.contextViewsLoading = true;
        state.contextViewsError = null;
      })
      .addCase(
        createContextView.fulfilled,
        (state, action: PayloadAction<ContextView>) => {
          state.contextViewsLoading = false;
          if (state.scenarios) {
            state.scenarios.contextViews.push(action.payload);
          }
        }
      )
      .addCase(createContextView.rejected, (state, action) => {
        state.contextViewsLoading = false;
        state.contextViewsError = action.payload as string;
      })
      .addCase(updateContextView.pending, (state) => {
        state.contextViewsLoading = true;
        state.contextViewsError = null;
      })
      .addCase(
        updateContextView.fulfilled,
        (state, action: PayloadAction<ContextView>) => {
          state.contextViewsLoading = false;
          if (state.scenarios) {
            const index = state.scenarios.contextViews.findIndex(
              (cv) => cv.id === action.payload.id
            );
            if (index !== -1) {
              state.scenarios.contextViews[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateContextView.rejected, (state, action) => {
        state.contextViewsLoading = false;
        state.contextViewsError = action.payload as string;
      })
      .addCase(deleteContextView.pending, (state) => {
        state.contextViewsLoading = true;
        state.contextViewsError = null;
      })
      .addCase(
        deleteContextView.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.contextViewsLoading = false;
          if (state.scenarios) {
            state.scenarios.contextViews = state.scenarios.contextViews.filter(
              (cv) => cv.id !== action.payload
            );
          }
        }
      )
      .addCase(deleteContextView.rejected, (state, action) => {
        state.contextViewsLoading = false;
        state.contextViewsError = action.payload as string;
      })
      // Scenario Items
      .addCase(createScenarioItem.pending, (state) => {
        state.scenarioItemsLoading = true;
        state.scenarioItemsError = null;
      })
      .addCase(
        createScenarioItem.fulfilled,
        (state, action: PayloadAction<ScenarioItem>) => {
          state.scenarioItemsLoading = false;
          if (state.scenarios) {
            state.scenarios.scenarioItems.push(action.payload);
          }
        }
      )
      .addCase(createScenarioItem.rejected, (state, action) => {
        state.scenarioItemsLoading = false;
        state.scenarioItemsError = action.payload as string;
      })
      .addCase(updateScenarioItem.pending, (state) => {
        state.scenarioItemsLoading = true;
        state.scenarioItemsError = null;
      })
      .addCase(
        updateScenarioItem.fulfilled,
        (state, action: PayloadAction<ScenarioItem>) => {
          state.scenarioItemsLoading = false;
          if (state.scenarios) {
            const index = state.scenarios.scenarioItems.findIndex(
              (si) => si.id === action.payload.id
            );
            if (index !== -1) {
              state.scenarios.scenarioItems[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateScenarioItem.rejected, (state, action) => {
        state.scenarioItemsLoading = false;
        state.scenarioItemsError = action.payload as string;
      })
      .addCase(deleteScenarioItem.pending, (state) => {
        state.scenarioItemsLoading = true;
        state.scenarioItemsError = null;
      })
      .addCase(
        deleteScenarioItem.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.scenarioItemsLoading = false;
          if (state.scenarios) {
            state.scenarios.scenarioItems =
              state.scenarios.scenarioItems.filter(
                (si) => si.id !== action.payload
              );
          }
        }
      )
      .addCase(deleteScenarioItem.rejected, (state, action) => {
        state.scenarioItemsLoading = false;
        state.scenarioItemsError = action.payload as string;
      })
      // Scenario Tags
      .addCase(createScenarioTag.pending, (state) => {
        state.tagsLoading = true;
        state.tagsError = null;
      })
      .addCase(
        createScenarioTag.fulfilled,
        (state, action: PayloadAction<ScenarioTag>) => {
          state.tagsLoading = false;
          if (state.scenarios) {
            state.scenarios.tags.push(action.payload);
          }
        }
      )
      .addCase(createScenarioTag.rejected, (state, action) => {
        state.tagsLoading = false;
        state.tagsError = action.payload as string;
      })
      .addCase(updateScenarioTag.pending, (state) => {
        state.tagsLoading = true;
        state.tagsError = null;
      })
      .addCase(
        updateScenarioTag.fulfilled,
        (state, action: PayloadAction<ScenarioTag>) => {
          state.tagsLoading = false;
          if (state.scenarios) {
            const index = state.scenarios.tags.findIndex(
              (t) => t.internalId === action.payload.internalId
            );
            if (index !== -1) {
              state.scenarios.tags[index] = action.payload;
            }
          }
        }
      )
      .addCase(updateScenarioTag.rejected, (state, action) => {
        state.tagsLoading = false;
        state.tagsError = action.payload as string;
      })
      .addCase(deleteScenarioTag.pending, (state) => {
        state.tagsLoading = true;
        state.tagsError = null;
      })
      .addCase(
        deleteScenarioTag.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.tagsLoading = false;
          if (state.scenarios) {
            state.scenarios.tags = state.scenarios.tags.filter(
              (t) => t.internalId !== action.payload
            );
          }
        }
      )
      .addCase(deleteScenarioTag.rejected, (state, action) => {
        state.tagsLoading = false;
        state.tagsError = action.payload as string;
      });
  },
});

export const {
  clearError,
  clearContextViewsError,
  clearScenarioItemsError,
  clearTagsError,
} = scenariosSlice.actions;

// Selectors
export const selectScenarios = (state: RootState) => state.scenarios.scenarios;
export const selectScenariosLoading = (state: RootState) =>
  state.scenarios.loading;
export const selectScenariosError = (state: RootState) => state.scenarios.error;

// Memoized selectors to prevent unnecessary rerenders
export const selectContextViews = createSelector(
  [(state: RootState) => state.scenarios.scenarios?.contextViews],
  (contextViews) => Array.from(contextViews || [])
);

export const selectContextViewsLoading = (state: RootState) =>
  state.scenarios.contextViewsLoading;
export const selectContextViewsError = (state: RootState) =>
  state.scenarios.contextViewsError;

export const selectScenarioItems = createSelector(
  [(state: RootState) => state.scenarios.scenarios?.scenarioItems],
  (scenarioItems) => scenarioItems || []
);

export const selectScenarioItemsLoading = (state: RootState) =>
  state.scenarios.scenarioItemsLoading;
export const selectScenarioItemsError = (state: RootState) =>
  state.scenarios.scenarioItemsError;

export const selectScenarioTags = createSelector(
  [(state: RootState) => state.scenarios.scenarios?.tags],
  (tags) => tags || []
);

export const selectScenarioTagsLoading = (state: RootState) =>
  state.scenarios.tagsLoading;
export const selectScenarioTagsError = (state: RootState) =>
  state.scenarios.tagsError;

// Specific selectors
export const selectContextViewById = (state: RootState, id: string) =>
  state.scenarios.scenarios?.contextViews.find((cv) => cv.id === id);

export const selectScenarioItemById = (state: RootState, id: string) =>
  state.scenarios.scenarios?.scenarioItems.find((si) => si.id === id);

export const selectScenarioTagById = (state: RootState, internalId: string) =>
  state.scenarios.scenarios?.tags.find((t) => t.internalId === internalId);

export default scenariosSlice.reducer;
