import axios, { AxiosInstance } from "axios";
import { API_CONFIG } from "@/config/api";

export interface RegenerateTextRequest {
  originalText: string;
  sectionToReplace: string;
  modificationInstructions: string;
  formerVersions: Array<{ question: string; result: string }>;
}

export interface RegenerateTextResponse {
  replacement: string;
  error?: boolean;
  message?: string;
}

class RegenerateTextService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.API_BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: API_CONFIG.HEADERS,
    });

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

  async regenerateText(
    values: RegenerateTextRequest
  ): Promise<RegenerateTextResponse> {
    try {
      const response = await this.api.post<RegenerateTextResponse>(
        "/regenerate-text",
        values
      );

      const data = response?.data;
      if (!data || data?.error) {
        throw new Error(data?.message || "Received no data!");
      }

      return {
        replacement: data.replacement,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to regenerate text"
      );
    }
  }
}

export const regenerateTextService = new RegenerateTextService();
