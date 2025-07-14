import { API_CONFIG } from "@/config/api";
import { addLocalDelayInterceptor } from "@/utils/apiInterceptor";
import axios, { AxiosInstance } from "axios";

// Factory function to create axios instances with local delay interceptor
export const createApiInstance = (): AxiosInstance => {
  const api = axios.create({
    baseURL: API_CONFIG.API_BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: API_CONFIG.HEADERS,
  });

  // Add local delay interceptor
  addLocalDelayInterceptor(api);

  return api;
};
