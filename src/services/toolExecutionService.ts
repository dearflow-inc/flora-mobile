import { createApiInstance } from "@/config/api";
import {
  CreateToolExecutionRequest,
  ExecuteToolExecutionRequest,
  ScheduleToolExecutionRequest,
  ToolExecution,
  ToolExecutionResponse,
  ToolExecutionsResponse,
  UpdateToolExecutionRequest,
} from "@/types/toolExecution";
import { AxiosInstance } from "axios";

class ToolExecutionService {
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

  // POST /tool-executions - Create a new tool execution
  async createToolExecution(
    data: CreateToolExecutionRequest
  ): Promise<ToolExecution> {
    try {
      const response = await this.api.post<ToolExecutionResponse>(
        "/tool-executions",
        data
      );
      return response.data.toolExecution;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to create tool execution"
      );
    }
  }

  // GET /tool-executions/my - Get all my tool executions
  async getMyToolExecutions(): Promise<ToolExecution[]> {
    try {
      const response = await this.api.get<ToolExecutionsResponse>(
        "/tool-executions/my"
      );
      return response.data.toolExecutions;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch tool executions"
      );
    }
  }

  // GET /tool-executions/:toolExecutionId - Get tool execution by ID
  async getToolExecutionById(toolExecutionId: string): Promise<ToolExecution> {
    try {
      const response = await this.api.get<ToolExecutionResponse>(
        `/tool-executions/${toolExecutionId}`
      );
      return response.data.toolExecution;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch tool execution"
      );
    }
  }

  // POST /tool-executions/:toolExecutionId - Update tool execution
  async updateToolExecution(
    toolExecutionId: string,
    data: UpdateToolExecutionRequest
  ): Promise<ToolExecution> {
    try {
      const response = await this.api.post<ToolExecutionResponse>(
        `/tool-executions/${toolExecutionId}`,
        data
      );
      return response.data.toolExecution;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update tool execution"
      );
    }
  }

  // POST /tool-executions/:toolExecutionId/execute - Execute tool execution
  async executeToolExecution(
    toolExecutionId: string,
    data: ExecuteToolExecutionRequest
  ): Promise<ToolExecution> {
    try {
      const response = await this.api.post<ToolExecutionResponse>(
        `/tool-executions/${toolExecutionId}/execute`,
        data
      );
      return response.data.toolExecution;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to execute tool execution"
      );
    }
  }

  // POST /tool-executions/:toolExecutionId/schedule - Schedule tool execution
  async scheduleToolExecution(
    toolExecutionId: string,
    data: ScheduleToolExecutionRequest
  ): Promise<ToolExecution> {
    try {
      const response = await this.api.post<ToolExecutionResponse>(
        `/tool-executions/${toolExecutionId}/schedule`,
        data
      );
      return response.data.toolExecution;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to schedule tool execution"
      );
    }
  }

  // POST /tool-executions/:toolExecutionId/unschedule - Unschedule tool execution
  async unscheduleToolExecution(
    toolExecutionId: string
  ): Promise<ToolExecution> {
    try {
      const response = await this.api.post<ToolExecutionResponse>(
        `/tool-executions/${toolExecutionId}/unschedule`
      );
      return response.data.toolExecution;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to unschedule tool execution"
      );
    }
  }

  // DELETE /tool-executions/:toolExecutionId - Delete tool execution
  async deleteToolExecution(toolExecutionId: string): Promise<void> {
    try {
      await this.api.delete(`/tool-executions/${toolExecutionId}`);
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to delete tool execution"
      );
    }
  }
}

export const toolExecutionService = new ToolExecutionService();
