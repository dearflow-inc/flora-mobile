import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Alert, Linking, Platform } from "react-native";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { checkAuthAsync } from "@/store/slices/authSlice";
import {
  setInitialized,
  loadThemeAsync,
  setInitializedIfProfileFetched,
  forceInitialized,
} from "@/store/slices/appSlice";
import { fetchMyProfileAsync } from "@/store/slices/profileSlice";
import { notificationService } from "@/services/notificationService";
import { secureStorage } from "@/services/secureStorage";
import { RootStackParamList } from "@/types/navigation";
import { LoadingScreen } from "@/screens/LoadingScreen";
import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { AppStackNavigator } from "./AppStackNavigator";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";
import { useNavigation } from "@react-navigation/native";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { isAuthenticated, isLoading, user } = useAppSelector(
    (state) => state.auth
  );
  const { currentProfile } = useAppSelector((state) => state.profile);
  const { isInitialized } = useAppSelector((state) => state.app);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [promptType, setPromptType] = useState<"canAskAgain" | "needsSettings">(
    "canAskAgain"
  );

  // Check if user is authenticated but email is not verified
  const isEmailVerified = user?.emailVerified ?? false;
  const needsEmailVerification = isAuthenticated && !isEmailVerified;

  // Check if user needs onboarding
  const onboardingStep = currentProfile?.onboarding ?? 0;
  const needsOnboarding =
    isAuthenticated && isEmailVerified && onboardingStep < 3;

  // User is fully ready for main app
  const isFullyAuthenticated =
    isAuthenticated && isEmailVerified && onboardingStep >= 3;

  // Check if we should ask user about notifications (once per week)
  const shouldAskAboutNotifications = async (): Promise<boolean> => {
    try {
      const lastAskedStr = await secureStorage.getItem(
        "last_notification_prompt"
      );
      if (!lastAskedStr) {
        return true; // Never asked before
      }

      const lastAsked = new Date(lastAskedStr);
      const now = new Date();
      const weekInMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      return now.getTime() - lastAsked.getTime() > weekInMs;
    } catch (error) {
      console.error("Error checking notification prompt history:", error);
      return true; // Default to asking if we can't check
    }
  };

  // Ask user if they want to enable notifications
  const askUserAboutNotifications = async (): Promise<void> => {
    const shouldAsk = await shouldAskAboutNotifications();
    if (!shouldAsk) {
      return; // Don't ask if we asked recently
    }

    // Check current permission status
    const permissionStatus = await notificationService.getPermissionStatus();
    console.log("Current permission status:", permissionStatus);

    // Record that we asked, regardless of what happens next
    await secureStorage.setItem(
      "last_notification_prompt",
      new Date().toISOString()
    );

    if (permissionStatus.granted) {
      // Permissions already granted, try to register device
      try {
        await notificationService.registerDevice();
        console.log("Notifications enabled successfully");
      } catch (error) {
        console.error("Failed to register device:", error);
      }
      return;
    }

    if (permissionStatus.canAskAgain) {
      // Can still ask for permissions
      setPromptType("canAskAgain");
      setShowNotificationPrompt(true);
    } else {
      // Permissions previously denied, need to go to Settings
      setPromptType("needsSettings");
      setShowNotificationPrompt(true);
    }
  };

  const handlePermissionGranted = async () => {
    setShowNotificationPrompt(false);

    if (promptType === "canAskAgain") {
      try {
        await notificationService.registerDevice();
        console.log("Notifications enabled successfully");
      } catch (error) {
        console.error("Failed to enable notifications:", error);
        Alert.alert(
          "Error",
          "Failed to enable notifications. You can try again later in Settings.",
          [{ text: "OK" }]
        );
      }
    } else {
      // Open settings for 'needsSettings' case
      try {
        if (Platform.OS === "ios") {
          await Linking.openURL("app-settings:");
        } else {
          // For Android, open the app-specific settings
          await Linking.openSettings();
        }
      } catch (error) {
        console.error("Failed to open settings:", error);
        Alert.alert(
          "Error",
          "Could not open Settings. Please manually go to Settings and enable notifications for DearFlow.",
          [{ text: "OK" }]
        );
      }
    }
  };

  const handlePermissionDenied = () => {
    setShowNotificationPrompt(false);
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Load theme preference from storage
        await dispatch(loadThemeAsync());
        console.log("Theme loaded from storage");

        // Check if user is already authenticated
        const authResult = await dispatch(checkAuthAsync()).unwrap();
        console.log("User authenticated on startup");

        // If authenticated and email verified, fetch profile before initializing
        if (authResult.emailVerified) {
          console.log("Fetching user profile...");
          try {
            await dispatch(fetchMyProfileAsync()).unwrap();
            console.log("Profile fetched successfully");
            // Profile was fetched successfully, use conditional initialization
            dispatch(setInitializedIfProfileFetched(true));
          } catch (error) {
            console.warn("Failed to fetch profile:", error);
            // Profile fetch failed, but we can still initialize
            dispatch(forceInitialized(true));
          }
        } else {
          // User is authenticated but email not verified, no profile needed
          dispatch(forceInitialized(true));
        }
      } catch (error) {
        // User is not authenticated, which is fine - no profile needed
        console.log("User not authenticated on startup");
        dispatch(forceInitialized(true));
      }
    };

    initializeApp();
  }, [dispatch]);

  // Fetch profile when user becomes authenticated during runtime (not startup)
  useEffect(() => {
    if (isAuthenticated && isEmailVerified && !currentProfile) {
      console.log("Fetching user profile during runtime...");
      setTimeout(() => {
        dispatch(fetchMyProfileAsync()).catch((error) => {
          console.warn("Failed to fetch profile during runtime:", error);
        });
      }, 300);
    }
  }, [isAuthenticated, isEmailVerified, currentProfile, dispatch]);

  // Set up notification listeners when fully authenticated
  useEffect(() => {
    if (isFullyAuthenticated) {
      console.log("Setting up notification listeners");

      // Set navigation reference for notification service
      notificationService.setNavigation(navigation);

      // Add push token listener
      const tokenListener = notificationService.addPushTokenListener();

      // Add notification response listener
      const responseListener =
        notificationService.addNotificationResponseListener();

      // Register device for notifications and handle failures
      const setupNotifications = async () => {
        try {
          await notificationService.registerDevice();
        } catch (error) {
          console.warn("Failed to register device for notifications:", error);
          // Ask user if they want to enable notifications (if we haven't asked recently)
          await askUserAboutNotifications();
        }
      };

      setupNotifications();

      // Cleanup listeners when user logs out
      return () => {
        console.log("Cleaning up notification listeners");
        notificationService.removeAllListeners();
      };
    }
  }, [isFullyAuthenticated, navigation]);

  // Show loading screen while initializing or when auth is loading
  // Also show loading when user is authenticated+verified but profile is still loading
  const shouldShowLoading =
    !isInitialized || (isAuthenticated && isEmailVerified && !currentProfile);

  if (shouldShowLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {needsEmailVerification ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : needsOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : isFullyAuthenticated ? (
          <Stack.Screen name="App" component={AppStackNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>

      <NotificationPermissionPrompt
        visible={showNotificationPrompt}
        onClose={handlePermissionDenied}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={handlePermissionDenied}
        title={
          promptType === "canAskAgain" ? "Stay Updated" : "Stay Connected! 📱"
        }
        message={
          promptType === "canAskAgain"
            ? "Enable notifications to get reminders about your todos and deadlines and messages from Flora."
            : Platform.select({
                ios: "Notifications help you stay on top of your tasks and messages. You'll get timely reminders and never miss important updates.\n\nTo enable notifications, please go to Settings > DearFlow > Notifications and turn on Allow Notifications.",
                android:
                  "Notifications help you stay on top of your tasks and messages. You'll get timely reminders and never miss important updates.\n\nTo enable notifications, please go to Settings > Apps > DearFlow > Notifications and turn on notifications.",
                default:
                  "Notifications help you stay on top of your tasks and messages. You'll get timely reminders and never miss important updates.\n\nTo enable notifications, please go to your device Settings and enable notifications for DearFlow.",
              })
        }
        buttonText={
          promptType === "canAskAgain"
            ? "Enable Notifications"
            : "Open Settings"
        }
      />
    </>
  );
};
