import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import {
  verifyEmailAsync,
  resendVerificationEmailAsync,
  clearError,
  checkAuthAsync,
} from "@/store/slices/authSlice";
import { fetchMyProfileAsync } from "@/store/slices/profileSlice";
import { AuthStackParamList } from "@/types/navigation";

type VerifyEmailScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "VerifyEmail"
>;

type VerifyEmailScreenRouteProp = RouteProp<AuthStackParamList, "VerifyEmail">;

export const VerifyEmailScreen = () => {
  const navigation = useNavigation<VerifyEmailScreenNavigationProp>();
  const route = useRoute<VerifyEmailScreenRouteProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const email = route.params.email;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const validateCode = (code: string): boolean => {
    if (!code) {
      setCodeError("Verification code is required");
      return false;
    }
    if (code.length < 4) {
      setCodeError("Verification code must be at least 4 characters");
      return false;
    }
    setCodeError("");
    return true;
  };

  const handleVerifyEmail = async () => {
    if (!validateCode(code)) return;

    try {
      // Refresh auth state to get updated user info
      await dispatch(checkAuthAsync()).unwrap();
      await dispatch(fetchMyProfileAsync()).unwrap();

      await dispatch(verifyEmailAsync({ email, code })).unwrap();

      Alert.alert(
        "Email Verified!",
        "Your email has been successfully verified. You can now access the app.",
        [{ text: "OK" }]
      );
      // Navigation will be handled by AppNavigator based on emailVerified state
    } catch (error) {
      Alert.alert("Verification Failed", error as string);
    }
  };

  const handleResendCode = async (): Promise<void> => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    try {
      await dispatch(resendVerificationEmailAsync(email)).unwrap();
      setResendCooldown(60); // 60 second cooldown
      Alert.alert(
        "Code Sent",
        "A new verification code has been sent to your email.",
        [{ text: "OK" }]
      );
    } catch (error) {
      Alert.alert("Error", error as string);
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
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
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent a verification code to{"\n"}
            <Text style={styles.email}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, codeError && styles.inputError]}
              placeholder="Enter verification code"
              placeholderTextColor="#999999"
              value={code}
              onChangeText={(text) => setCode(text)}
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={10}
            />
            {codeError && <Text style={styles.errorText}>{codeError}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyEmail}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Verifying..." : "Verify Email"}
            </Text>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>Didn't receive the code?</Text>
            <TouchableOpacity
              onPress={handleResendCode}
              disabled={isResending || resendCooldown > 0}
            >
              <Text
                style={[
                  styles.resendLink,
                  (isResending || resendCooldown > 0) &&
                    styles.resendLinkDisabled,
                ]}
              >
                {isResending
                  ? "Sending..."
                  : resendCooldown > 0
                  ? `Resend in ${resendCooldown}s`
                  : "Resend Code"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleBackToLogin}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  email: {
    fontWeight: "600",
    color: "#007AFF",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  resendLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  resendLinkDisabled: {
    color: "#ccc",
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
});
