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
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { signUpAsync, clearError } from "@/store/slices/authSlice";
import { AuthStackParamList } from "@/types/navigation";
import { RegisterCredentials } from "@/types/auth";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Register"
>;

export const RegisterScreen = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [credentials, setCredentials] = useState<RegisterCredentials>({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

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

    if (!credentials.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (credentials.password !== credentials.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const result = await dispatch(signUpAsync(credentials)).unwrap();

      // Check if email verification is needed
      if (!result.emailVerified) {
        navigation.navigate("VerifyEmail", { email: credentials.email });
        return;
      }

      // Navigation will be handled by the AppNavigator based on auth state
    } catch (error) {
      Alert.alert("Registration Failed", error as string);
    }
  };

  const handleSignIn = () => {
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
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

          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                validationErrors.confirmPassword && styles.inputError,
              ]}
              placeholder="Confirm Password"
              placeholderTextColor="#999999"
              value={credentials.confirmPassword}
              onChangeText={(text) =>
                setCredentials({ ...credentials, confirmPassword: text })
              }
              secureTextEntry
              autoCapitalize="none"
            />
            {validationErrors.confirmPassword && (
              <Text style={styles.errorText}>
                {validationErrors.confirmPassword}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={handleSignIn}>
            <Text style={styles.signInText}>Sign In</Text>
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
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#666666",
  },
  signInText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
