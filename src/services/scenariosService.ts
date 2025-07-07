import axios, { AxiosResponse } from "axios";
import {
  Scenarios,
  FetchScenariosResponse,
  ContextView,
  CreateContextViewRequest,
  UpdateContextViewRequest,
  ScenarioItem,
  CreateScenarioItemRequest,
  ScenarioTag,
  CreateScenarioTagRequest,
} from "@/types/scenarios";
import { API_CONFIG } from "@/config/api";

class ScenariosService {
  private api = axios.create({
    baseURL: API_CONFIG.API_BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
  });

  // Set auth token for requests
  setAuthToken(authToken: string, refreshToken: string): void {
    this.api.defaults.headers.Authorization = `JWT ${authToken};;;;;${refreshToken}`;
  }

  // Remove auth token
  removeAuthToken(): void {
    delete this.api.defaults.headers.Authorization;
  }

  // Scenarios
  async fetchMyScenarios(): Promise<Scenarios> {
    try {
      const response: AxiosResponse<FetchScenariosResponse> =
        await this.api.get("/scenarios/my");
      return response.data.scenarios;
    } catch (error) {
      console.error("Error fetching my scenarios:", error);
      throw error;
    }
  }

  async fetchScenariosByProfileId(profileId: string): Promise<Scenarios> {
    try {
      const response: AxiosResponse<FetchScenariosResponse> =
        await this.api.get(`/scenarios/${profileId}`);
      return response.data.scenarios;
    } catch (error) {
      console.error("Error fetching scenarios by profile ID:", error);
      throw error;
    }
  }

  // Context Views
  async createContextView(
    data: CreateContextViewRequest
  ): Promise<ContextView> {
    try {
      const response: AxiosResponse<ContextView> = await this.api.post(
        "/scenarios/context-views",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating context view:", error);
      throw error;
    }
  }

  async updateContextView(
    id: string,
    data: UpdateContextViewRequest
  ): Promise<ContextView> {
    try {
      const response: AxiosResponse<ContextView> = await this.api.post(
        `/scenarios/context-views/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating context view:", error);
      throw error;
    }
  }

  async deleteContextView(id: string): Promise<void> {
    try {
      await this.api.delete(`/scenarios/context-views/${id}`);
    } catch (error) {
      console.error("Error deleting context view:", error);
      throw error;
    }
  }

  // Scenario Items
  async createScenarioItem(
    data: CreateScenarioItemRequest
  ): Promise<ScenarioItem> {
    try {
      const response: AxiosResponse<ScenarioItem> = await this.api.post(
        "/scenarios/scenario-items",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating scenario item:", error);
      throw error;
    }
  }

  async updateScenarioItem(
    id: string,
    data: Partial<ScenarioItem>
  ): Promise<ScenarioItem> {
    try {
      const response: AxiosResponse<ScenarioItem> = await this.api.post(
        `/scenarios/scenario-items/${id}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating scenario item:", error);
      throw error;
    }
  }

  async deleteScenarioItem(id: string): Promise<void> {
    try {
      await this.api.delete(`/scenarios/scenario-items/${id}`);
    } catch (error) {
      console.error("Error deleting scenario item:", error);
      throw error;
    }
  }

  // Scenario Tags
  async createScenarioTag(
    data: CreateScenarioTagRequest
  ): Promise<ScenarioTag> {
    try {
      const response: AxiosResponse<ScenarioTag> = await this.api.post(
        "/scenarios/tags",
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error creating scenario tag:", error);
      throw error;
    }
  }

  async updateScenarioTag(
    internalId: string,
    data: { tag: Partial<ScenarioTag> }
  ): Promise<ScenarioTag> {
    try {
      const response: AxiosResponse<ScenarioTag> = await this.api.post(
        `/scenarios/tags/${internalId}`,
        data
      );
      return response.data;
    } catch (error) {
      console.error("Error updating scenario tag:", error);
      throw error;
    }
  }

  async deleteScenarioTag(internalId: string): Promise<void> {
    try {
      await this.api.delete(`/scenarios/tags/${internalId}`);
    } catch (error) {
      console.error("Error deleting scenario tag:", error);
      throw error;
    }
  }
}

export const scenariosService = new ScenariosService();
