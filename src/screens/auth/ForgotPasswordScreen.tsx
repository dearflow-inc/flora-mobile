import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { authService } from "@/services/authService";
import { AuthStackParamList } from "@/types/navigation";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "ForgotPassword"
>;

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError("Email is required");
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Email is invalid");
      return false;
    }
    setEmailError("");
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail(email)) return;

    setIsLoading(true);
    try {
      await authService.requestPasswordReset(email);
      Alert.alert(
        "Reset Email Sent",
        "Check your email for password reset instructions.",
        [
          {
            text: "OK",
            onPress: () => navigation.navigate("Login"),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error as string);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email address and we'll send you a link to reset your
            password.
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              placeholder="Email"
              placeholderTextColor="#999999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Sending..." : "Send Reset Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBackToLogin}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
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
    textAlign: "center",
    lineHeight: 24,
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
  backButton: {
    marginTop: 20,
    alignItems: "center",
  },
  backButtonText: {
    color: "#007AFF",
    fontSize: 16,
  },
});
