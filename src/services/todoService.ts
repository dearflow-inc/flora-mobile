import {
  CreateTodoRequest,
  Todo,
  TodoSortBy,
  TodosResponse,
  UpdateTodoRequest,
  UpdateTodoStateRequest,
} from "@/types/todo";
import { createApiInstance } from "@/utils/apiInstance";
import { AxiosInstance } from "axios";

class TodoService {
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

  async createTodo(data: CreateTodoRequest): Promise<Todo> {
    try {
      const response = await this.api.post<Todo>("/todos", data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create todo");
    }
  }

  async updateTodo(id: string, data: UpdateTodoRequest): Promise<Todo> {
    try {
      const response = await this.api.post<Todo>(`/todos/${id}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update todo");
    }
  }

  async updateTodoState(
    id: string,
    data: UpdateTodoStateRequest
  ): Promise<Todo> {
    try {
      const response = await this.api.post<Todo>(`/todos/${id}/state`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Failed to update todo state"
      );
    }
  }

  async getTodos(
    page: number = 1,
    limit: number = 10,
    sortBy: TodoSortBy = TodoSortBy.NEWEST
  ): Promise<TodosResponse> {
    try {
      const response = await this.api.get<TodosResponse>("/todos/my", {
        params: { page, limit, sortBy },
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch todos");
    }
  }

  async getTodoById(id: string): Promise<Todo> {
    try {
      const response = await this.api.get<Todo>(`/todos/${id}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch todo");
    }
  }
}

export const todoService = new TodoService();
