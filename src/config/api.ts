import { addLocalDelayInterceptor } from "@/utils/apiInterceptor";
import axios, { AxiosInstance } from "axios";
import Constants from "expo-constants";

// Utility function to add delay for local environment
export const addLocalDelay = async (): Promise<void> => {
  const environment = Constants.expoConfig?.extra?.ENVIRONMENT;
  if (environment === "local") {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds delay
  }
};

// API Configuration
export const API_CONFIG = {
  // Get API base URL from environment variables
  API_BASE_URL:
    Constants.expoConfig?.extra?.API_BASE_URL || "http://localhost:4000",

  // API timeout in milliseconds
  TIMEOUT: 10000,

  // Request headers
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
};

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

// OAuth Configuration
export const OAUTH_CONFIG = {
  // Google OAuth
  GOOGLE_CLIENT_ID: Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID,

  // Azure OAuth
  AZURE_CLIENT_ID: Constants.expoConfig?.extra?.AZURE_CLIENT_ID,

  // Deep Link Scheme
  DEEP_LINK_SCHEME: Constants.expoConfig?.extra?.DEEP_LINK_SCHEME,

  // OAuth Scopes
  GOOGLE_SCOPES: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],

  AZURE_SCOPES: ["Mail.ReadWrite", "MailboxSettings.ReadWrite"],
};

// Platform-specific configuration
export const PLATFORM_CONFIG = {
  environment: Constants.expoConfig?.extra?.ENVIRONMENT,
  platform: "mobile",
  version: "1.0.0",
};
