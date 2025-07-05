import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthStackParamList } from "@/types/navigation";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { RegisterScreen } from "@/screens/auth/RegisterScreen";
import { ForgotPasswordScreen } from "@/screens/auth/ForgotPasswordScreen";
import { VerifyEmailScreen } from "@/screens/auth/VerifyEmailScreen";
import { useAppSelector } from "@/hooks/redux";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  // Check if user is authenticated but email is not verified
  const isEmailVerified = user?.emailVerified ?? false;
  const needsEmailVerification = isAuthenticated && !isEmailVerified;

  // Determine the initial screen
  const initialRouteName = needsEmailVerification ? "VerifyEmail" : "Login";

  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen
        name="VerifyEmail"
        component={VerifyEmailScreen}
        initialParams={{ email: user?.email || "" }}
      />
    </Stack.Navigator>
  );
};
