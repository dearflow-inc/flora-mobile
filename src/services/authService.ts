import { createApiInstance } from "@/config/api";
import {
  AuthResponse,
  AuthUserUsage,
  LoginCredentials,
  PasswordResetResponse,
  RefreshAuthResponse,
  RegisterCredentials,
  UpdatePasswordResponse,
  VerifyEmailResponse,
  sendVerificationCodeResponse,
} from "@/types/auth";
import { AxiosInstance } from "axios";

class AuthService {
  private api: AxiosInstance;
  private platform = "mobile";

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

  async signIn(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post(
        "/authentication/mobile/sign-in",
        credentials
      );

      if (response.data.error) {
        throw new Error(response.data.message || "Sign in failed");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Sign in failed");
    }
  }

  async signUp(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await this.api.post(
        "/authentication/mobile/sign-up",
        credentials
      );

      if (response.data.error) {
        throw new Error(response.data.message || "Sign up failed");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Sign up failed");
    }
  }

  async signOut(): Promise<{ success: boolean }> {
    try {
      const response = await this.api.get("/authentication/sign-out");

      if (response.data.error) {
        throw new Error(response.data.message || "Sign out failed");
      }

      return response.data;
    } catch (error: any) {
      // Even if logout fails on server, we should clear local storage
      console.error("Logout error:", error);
      return { success: true };
    }
  }

  async refreshAuthentication(): Promise<RefreshAuthResponse> {
    try {
      const response = await this.api.post("/authentication/mobile/refresh");

      if (
        response.data.statusCode === 400 ||
        response.data.statusCode === 500 ||
        response.data.statusCode === 501
      ) {
        throw new Error("Authentication refresh failed");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Token refresh failed");
    }
  }

  async verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
    try {
      const response = await this.api.post("/authentication/verify-email", {
        email,
        code,
      });

      if (response.data.error) {
        throw new Error(response.data.message || "Email verification failed");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Email verification failed"
      );
    }
  }

  async resendVerificationEmail(
    email: string
  ): Promise<sendVerificationCodeResponse> {
    try {
      const response = await this.api.post("/authentication/my/validate");

      if (response.data.error) {
        throw new Error(
          response.data.message || "Failed to resend verification email"
        );
      }

      return { success: response.data.success };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to resend verification email"
      );
    }
  }

  async requestPasswordReset(email: string): Promise<PasswordResetResponse> {
    try {
      const response = await this.api.post(
        "/authentication/request-reset-password",
        {
          email,
        }
      );

      if (response.data.error) {
        throw new Error(
          response.data.message || "Password reset request failed"
        );
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to send reset email"
      );
    }
  }

  async updatePassword(
    email: string,
    code: string,
    newPassword: string
  ): Promise<UpdatePasswordResponse> {
    try {
      const response = await this.api.post("/authentication/update-password", {
        email,
        code,
        newPassword,
      });

      if (response.data.error) {
        throw new Error(response.data.message || "Password update failed");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to reset password"
      );
    }
  }

  async checkEmailExists(email: string): Promise<{ exists: boolean }> {
    try {
      const response = await this.api.get("/authentication/email-exists", {
        params: { email },
      });

      if (response.data.error) {
        throw new Error(response.data.message || "Email check failed");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to check email");
    }
  }

  setAuthToken(authToken: string, refreshToken: string): void {
    this.api.defaults.headers.Authorization = `JWT ${authToken};;;;;${refreshToken}`;
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.Authorization;
  }

  async getUsageByType(type: string): Promise<AuthUserUsage> {
    try {
      const response = await this.api.get("/authentication/usage", {
        params: { type },
      });

      if (response.data.error) {
        throw new Error(response.data.message || "Failed to fetch usage");
      }

      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch usage");
    }
  }

  // Helper method to set base URL if needed
  setBaseURL(url: string): void {
    this.api.defaults.baseURL = url;
  }
}

export const authService = new AuthService();
