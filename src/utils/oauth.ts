import { Linking } from "react-native";
import Constants from "expo-constants";
import { API_CONFIG, OAUTH_CONFIG, PLATFORM_CONFIG } from "@/config/api";

export enum AuthUserExternalIdType {
  GOOGLE = "GOOGLE",
  AZURE = "AZURE",
}

export const getMobileOAuthUrl = (
  tool: { externalIdType: AuthUserExternalIdType; scope?: Array<string> },
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
  scope: Array<string>,
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
  console.log(OAUTH_CONFIG.GOOGLE_CLIENT_ID);
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
  scope: Array<string>,
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

export const initiateOAuth = async (
  provider: "gmail" | "outlook",
  sessionAuthUserId?: string,
  deviceId?: string,
  deviceName?: string,
  scope?: Array<string>
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
