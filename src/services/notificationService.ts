import { API_CONFIG } from "@/config/api";
import { fetchWithDelay } from "@/utils/apiInterceptor";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { secureStorage } from "./secureStorage";

// Define notification types for conditional display
export enum SendMobileNotificationAction {
  USER_TASK_CREATED = "user_task_created",
  LOST_TOOL_ACCESS = "lost_tool_access",
  CHAT_MESSAGE_CREATED = "chat_message_created",
}

// Define which screens should show which notification types
const NOTIFICATION_EXCLUSION = {
  Chat: [SendMobileNotificationAction.CHAT_MESSAGE_CREATED],
};

// Global variable to store current navigation state
let currentNavigationState: {
  currentScreen?: "Chat";
  currentTab?: string;
} = {};

// Function to update current navigation state
export const updateNavigationState = (screen?: "Chat", tab?: string) => {
  currentNavigationState = {
    currentScreen: screen,
    currentTab: tab,
  };
};

// Function to check if notification should be shown based on current screen
const shouldShowNotification = (
  notificationType: SendMobileNotificationAction
): boolean => {
  const { currentScreen, currentTab } = currentNavigationState;

  if (!notificationType) {
    return false;
  }

  if (
    currentScreen &&
    NOTIFICATION_EXCLUSION[currentScreen]?.includes(notificationType)
  ) {
    return false;
  }

  return true;
};

// Configure notification behavior with conditional display
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Extract notification type from data
    const notificationType = notification.request.content.data
      ?.action as SendMobileNotificationAction;

    // Check if we should show this notification based on current screen
    const shouldShow = shouldShowNotification(notificationType);

    return {
      shouldShowAlert: shouldShow,
      shouldPlaySound: shouldShow,
      shouldSetBadge: true, // Always set badge regardless of screen
      shouldShowBanner: shouldShow,
      shouldShowList: true, // Always add to notification list
    };
  },
});

export interface DeviceInfo {
  pushToken?: string;
  deviceId: string;
  platform: "ios" | "android";
  isActive: boolean;
}

class NotificationService {
  private baseURL = `${API_CONFIG.API_BASE_URL}/profiles`;
  private tokenListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private navigation: any; // Store navigation reference

  // Method to set navigation reference
  setNavigation(navigation: any) {
    this.navigation = navigation;
  }

  private async getAuthHeaders() {
    const authToken = await secureStorage.getItem("auth_token");
    const refreshToken = await secureStorage.getItem("refresh_token");

    if (!authToken || !refreshToken) {
      throw new Error("No authentication tokens found");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `JWT ${authToken};;;;;${refreshToken}`,
    };
  }

  private async getDeviceId(): Promise<string> {
    // Try to get stored device ID first
    let deviceId = await secureStorage.getItem("device_id");

    if (!deviceId) {
      // Generate a unique device ID
      deviceId =
        Device.modelName + "_" + Math.random().toString(36).substring(2, 15);
      await secureStorage.setItem("device_id", deviceId);
    }

    return deviceId;
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (!Device.isDevice) {
        console.log("Must use physical device for push notifications");
        return false;
      }

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  async getPermissionStatus(): Promise<{
    granted: boolean;
    canAskAgain: boolean;
    status: string;
  }> {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      return {
        granted: status === "granted",
        canAskAgain: status === "undetermined", // On iOS, can only ask again if undetermined
        status: status,
      };
    } catch (error) {
      console.error("Error checking permission status:", error);
      return {
        granted: false,
        canAskAgain: false,
        status: "unknown",
      };
    }
  }

  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log("Must use physical device for push notifications");
        return null;
      }

      // Get project ID from configuration
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.error("No EAS project ID found in configuration");
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  async registerDevice(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const platform = Platform.OS as "ios" | "android";

      // Check if notifications are permitted
      const hasPermission = await this.requestPermissions();

      // If permissions are denied, throw an error to trigger the user prompt
      if (!hasPermission) {
        // Still register the device as inactive, but then throw error to ask user
        const deviceInfo: DeviceInfo = {
          pushToken: undefined,
          deviceId,
          platform,
          isActive: false,
        };

        await this.updatePushTokenOnBackend(deviceInfo);
        await secureStorage.setItem("notification_permission", "false");

        throw new Error("Notification permissions denied");
      }

      // Permissions granted, register with token
      const pushToken = (await this.getExpoPushToken()) || undefined;
      const deviceInfo: DeviceInfo = {
        pushToken,
        deviceId,
        platform,
        isActive: true,
      };

      await this.updatePushTokenOnBackend(deviceInfo);
      await secureStorage.setItem("notification_permission", "true");

      console.log("Device registered successfully:", deviceInfo);
    } catch (error) {
      console.warn("Error registering device:", error);
      throw error;
    }
  }

  private async updatePushTokenOnBackend(
    deviceInfo: DeviceInfo
  ): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetchWithDelay(`${this.baseURL}/my/push-tokens`, {
        method: "POST",
        headers,
        body: JSON.stringify(deviceInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update push token");
      }

      console.log("Push token updated successfully");
    } catch (error) {
      console.error("Error updating push token:", error);
      throw error;
    }
  }

  async checkPermissionStatus(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("Error checking permission status:", error);
      return false;
    }
  }

  async refreshTokenIfNeeded(): Promise<void> {
    try {
      const currentPermission = await this.checkPermissionStatus();
      const storedPermission = await secureStorage.getItem(
        "notification_permission"
      );

      // If permission status changed, re-register device
      if (currentPermission.toString() !== storedPermission) {
        console.log("Permission status changed, re-registering device");
        await this.registerDevice();
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
    }
  }

  // Listen for push token updates
  addPushTokenListener() {
    this.tokenListener = Notifications.addPushTokenListener(
      async (token: Notifications.DevicePushToken) => {
        console.log("Push token updated:", token.data);

        try {
          const deviceId = await this.getDeviceId();
          const platform = Platform.OS as "ios" | "android";

          const deviceInfo: DeviceInfo = {
            pushToken: token.data,
            deviceId,
            platform,
            isActive: true,
          };

          await this.updatePushTokenOnBackend(deviceInfo);
        } catch (error) {
          console.error("Error updating push token from listener:", error);
        }
      }
    );

    return this.tokenListener;
  }

  // Handle notification responses (when user taps notification)
  addNotificationResponseListener() {
    this.responseListener =
      Notifications.addNotificationResponseReceivedListener(
        (response: Notifications.NotificationResponse) => {
          console.log("Notification response received:", response);

          // Handle different notification types
          const rawData = response.notification.request.content.data;
          const notificationType =
            rawData?.action as SendMobileNotificationAction;

          const data: {
            userTaskId?: string;
            chatMessageId?: string;
            toolId?: string;
          } = rawData.data as any;

          switch (notificationType) {
            case SendMobileNotificationAction.USER_TASK_CREATED:
              if (this.navigation) {
                this.navigation.navigate("UserTaskDetail", {
                  userTaskId: data.userTaskId,
                });
              }
              break;

            case SendMobileNotificationAction.CHAT_MESSAGE_CREATED:
              if (this.navigation) {
                this.navigation.navigate("Chat", {
                  chatMessageId: data.chatMessageId,
                });
              }
              break;

            case SendMobileNotificationAction.LOST_TOOL_ACCESS:
              if (this.navigation) {
                this.navigation.navigate("Profile", {
                  screen: "Integrations",
                });
              }
              break;
          }
        }
      );

    return this.responseListener;
  }

  // Clean up listeners
  removeAllListeners() {
    if (this.tokenListener) {
      this.tokenListener.remove();
      this.tokenListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export const notificationService = new NotificationService();
