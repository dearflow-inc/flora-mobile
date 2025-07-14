import Constants from "expo-constants";

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

// OAuth Configuration
export const OAUTH_CONFIG = {
  // Google OAuth
  GOOGLE_CLIENT_ID: Constants.expoConfig?.extra?.GOOGLE_CLIENT_ID,

  // Google Sign-In OAuth (for authentication)
  GOOGLE_SIGN_IN_CLIENT_ID:
    Constants.expoConfig?.extra?.GOOGLE_SIGN_IN_CLIENT_ID,

  // Azure OAuth
  AZURE_CLIENT_ID: Constants.expoConfig?.extra?.AZURE_CLIENT_ID,

  // Deep Link Scheme
  DEEP_LINK_SCHEME: Constants.expoConfig?.extra?.DEEP_LINK_SCHEME,

  // OAuth Scopes
  GOOGLE_SCOPES: [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
  ],

  // Google Sign-In Scopes (minimal for authentication)
  GOOGLE_SIGN_IN_SCOPES: [
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
