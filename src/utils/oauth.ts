import { API_CONFIG, OAUTH_CONFIG, PLATFORM_CONFIG } from "@/config/api";
import { User } from "@/types/auth";
import { Linking } from "react-native";

export enum AuthUserExternalIdType {
  GOOGLE = "GOOGLE",
  AZURE = "AZURE",
  GOOGLE_SIGN_IN = "GOOGLE_SIGN_IN",
}

export const getMobileOAuthUrl = (
  tool: { externalIdType: AuthUserExternalIdType; scope?: string[] },
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string
) => {
  const scope = tool.scope || [];

  switch (tool.externalIdType) {
    case AuthUserExternalIdType.GOOGLE:
      return getMobileGoogleUrl(scope, sessionAuthUserId, deviceId, deviceName);
    case AuthUserExternalIdType.AZURE:
      return getMobileAzureUrl(scope, sessionAuthUserId, deviceId, deviceName);
    default:
      return "";
  }
};

export const getMobileGoogleUrl = (
  scope: string[],
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string
) => {
  const rootUrl = `https://accounts.google.com/o/oauth2/v2/auth`;

  // Merge provided scopes with default scopes
  const newScope = [...OAUTH_CONFIG.GOOGLE_SCOPES, ...scope];

  // Remove duplicates
  const uniqueScopes = [...new Set(newScope)];

  const redirectUrl = `${OAUTH_CONFIG.DEEP_LINK_SCHEME}/oauth/callback`;

  const options: Record<string, string> = {
    redirect_uri: `${
      PLATFORM_CONFIG.environment === "local"
        ? "http://localhost:4000"
        : API_CONFIG.API_BASE_URL
    }/authentication/google`,
    client_id: OAUTH_CONFIG.GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: uniqueScopes.join(" "),
    state: `redirect=${redirectUrl}+provider=google+sessionAuthUserId=${
      sessionAuthUserId || ""
    }+deviceId=${deviceId || ""}+deviceName=${deviceName || ""}`,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const getMobileAzureUrl = (
  scope: string[],
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string
) => {
  const rootUrl = `https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize`;

  // Merge provided scopes with default scopes
  const allScopes = [...OAUTH_CONFIG.AZURE_SCOPES, ...scope];

  // Remove duplicates
  const uniqueScopes = [...new Set(allScopes)];

  // Get the deep link scheme
  const redirectUrl = `${OAUTH_CONFIG.DEEP_LINK_SCHEME}/oauth/callback`;

  const options = {
    client_id: OAUTH_CONFIG.AZURE_CLIENT_ID,
    response_type: "code",
    redirect_uri: `${
      PLATFORM_CONFIG.environment === "local"
        ? "http://localhost:4000"
        : API_CONFIG.API_BASE_URL
    }/authentication/azure`,
    scope: uniqueScopes.join(" "),
    prompt: "select_account",
    state: `redirect=${redirectUrl}+provider=outlook+sessionAuthUserId=${
      sessionAuthUserId || ""
    }+deviceId=${deviceId || ""}+deviceName=${deviceName || ""}`,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const getMobileGoogleSignInUrl = (
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string
) => {
  const rootUrl = `https://accounts.google.com/o/oauth2/v2/auth`;

  // Use only profile scopes for sign-in
  const scopes = OAUTH_CONFIG.GOOGLE_SIGN_IN_SCOPES;

  const redirectUrl = `${OAUTH_CONFIG.DEEP_LINK_SCHEME}/oauth/signin-callback`;

  const options: Record<string, string> = {
    redirect_uri: `${
      PLATFORM_CONFIG.environment === "local"
        ? "http://localhost:4000"
        : API_CONFIG.API_BASE_URL
    }/authentication/sign-in/google`,
    client_id: OAUTH_CONFIG.GOOGLE_SIGN_IN_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    include_granted_scopes: "true",
    prompt: "consent",
    scope: scopes.join(" "),
    state: `redirect=${redirectUrl}+provider=google-signin+sessionAuthUserId=${
      sessionAuthUserId || ""
    }+deviceId=${deviceId || ""}+deviceName=${deviceName || ""}`,
  };

  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

export const initiateOAuth = async (
  provider: "gmail" | "outlook",
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string,
  scope?: string[]
) => {
  const toolConfig = {
    externalIdType:
      provider === "gmail"
        ? AuthUserExternalIdType.GOOGLE
        : AuthUserExternalIdType.AZURE,
    scope: scope || [], // You can add specific scopes here
  };

  const oauthUrl = getMobileOAuthUrl(
    toolConfig,
    sessionAuthUserId,
    deviceId,
    deviceName
  );
  console.log("oauthUrl", oauthUrl);
  try {
    await Linking.openURL(oauthUrl);
  } catch (error) {
    console.error("Failed to open OAuth URL:", error);
    throw error;
  }
};

export const initiateGoogleSignIn = async (
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string
) => {
  const oauthUrl = getMobileGoogleSignInUrl(
    sessionAuthUserId,
    deviceId,
    deviceName
  );
  console.log("Google Sign-In URL:", oauthUrl);
  try {
    await Linking.openURL(oauthUrl);
  } catch (error) {
    console.error("Failed to open Google Sign-In URL:", error);
    throw error;
  }
};

export const handleOAuthCallback = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const error = urlObj.searchParams.get("error") === "true";

    if (error) {
      throw new Error(`Connecting OAuth failed`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.warn(error);
    return {
      success: false,
    };
  }
};

export const handleGoogleSignInCallback = async (url: string) => {
  try {
    const urlObj = new URL(url);
    const error = urlObj.searchParams.get("error") === "true";

    if (error) {
      throw new Error(`Google Sign-In failed`);
    }

    // Extract token from URL
    const token = urlObj.searchParams.get("token");

    if (!token) {
      throw new Error("No token received from Google Sign-In");
    }

    // Validate the token with the backend
    const validationResult = await validateTemporaryToken(token);

    return {
      success: true,
      authToken: validationResult.authToken,
      refreshToken: validationResult.refreshToken,
      user: {
        authUserId: validationResult.authUserId,
        roles: validationResult.roles,
        isAuthenticated: validationResult.isAuthenticated,
        email: validationResult.email,
        emailVerified: validationResult.emailVerified,
        externalIds: validationResult.externalIds,
        paymentPlans: validationResult.paymentPlans,
      } as User,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export const sendCodeToBackend = async (
  code: string,
  provider: string,
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string
) => {
  try {
    const response = await fetch(
      `${API_CONFIG.API_BASE_URL}/auth/mobile/callback`,
      {
        method: "POST",
        headers: {
          ...API_CONFIG.HEADERS,
        },
        body: JSON.stringify({
          code,
          provider,
          sessionAuthUserId,
          deviceId,
          deviceName,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to send code to backend:", error);
    throw error;
  }
};

export const validateTemporaryToken = async (token: string) => {
  try {
    const response = await fetch(
      `${API_CONFIG.API_BASE_URL}/authentication/mobile/validate-token`,
      {
        method: "POST",
        headers: {
          ...API_CONFIG.HEADERS,
        },
        body: JSON.stringify({
          token,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to validate temporary token:", error);
    throw error;
  }
};
