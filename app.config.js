const IS_DEV = process.env.NODE_ENV === "development";
const IS_PREVIEW = process.env.EAS_BUILD_PROFILE === "preview";
const IS_TESTFLIGHT = process.env.EAS_BUILD_PROFILE === "testflight";
const IS_PRODUCTION = process.env.EAS_BUILD_PROFILE === "production";

export default {
  expo: {
    name: "DearFlow",
    slug: "flora-mobile",
    version: "1.4.01",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "ai.dearflow.email",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    sdkVersion: "53.0.0",
    notification: {
      icon: "./assets/images/icon.png",
      color: "#ffffff",
      iosDisplayInForeground: true,
      androidCollapsedTitle: "New updates from Flora",
    },
    ios: {
      bundleIdentifier: "ai.dearflow.email",
      supportsTablet: false,
      associatedDomains: ["applinks:ai.dearflow.email"],
      infoPlist: {
        NSMicrophoneUsageDescription:
          "This app needs access to your microphone to record audio messages.",
        NSUserNotificationCenterDelegate: true,
        NSCameraUsageDescription:
          "This app needs access to your camera to take profile pictures.",
        NSPhotoLibraryUsageDescription:
          "This app needs access to your photo library to select profile pictures.",
        ITSAppUsesNonExemptEncryption: false,
      },
    },
    android: {
      package: "ai.dearflow.email",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      supportsTablet: false,
      permissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },
    web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-secure-store",
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#ffffff",
          defaultChannel: "default",
        },
      ],
      [
        "expo-apple-authentication",
        {
          // Additional Apple Authentication configuration
          serviceId:
            IS_TESTFLIGHT || IS_PRODUCTION
              ? "ai.dearflow.email"
              : "host.exp.Exponent",
        },
      ],
    ],
    extra: {
      ENVIRONMENT: IS_PRODUCTION
        ? "production"
        : IS_TESTFLIGHT
        ? "testflight"
        : "preview",
      GOOGLE_SIGN_IN_CLIENT_ID: IS_PRODUCTION
        ? "903375841365-2029qetav3iueqpjk3ek3rlln1s7118a.apps.googleusercontent.com"
        : "903375841365-tfi0rdplmk9p9q14me11gev9hkals65t.apps.googleusercontent.com",
      GOOGLE_CLIENT_ID: IS_PRODUCTION
        ? "539143776368-bv2q2a6ofipj58l4sb47muglr6gi3mp4.apps.googleusercontent.com"
        : "903375841365-dte3punlg82gaj90mjjhpegfo3fve82h.apps.googleusercontent.com",
      AZURE_CLIENT_ID: "b810117e-53b7-4b7e-a27a-c7e1e77a3a37",
      AZURE_TENANT_ID: "87017db8-66f4-4375-96c9-dd30790663b8",
      // Apple Sign-In configuration
      APPLE_SERVICE_ID: "ai.dearflow.email",
      // Environment-specific configurations
      DEEP_LINK_SCHEME:
        IS_DEV && !IS_PREVIEW
          ? "exp://10.0.0.46:8081/--"
          : "ai.dearflow.email:/",
      API_BASE_URL: IS_PRODUCTION
        ? "https://api.dearflow.ai" // Replace with your production API URL
        : IS_TESTFLIGHT
        ? "https://api.beta.dearflow.ai" // Replace with your staging API URL
        : "http://10.0.0.46:4000", // Replace with your computer's local IP address
      eas: {
        projectId: "122b3dc0-2f1d-4851-acc7-9beed4d4a0a5",
      },
    },
    owner: "benjamindrury",
  },
};
