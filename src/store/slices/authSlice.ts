import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  AuthState,
  User,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  AuthUserUsage,
} from "@/types/auth";
import { authService } from "@/services/authService";
import { todoService } from "@/services/todoService";
import { profileService } from "@/services/profileService";
import { emailService } from "@/services/emailService";
import { toolExecutionService } from "@/services/toolExecutionService";
import { secureStorage } from "@/services/secureStorage";

const initialState: AuthState = {
  user: null,
  authToken: null,
  refreshToken: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,
  error: null,
  emailUsage: null,
  isFetchingUsage: false,
};

// Async thunks
export const signInAsync = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>("auth/signIn", async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.signIn(credentials);

    // Store tokens securely
    await secureStorage.setItem("auth_token", response.authToken);
    await secureStorage.setItem("refresh_token", response.refreshToken);

    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Sign in failed");
  }
});

export const signUpAsync = createAsyncThunk<
  AuthResponse,
  RegisterCredentials,
  { rejectValue: string }
>("auth/signUp", async (credentials, { rejectWithValue }) => {
  try {
    const response = await authService.signUp(credentials);

    // Store tokens securely
    await secureStorage.setItem("auth_token", response.authToken);
    await secureStorage.setItem("refresh_token", response.refreshToken);

    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Sign up failed");
  }
});

export const signOutAsync = createAsyncThunk(
  "auth/signOut",
  async (_, { rejectWithValue }) => {
    try {
      await authService.signOut();
      await secureStorage.removeItem("auth_token");
      await secureStorage.removeItem("refresh_token");
      authService.removeAuthToken();
      todoService.removeAuthToken();
    } catch (error: any) {
      return rejectWithValue(error.message || "Sign out failed");
    }
  }
);

export const refreshAuthAsync = createAsyncThunk<
  AuthResponse,
  void,
  { rejectValue: string }
>("auth/refreshAuth", async (_, { rejectWithValue }) => {
  try {
    const refreshToken = await secureStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await authService.refreshAuthentication();
    await secureStorage.setItem("auth_token", response.authToken);
    await secureStorage.setItem("refresh_token", response.refreshToken);

    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Token refresh failed");
  }
});

export const checkAuthAsync = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const authToken = await secureStorage.getItem("auth_token");
      if (!authToken) {
        throw new Error("No auth token found");
      }

      const refreshToken = await secureStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token found");
      }

      // Set the tokens in the service for API calls
      authService.setAuthToken(authToken, refreshToken);
      todoService.setAuthToken(authToken, refreshToken);

      // Try to refresh authentication to validate the token
      const response = await authService.refreshAuthentication();

      // Update stored tokens
      await secureStorage.setItem("auth_token", response.authToken);
      await secureStorage.setItem("refresh_token", response.refreshToken);

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || "Authentication check failed");
    }
  }
);

export const verifyEmailAsync = createAsyncThunk<
  { emailVerified: boolean },
  { email: string; code: string },
  { rejectValue: string }
>("auth/verifyEmail", async ({ email, code }, { rejectWithValue }) => {
  try {
    const response = await authService.verifyEmail(email, code);
    return { emailVerified: response.emailVerified };
  } catch (error: any) {
    return rejectWithValue(error.message || "Email verification failed");
  }
});

export const resendVerificationEmailAsync = createAsyncThunk<
  { success: boolean },
  string,
  { rejectValue: string }
>("auth/resendVerificationEmail", async (email, { rejectWithValue }) => {
  try {
    const response = await authService.resendVerificationEmail(email);
    return response;
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Failed to resend verification email"
    );
  }
});

export const fetchUsageAsync = createAsyncThunk<
  AuthUserUsage,
  string,
  { rejectValue: string }
>("auth/fetchUsage", async (type, { rejectWithValue }) => {
  try {
    const response = await authService.getUsageByType(type);
    console.log("response", response);
    return response;
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch usage");
  }
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.authToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.emailUsage = null;
      state.isFetchingUsage = false;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign In
      .addCase(signInAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signInAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          authUserId: action.payload.authUserId,
          email: action.payload.email,
          emailVerified: action.payload.emailVerified,
          paymentPlans: action.payload.paymentPlans,
          roles: action.payload.roles,
          usage: {
            canRun: false,
            credits: 0,
            usedCredits: 0,
            storageUsed: 0,
            storageAvailable: 50,
          },
        };
        state.authToken = action.payload.authToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;

        // Set the tokens in the service for API calls
        authService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        todoService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        profileService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        emailService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        toolExecutionService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
      })
      .addCase(signInAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Sign in failed";
      })
      // Sign Up
      .addCase(signUpAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          authUserId: action.payload.authUserId,
          email: action.payload.email,
          emailVerified: action.payload.emailVerified,
          paymentPlans: action.payload.paymentPlans,
          roles: action.payload.roles,
          usage: {
            canRun: false,
            credits: 0,
            usedCredits: 0,
            storageUsed: 0,
            storageAvailable: 50,
          },
        };
        state.authToken = action.payload.authToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;

        // Set the tokens in the service for API calls
        authService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        todoService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        profileService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        emailService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        toolExecutionService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
      })
      .addCase(signUpAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Sign up failed";
      })
      // Sign Out
      .addCase(signOutAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(signOutAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.authToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(signOutAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || "Sign out failed";
        // Still clear auth data on logout failure
        state.user = null;
        state.authToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Refresh Auth
      .addCase(refreshAuthAsync.fulfilled, (state, action) => {
        state.user = {
          authUserId: action.payload.authUserId,
          email: action.payload.email,
          emailVerified: action.payload.emailVerified,
          paymentPlans: action.payload.paymentPlans,
          roles: action.payload.roles,
          usage: state.user?.usage || {
            canRun: false,
            credits: 0,
            usedCredits: 0,
            storageUsed: 0,
            storageAvailable: 50,
          },
        };
        state.authToken = action.payload.authToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;

        // Set the tokens in the service for API calls
        authService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        todoService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        profileService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        emailService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        toolExecutionService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
      })
      .addCase(refreshAuthAsync.rejected, (state) => {
        state.user = null;
        state.authToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      })
      // Check Auth
      .addCase(checkAuthAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = {
          authUserId: action.payload.authUserId,
          email: action.payload.email,
          emailVerified: action.payload.emailVerified,
          paymentPlans: action.payload.paymentPlans,
          roles: action.payload.roles,
          usage: {
            canRun: false,
            credits: 0,
            usedCredits: 0,
            storageUsed: 0,
            storageAvailable: 50,
          },
        };
        state.authToken = action.payload.authToken;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isInitialized = true;
        state.error = null;

        // Set the tokens in the service for API calls
        authService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        todoService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        profileService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        emailService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
        toolExecutionService.setAuthToken(
          action.payload.authToken,
          action.payload.refreshToken
        );
      })
      .addCase(checkAuthAsync.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.authToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isInitialized = true;
      })
      // Verify Email
      .addCase(verifyEmailAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmailAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.emailVerified = action.payload.emailVerified;
        }
        state.error = null;
      })
      .addCase(verifyEmailAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Email verification failed";
      })
      // Resend Verification Email
      .addCase(resendVerificationEmailAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerificationEmailAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendVerificationEmailAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to resend verification email";
      })
      // Fetch Usage
      .addCase(fetchUsageAsync.pending, (state) => {
        state.isFetchingUsage = true;
        state.error = null;
      })
      .addCase(fetchUsageAsync.fulfilled, (state, action) => {
        state.isFetchingUsage = false;
        state.emailUsage = action.payload;
        state.error = null;
      })
      .addCase(fetchUsageAsync.rejected, (state, action) => {
        state.isFetchingUsage = false;
        state.error = action.payload || "Failed to fetch usage";
      });
  },
});

export const { clearError, setUser, clearAuth, setInitialized } =
  authSlice.actions;

export default authSlice.reducer;
