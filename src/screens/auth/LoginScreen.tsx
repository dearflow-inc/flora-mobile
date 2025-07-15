import GoogleIcon from "@/../assets/tools/Google.svg";
import { OAUTH_CONFIG } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { secureStorage } from "@/services/secureStorage";
import {
  clearError,
  googleSignInAsync,
  signInAsync,
} from "@/store/slices/authSlice";
import { fetchMyProfileAsync } from "@/store/slices/profileSlice";
import { LoginCredentials, User } from "@/types/auth";
import { AuthStackParamList } from "@/types/navigation";
import {
  handleGoogleSignInCallback,
  initiateGoogleSignIn,
} from "@/utils/oauth";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Device from "expo-device";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;

export const LoginScreen = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "",
    password: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // Helper function to get device ID
  const getDeviceId = async (): Promise<string> => {
    let deviceId = await secureStorage.getItem("device_id");
    if (!deviceId) {
      deviceId =
        Device.modelName + "_" + Math.random().toString(36).substring(2, 15);
      await secureStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  // Handle Google Sign-In deep link
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const isGoogleSignInCallback = event.url.includes(
        `${OAUTH_CONFIG.DEEP_LINK_SCHEME}/oauth/signin-callback`
      );

      if (isGoogleSignInCallback) {
        try {
          const result = await handleGoogleSignInCallback(event.url);

          if (result.success && result.authToken && result.refreshToken) {
            // Dispatch Google Sign-In action
            await dispatch(
              googleSignInAsync({
                authToken: result.authToken,
                refreshToken: result.refreshToken,
                user: result.user as User,
              })
            ).unwrap();

            // Fetch profile immediately
            try {
              await dispatch(fetchMyProfileAsync()).unwrap();
              console.log("Profile fetched successfully after Google sign-in");
            } catch (profileError) {
              console.warn(
                "Failed to fetch profile after Google sign-in:",
                profileError
              );
            }
          } else {
            Alert.alert(
              "Error",
              result.error || "Google Sign-In failed. Please try again."
            );
          }
        } catch (error) {
          console.error("Google Sign-In error:", error);
          Alert.alert("Error", "Google Sign-In failed. Please try again.");
        } finally {
          setIsGoogleSigningIn(false);
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, [dispatch]);

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    if (!credentials.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
      errors.email = "Email is invalid";
    }

    if (!credentials.password) {
      errors.password = "Password is required";
    } else if (credentials.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      const result = await dispatch(signInAsync(credentials)).unwrap();

      // Check if email verification is needed
      if (!result.emailVerified) {
        navigation.navigate("VerifyEmail", { email: credentials.email });
        return;
      }

      // If email is verified, fetch profile immediately
      try {
        await dispatch(fetchMyProfileAsync()).unwrap();
        console.log("Profile fetched successfully after login");
      } catch (profileError) {
        console.warn("Failed to fetch profile after login:", profileError);
        // Continue anyway - AppNavigator will handle retry
      }

      // Navigation will be handled by the AppNavigator based on auth state
    } catch (error) {
      console.error("Login error:", error);
      // Handle different types of errors
      let errorMessage = "Login failed. Please try again.";

      if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object" && "message" in error) {
        errorMessage = error.message as string;
      } else if (error && typeof error === "object" && "toString" in error) {
        errorMessage = error.toString();
      }

      Alert.alert("Login Failed", errorMessage);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);

    try {
      // Get device information
      const deviceId = await getDeviceId();
      const deviceName =
        Device.modelName || Device.deviceName || "Unknown Device";

      // Initiate Google Sign-In flow
      await initiateGoogleSignIn(undefined, deviceId, deviceName);
    } catch (error) {
      console.error("Google Sign-In initiation error:", error);
      Alert.alert("Error", "Failed to start Google Sign-In. Please try again.");
      setIsGoogleSigningIn(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("Register");
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors.email && styles.inputError,
              ]}
              placeholder="Email"
              placeholderTextColor="#999999"
              value={credentials.email}
              onChangeText={(text) =>
                setCredentials({ ...credentials, email: text })
              }
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {validationErrors.email && (
              <Text style={styles.errorText}>{validationErrors.email}</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors.password && styles.inputError,
              ]}
              placeholder="Password"
              placeholderTextColor="#999999"
              value={credentials.password}
              onChangeText={(text) =>
                setCredentials({ ...credentials, password: text })
              }
              secureTextEntry
              autoCapitalize="none"
            />
            {validationErrors.password && (
              <Text style={styles.errorText}>{validationErrors.password}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            style={[
              styles.googleButton,
              isGoogleSigningIn && styles.buttonDisabled,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isGoogleSigningIn}
          >
            <GoogleIcon width={20} height={20} style={styles.googleIcon} />
            <Text style={styles.googleButtonText}>
              {isGoogleSigningIn ? "Signing In..." : "Sign in with Google"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Do not have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#F9F9F9",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 15,
    color: "#666666",
    fontSize: 14,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: "#333333",
    fontSize: 16,
    fontWeight: "600",
  },
  forgotPassword: {
    color: "#007AFF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666666",
  },
  signUpText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
