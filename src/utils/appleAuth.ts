import { OAUTH_CONFIG } from "@/config/api";
import { AppleSignInCredentials } from "@/types/auth";
import * as AppleAuthentication from "expo-apple-authentication";

export const isAppleSignInAvailable = async (): Promise<boolean> => {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch (error) {
    console.error("Error checking Apple Sign-In availability:", error);
    return false;
  }
};

export const initiateAppleSignIn =
  async (): Promise<AppleSignInCredentials> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],

        // Add service ID if configured
        ...(OAUTH_CONFIG.APPLE_SERVICE_ID && {
          serviceId: OAUTH_CONFIG.APPLE_SERVICE_ID,
        }),
      });

      // Get the actual bundle identifier being used
      const clientId = OAUTH_CONFIG.APPLE_SERVICE_ID;

      return {
        identityToken: credential.identityToken!,
        authorizationCode: credential.authorizationCode!,
        user: credential.user,
        email: credential.email,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName || undefined,
              familyName: credential.fullName.familyName || undefined,
            }
          : null,
        // Add client ID to help with backend validation
        clientId: clientId,
      };
    } catch (error: any) {
      console.error("Apple Sign-In Error:", error);
      if (error.code === "ERR_CANCELED") {
        throw new Error("Apple Sign-In was cancelled");
      }
      throw new Error(error.message || "Apple Sign-In failed");
    }
  };
