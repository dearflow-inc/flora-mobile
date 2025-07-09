import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Profile,
  UpdateMyProfileRequest,
  FetchMyDashboardResponse,
  AddDocumentTypesRequest,
  ProfileSharingResponse,
  ProfileSharingType,
  AdminProfilesResponse,
  CreateFeedbackRequest,
  CreateFeedbackResponse,
} from "@/types/profile";
import { profileService } from "@/services/profileService";

interface ProfileState {
  currentProfile: Profile | null;
  dashboardData: FetchMyDashboardResponse | null;
  profileSharing: ProfileSharingResponse | null;
  adminProfiles: {
    profiles: Profile[];
    total: number;
  } | null;
  isLoading: boolean;
  isUpdating: boolean;
  isUploadingAvatar: boolean;
  isUploadingSharing: boolean;
  isFetchingDashboard: boolean;
  isFetchingUserInfo: boolean;
  isFetchingEmailsOnboarding: boolean;
  isAddingDocumentTypes: boolean;
  isSearchingProfiles: boolean;
  isCreatingFeedback: boolean;
  error: string | null;
  onboardingChatId: string | null;
  hasProfileBeenFetched: boolean;
}

const initialState: ProfileState = {
  currentProfile: null,
  dashboardData: null,
  profileSharing: null,
  adminProfiles: null,
  isLoading: false,
  isUpdating: false,
  isUploadingAvatar: false,
  isUploadingSharing: false,
  isFetchingDashboard: false,
  isFetchingUserInfo: false,
  isFetchingEmailsOnboarding: false,
  isAddingDocumentTypes: false,
  isSearchingProfiles: false,
  isCreatingFeedback: false,
  error: null,
  onboardingChatId: null,
  hasProfileBeenFetched: false,
};

// Async thunks
export const fetchMyProfileAsync = createAsyncThunk<
  Profile,
  void,
  { rejectValue: string }
>("profile/fetchMyProfile", async (_, { rejectWithValue }) => {
  try {
    return await profileService.fetchMyProfile();
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch profile");
  }
});

export const updateMyProfileAsync = createAsyncThunk<
  Profile,
  UpdateMyProfileRequest,
  { rejectValue: string }
>("profile/updateMyProfile", async (data, { rejectWithValue }) => {
  try {
    return await profileService.updateMyProfile(data);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update profile");
  }
});

export const fetchMyDashboardAsync = createAsyncThunk<
  FetchMyDashboardResponse,
  void,
  { rejectValue: string }
>("profile/fetchMyDashboard", async (_, { rejectWithValue }) => {
  try {
    return await profileService.fetchMyDashboard();
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch dashboard");
  }
});

export const uploadMyProfileAvatarAsync = createAsyncThunk<
  string,
  File | Blob,
  { rejectValue: string }
>("profile/uploadMyProfileAvatar", async (avatarFile, { rejectWithValue }) => {
  try {
    return await profileService.uploadMyProfileAvatar(avatarFile);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to upload avatar");
  }
});

export const uploadProfileSharingAsync = createAsyncThunk<
  Profile,
  { imageFile: File | Blob; sharingType: ProfileSharingType },
  { rejectValue: string }
>(
  "profile/uploadProfileSharing",
  async ({ imageFile, sharingType }, { rejectWithValue }) => {
    try {
      return await profileService.uploadProfileSharing(imageFile, sharingType);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload sharing image");
    }
  }
);

export const fetchProfileSharingAsync = createAsyncThunk<
  ProfileSharingResponse,
  string,
  { rejectValue: string }
>(
  "profile/fetchProfileSharing",
  async (profileSharingId, { rejectWithValue }) => {
    try {
      return await profileService.fetchProfileSharing(profileSharingId);
    } catch (error: any) {
      return rejectWithValue(
        error.message || "Failed to fetch profile sharing"
      );
    }
  }
);

export const addMyDocumentTypesAsync = createAsyncThunk<
  Profile,
  AddDocumentTypesRequest,
  { rejectValue: string }
>("profile/addMyDocumentTypes", async (data, { rejectWithValue }) => {
  try {
    return await profileService.addMyDocumentTypes(data);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to add document types");
  }
});

export const searchProfilesAsync = createAsyncThunk<
  AdminProfilesResponse,
  { search?: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  "profile/searchProfiles",
  async ({ search, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      return await profileService.searchProfiles(search, page, limit);
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to search profiles");
    }
  }
);

export const getProfileByIdAsync = createAsyncThunk<
  Profile,
  string,
  { rejectValue: string }
>("profile/getProfileById", async (userId, { rejectWithValue }) => {
  try {
    return await profileService.getProfileById(userId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch profile by ID");
  }
});

export const fetchUserInfoAsync = createAsyncThunk<
  Profile,
  void,
  { rejectValue: string }
>("profile/fetchUserInfo", async (_, { rejectWithValue }) => {
  try {
    return await profileService.fetchUserInfo();
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch user info");
  }
});

export const fetchEmailsOnboardingAsync = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("profile/fetchEmailsOnboarding", async (_, { rejectWithValue }) => {
  try {
    return await profileService.fetchEmailsOnboarding();
  } catch (error: any) {
    return rejectWithValue(
      error.message || "Failed to fetch emails onboarding"
    );
  }
});

export const createFeedbackAsync = createAsyncThunk<
  CreateFeedbackResponse,
  CreateFeedbackRequest,
  { rejectValue: string }
>("profile/createFeedback", async (data, { rejectWithValue }) => {
  try {
    return await profileService.createFeedback(data);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create feedback");
  }
});

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentProfile: (state, action: PayloadAction<Profile | null>) => {
      state.currentProfile = action.payload;
    },
    clearCurrentProfile: (state) => {
      state.currentProfile = null;
      state.hasProfileBeenFetched = false;
    },
    clearDashboardData: (state) => {
      state.dashboardData = null;
    },
    clearProfileSharing: (state) => {
      state.profileSharing = null;
    },
    clearAdminProfiles: (state) => {
      state.adminProfiles = null;
    },
    clearOnboardingChatId: (state) => {
      state.onboardingChatId = null;
    },
    clearAllProfileData: (state) => {
      state.currentProfile = null;
      state.dashboardData = null;
      state.profileSharing = null;
      state.adminProfiles = null;
      state.isLoading = false;
      state.isUpdating = false;
      state.isUploadingAvatar = false;
      state.isUploadingSharing = false;
      state.isFetchingDashboard = false;
      state.isFetchingUserInfo = false;
      state.isFetchingEmailsOnboarding = false;
      state.isAddingDocumentTypes = false;
      state.isSearchingProfiles = false;
      state.isCreatingFeedback = false;
      state.error = null;
      state.onboardingChatId = null;
      state.hasProfileBeenFetched = false;
    },
    updateProfileFromWebSocket: (state, action: PayloadAction<Profile>) => {
      // Update current profile if it's the same one being updated
      if (state.currentProfile?.id === action.payload.id) {
        state.currentProfile = action.payload;
      }

      // Update profile in dashboard data if it exists
      if (state.dashboardData?.profile?.id === action.payload.id) {
        state.dashboardData.profile = action.payload;
      }

      // Update profile in admin profiles if it exists
      if (state.adminProfiles) {
        const index = state.adminProfiles.profiles.findIndex(
          (profile) => profile.id === action.payload.id
        );
        if (index !== -1) {
          state.adminProfiles.profiles[index] = action.payload;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Profile
      .addCase(fetchMyProfileAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyProfileAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchingEmailsOnboarding = false;
        state.currentProfile = action.payload;
        state.error = null;
        state.hasProfileBeenFetched = true;
      })
      .addCase(fetchMyProfileAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch profile";
      })
      // Update My Profile
      .addCase(updateMyProfileAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateMyProfileAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        action.payload.avatar = state.currentProfile?.avatar;
        state.currentProfile = action.payload;
        state.error = null;
      })
      .addCase(updateMyProfileAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload || "Failed to update profile";
      })
      // Fetch My Dashboard
      .addCase(fetchMyDashboardAsync.pending, (state) => {
        state.isFetchingDashboard = true;
        state.error = null;
      })
      .addCase(fetchMyDashboardAsync.fulfilled, (state, action) => {
        state.isFetchingDashboard = false;
        state.dashboardData = action.payload;
        state.error = null;
      })
      .addCase(fetchMyDashboardAsync.rejected, (state, action) => {
        state.isFetchingDashboard = false;
        state.error = action.payload || "Failed to fetch dashboard";
      })
      // Upload My Profile Avatar
      .addCase(uploadMyProfileAvatarAsync.pending, (state) => {
        state.isUploadingAvatar = true;
        state.error = null;
      })
      .addCase(uploadMyProfileAvatarAsync.fulfilled, (state, action) => {
        state.isUploadingAvatar = false;
        // Update the avatar URL in current profile if it exists
        if (state.currentProfile) {
          state.currentProfile.avatar = action.payload;
        }
        state.error = null;
      })
      .addCase(uploadMyProfileAvatarAsync.rejected, (state, action) => {
        state.isUploadingAvatar = false;
        state.error = action.payload || "Failed to upload avatar";
      })
      // Upload Profile Sharing
      .addCase(uploadProfileSharingAsync.pending, (state) => {
        state.isUploadingSharing = true;
        state.error = null;
      })
      .addCase(uploadProfileSharingAsync.fulfilled, (state, action) => {
        state.isUploadingSharing = false;
        state.currentProfile = action.payload;
        state.error = null;
      })
      .addCase(uploadProfileSharingAsync.rejected, (state, action) => {
        state.isUploadingSharing = false;
        state.error = action.payload || "Failed to upload sharing image";
      })
      // Fetch Profile Sharing
      .addCase(fetchProfileSharingAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfileSharingAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profileSharing = action.payload;
        state.error = null;
      })
      .addCase(fetchProfileSharingAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch profile sharing";
      })
      // Add My Document Types
      .addCase(addMyDocumentTypesAsync.pending, (state) => {
        state.isAddingDocumentTypes = true;
        state.error = null;
      })
      .addCase(addMyDocumentTypesAsync.fulfilled, (state, action) => {
        state.isAddingDocumentTypes = false;
        state.currentProfile = action.payload;
        state.error = null;
      })
      .addCase(addMyDocumentTypesAsync.rejected, (state, action) => {
        state.isAddingDocumentTypes = false;
        state.error = action.payload || "Failed to add document types";
      })
      // Search Profiles (Admin)
      .addCase(searchProfilesAsync.pending, (state) => {
        state.isSearchingProfiles = true;
        state.error = null;
      })
      .addCase(searchProfilesAsync.fulfilled, (state, action) => {
        state.isSearchingProfiles = false;
        state.adminProfiles = action.payload;
        state.error = null;
      })
      .addCase(searchProfilesAsync.rejected, (state, action) => {
        state.isSearchingProfiles = false;
        state.error = action.payload || "Failed to search profiles";
      })
      // Get Profile By ID (Admin)
      .addCase(getProfileByIdAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProfileByIdAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        // Store as current profile for viewing
        state.currentProfile = action.payload;
        state.error = null;
      })
      .addCase(getProfileByIdAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch profile by ID";
      })
      // Fetch User Info (Onboarding)
      .addCase(fetchUserInfoAsync.pending, (state) => {
        state.isFetchingUserInfo = true;
        state.error = null;
      })
      .addCase(fetchUserInfoAsync.fulfilled, (state, action) => {
        state.isFetchingUserInfo = false;
        state.currentProfile = action.payload;
        state.error = null;
        state.hasProfileBeenFetched = true;
      })
      .addCase(fetchUserInfoAsync.rejected, (state, action) => {
        state.isFetchingUserInfo = false;
        state.error = action.payload || "Failed to fetch user info";
      })
      // Fetch Emails Onboarding
      .addCase(fetchEmailsOnboardingAsync.pending, (state) => {
        state.isFetchingEmailsOnboarding = true;
        state.error = null;
      })
      .addCase(fetchEmailsOnboardingAsync.fulfilled, (state, action) => {
        state.isFetchingEmailsOnboarding = false;
        state.onboardingChatId = action.payload;
        state.error = null;
      })
      .addCase(fetchEmailsOnboardingAsync.rejected, (state, action) => {
        state.isFetchingEmailsOnboarding = false;
        state.error = action.payload || "Failed to fetch emails onboarding";
      })
      // Create Feedback
      .addCase(createFeedbackAsync.pending, (state) => {
        state.isCreatingFeedback = true;
        state.error = null;
      })
      .addCase(createFeedbackAsync.fulfilled, (state, action) => {
        state.isCreatingFeedback = false;
        state.error = null;
      })
      .addCase(createFeedbackAsync.rejected, (state, action) => {
        state.isCreatingFeedback = false;
        state.error = action.payload || "Failed to create feedback";
      });
  },
});

export const {
  clearError,
  setCurrentProfile,
  clearCurrentProfile,
  clearDashboardData,
  clearProfileSharing,
  clearAdminProfiles,
  clearOnboardingChatId,
  clearAllProfileData,
  updateProfileFromWebSocket,
} = profileSlice.actions;

// Selector to check if profile has been fetched at least once
export const selectHasProfileBeenFetched = (state: { profile: ProfileState }) =>
  state.profile.hasProfileBeenFetched;

export default profileSlice.reducer;
