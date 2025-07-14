import {
  AddDocumentTypesRequest,
  AdminProfilesResponse,
  CreateFeedbackRequest,
  CreateFeedbackResponse,
  FetchEmailsOnboardingResponse,
  FetchMyDashboardResponse,
  FetchMyProfileResponse,
  Profile,
  ProfileSharingResponse,
  ProfileSharingType,
  UpdateMyProfileRequest,
  UpdateMyProfileResponse,
} from "@/types/profile";
import { createApiInstance } from "@/utils/apiInstance";
import { AxiosInstance } from "axios";

class ProfileService {
  private api: AxiosInstance;

  constructor() {
    this.api = createApiInstance();

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        // Token will be added by the auth interceptor when needed
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - will be handled by the auth flow
          return Promise.reject(error);
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(authToken: string, refreshToken: string): void {
    this.api.defaults.headers.Authorization = `JWT ${authToken};;;;;${refreshToken}`;
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.Authorization;
  }

  // GET /profiles/my - Get my profile
  async fetchMyProfile(): Promise<Profile> {
    try {
      const response = await this.api.get<FetchMyProfileResponse>(
        "/profiles/my"
      );
      return response.data.profile;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }

  // POST /profiles/my - Update my profile
  async updateMyProfile(data: UpdateMyProfileRequest): Promise<Profile> {
    try {
      const response = await this.api.post<UpdateMyProfileResponse>(
        "/profiles/my",
        data
      );
      return response.data.profile;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update profile"
      );
    }
  }

  // GET /profiles/my/dashboard - Get my dashboard information
  async fetchMyDashboard(): Promise<FetchMyDashboardResponse> {
    try {
      const response = await this.api.get<FetchMyDashboardResponse>(
        "/profiles/my/dashboard"
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch dashboard"
      );
    }
  }

  // POST /profiles/my/upload/avatar - Upload profile avatar
  async uploadMyProfileAvatar(avatarFile: File | Blob): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("avatar", avatarFile);

      const response = await this.api.post<string>(
        "/profiles/my/upload/avatar",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to upload avatar"
      );
    }
  }

  // POST /profiles/my/upload/sharing - Upload profile sharing image
  async uploadProfileSharing(
    imageFile: File | Blob,
    sharingType: ProfileSharingType
  ): Promise<Profile> {
    try {
      const formData = new FormData();
      formData.append("avatar", imageFile);
      formData.append("sharingType", sharingType);

      const response = await this.api.post<{ profile: Profile }>(
        "/profiles/my/upload/sharing",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data.profile;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to upload sharing image"
      );
    }
  }

  // GET /profiles/sharing/:profileSharingId - Get profile sharing by ID
  async fetchProfileSharing(
    profileSharingId: string
  ): Promise<ProfileSharingResponse> {
    try {
      const response = await this.api.get<ProfileSharingResponse>(
        `/profiles/sharing/${profileSharingId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch profile sharing"
      );
    }
  }

  // POST /profiles/my/document-types - Add document types to my profile
  async addMyDocumentTypes(data: AddDocumentTypesRequest): Promise<Profile> {
    try {
      const response = await this.api.post<FetchMyProfileResponse>(
        "/profiles/my/document-types",
        data
      );
      return response.data.profile;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to add document types"
      );
    }
  }

  // GET /profiles - Search profiles (Admin only)
  async searchProfiles(
    search?: string,
    page: number = 1,
    limit: number = 10
  ): Promise<AdminProfilesResponse> {
    try {
      const response = await this.api.get<AdminProfilesResponse>("/profiles", {
        params: { search, page, limit },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to search profiles"
      );
    }
  }

  // GET /profiles/:userId - Get profile by ID (Admin only)
  async getProfileById(userId: string): Promise<Profile> {
    try {
      const response = await this.api.get<FetchMyProfileResponse>(
        `/profiles/${userId}`
      );
      return response.data.profile;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch profile by ID"
      );
    }
  }

  // POST /profiles/onboarding/fetch-info - Fetch user information during onboarding
  async fetchUserInfo(): Promise<Profile> {
    try {
      const response = await this.api.post<FetchMyProfileResponse>(
        "/profiles/onboarding/fetch-info"
      );
      return response.data.profile;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch user info"
      );
    }
  }

  // POST /profiles/onboarding/fetch-emails - Fetch user emails during onboarding
  async fetchEmailsOnboarding(): Promise<string> {
    try {
      const response = await this.api.post<FetchEmailsOnboardingResponse>(
        "/profiles/onboarding/fetch-emails"
      );
      return response.data.chatId;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch emails onboarding"
      );
    }
  }

  // POST /admin/feedback-discord - Create feedback
  async createFeedback(
    data: CreateFeedbackRequest
  ): Promise<CreateFeedbackResponse> {
    try {
      const response = await this.api.post<CreateFeedbackResponse>(
        "/admin/feedback-discord",
        data
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create feedback"
      );
    }
  }
}

export const profileService = new ProfileService();
