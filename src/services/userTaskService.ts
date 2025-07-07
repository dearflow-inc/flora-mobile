import axios, { AxiosInstance } from "axios";
import {
  UserTask,
  UserTasksResponse,
  UserTaskResponse,
  UserTasksAnalyticsResponse,
  CreateUserTaskRequest,
  UpdateUserTaskRequest,
  UpdateUserTaskActionDataRequest,
  IgnoreUserTaskRequest,
  CompleteUserTaskRequest,
  RateUserTaskRequest,
  UserTaskStatus,
} from "@/types/userTask";
import { API_CONFIG } from "@/config/api";

class UserTaskService {
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

  setAuthToken(token: string): void {
    this.api.defaults.headers.Authorization = token;
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.Authorization;
  }

  /**
   * Get all user tasks
   */
  async getUserTasks(
    status?: UserTaskStatus[],
    space?: string
  ): Promise<UserTasksResponse> {
    try {
      const params = new URLSearchParams();

      if (status && status.length > 0) {
        params.append("status", status.join(" "));
      }

      if (space) {
        params.append("space", space);
      }

      const queryString = params.toString();

      const url = `/user-tasks/my${queryString ? `?${queryString}` : ""}`;

      const response = await this.api.get<UserTasksResponse>(url);

      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch user tasks"
      );
    }
  }

  /**
   * Create a new user task
   */
  async createUserTask(
    request: CreateUserTaskRequest
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        "/user-tasks",
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create user task"
      );
    }
  }

  /**
   * Get user task by ID
   */
  async getUserTaskById(userTaskId: string): Promise<UserTaskResponse> {
    try {
      const response = await this.api.get<UserTaskResponse>(
        `/user-tasks/${userTaskId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch user task"
      );
    }
  }

  /**
   * Update user task
   */
  async updateUserTask(
    userTaskId: string,
    request: UpdateUserTaskRequest
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update user task"
      );
    }
  }

  /**
   * Update user task action data
   */
  async updateUserTaskActionData(
    userTaskId: string,
    request: UpdateUserTaskActionDataRequest
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/actions`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to update user task action data"
      );
    }
  }

  /**
   * Ignore user task
   */
  async ignoreUserTask(
    userTaskId: string,
    request: IgnoreUserTaskRequest
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/ignore`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to ignore user task"
      );
    }
  }

  /**
   * Delete user task
   */
  async deleteUserTask(userTaskId: string): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/delete`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete user task"
      );
    }
  }

  /**
   * Complete user task
   */
  async completeUserTask(
    userTaskId: string,
    request: CompleteUserTaskRequest = {}
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/complete`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to complete user task"
      );
    }
  }

  /**
   * Rate user task
   */
  async rateUserTask(
    userTaskId: string,
    request: RateUserTaskRequest
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/rate`,
        request
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to rate user task"
      );
    }
  }

  /**
   * Snooze user task
   */
  async snoozeUserTask(
    userTaskId: string,
    msTillReactivate: number,
    timeZone?: string
  ): Promise<UserTaskResponse> {
    try {
      const params = new URLSearchParams();
      params.append("ms", msTillReactivate.toString());

      if (timeZone) {
        params.append("timeZone", timeZone);
      }

      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/snooze?${params.toString()}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to snooze user task"
      );
    }
  }

  /**
   * Get user tasks analytics
   */
  async getUserTasksAnalytics(
    startDate?: Date,
    endDate?: Date
  ): Promise<UserTasksAnalyticsResponse> {
    try {
      const params = new URLSearchParams();

      if (startDate) {
        params.append("startDate", startDate.toISOString());
      }

      if (endDate) {
        params.append("endDate", endDate.toISOString());
      }

      const queryString = params.toString();
      const url = `/user-tasks/my/analytics${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await this.api.get<UserTasksAnalyticsResponse>(url);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch user tasks analytics"
      );
    }
  }

  /**
   * Delete user task action
   */
  async deleteUserTaskAction(
    userTaskId: string,
    actionId: string
  ): Promise<UserTaskResponse> {
    try {
      const response = await this.api.post<UserTaskResponse>(
        `/user-tasks/${userTaskId}/actions/${actionId}/delete`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete user task action"
      );
    }
  }
}

// Create and export a singleton instance
export const userTaskService = new UserTaskService();
