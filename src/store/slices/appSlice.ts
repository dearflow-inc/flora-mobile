import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootState } from "../index";

const THEME_STORAGE_KEY = "theme_preference";

interface AppState {
  isInitialized: boolean;
  theme: "light" | "dark";
  language: string;
  notifications: {
    enabled: boolean;
    sound: boolean;
    vibrate: boolean;
  };
  networkStatus: "connected" | "disconnected" | "unknown";
}

// Async thunks for theme persistence
export const loadThemeAsync = createAsyncThunk("app/loadTheme", async () => {
  try {
    const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme as "light" | "dark" | null;
  } catch (error) {
    console.error("Failed to load theme:", error);
    return null;
  }
});

export const saveThemeAsync = createAsyncThunk(
  "app/saveTheme",
  async (theme: "light" | "dark") => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
      return theme;
    } catch (error) {
      console.error("Failed to save theme:", error);
      throw error;
    }
  }
);

// Async thunk to conditionally set initialized based on profile state
export const setInitializedIfProfileFetched = createAsyncThunk(
  "app/setInitializedIfProfileFetched",
  async (shouldInitialize: boolean, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const hasProfileBeenFetched = state.profile.hasProfileBeenFetched;

    if (shouldInitialize && !hasProfileBeenFetched) {
      return rejectWithValue(
        "Cannot initialize app until profile has been fetched"
      );
    }

    return shouldInitialize;
  }
);

const initialState: AppState = {
  isInitialized: false,
  theme: "light",
  language: "en",
  notifications: {
    enabled: true,
    sound: true,
    vibrate: true,
  },
  networkStatus: "unknown",
};

export const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setInitialized: (state, action: PayloadAction<boolean>) => {
      // Only allow setting to true if we're setting to false (for reset scenarios)
      // For setting to true, use setInitializedIfProfileFetched thunk instead
      if (action.payload === false) {
        state.isInitialized = action.payload;
      }
    },
    forceInitialized: (state, action: PayloadAction<boolean>) => {
      // Unconditionally set initialized state - used when no profile is needed
      state.isInitialized = action.payload;
    },
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setNotifications: (
      state,
      action: PayloadAction<Partial<AppState["notifications"]>>
    ) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    setNetworkStatus: (
      state,
      action: PayloadAction<"connected" | "disconnected" | "unknown">
    ) => {
      state.networkStatus = action.payload;
    },
    resetAppData: (state) => {
      // Reset app data to initial state but keep theme preference
      const currentTheme = state.theme;
      return {
        ...initialState,
        theme: currentTheme,
        isInitialized: true,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadThemeAsync.fulfilled, (state, action) => {
        if (action.payload) {
          state.theme = action.payload;
        }
      })
      .addCase(saveThemeAsync.fulfilled, (state, action) => {
        state.theme = action.payload;
      })

      .addCase(setInitializedIfProfileFetched.fulfilled, (state, action) => {
        state.isInitialized = action.payload;
      });
  },
});

export const {
  setInitialized,
  forceInitialized,
  setTheme,
  setLanguage,
  setNotifications,
  setNetworkStatus,
  resetAppData,
} = appSlice.actions;

export default appSlice.reducer;
