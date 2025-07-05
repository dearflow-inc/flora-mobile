import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "@/types/navigation";
import { ConnectInboxScreen } from "@/screens/onboarding/ConnectInboxScreen";
import { FetchingUserInfoScreen } from "@/screens/onboarding/FetchingUserInfoScreen";
import { OnboardingChatScreen } from "@/screens/onboarding/OnboardingChatScreen";
import { useAppSelector } from "@/hooks/redux";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator = () => {
  const { currentProfile } = useAppSelector((state) => state.profile);

  // Determine the initial screen based on onboarding step
  const onboardingStep = currentProfile?.onboarding ?? 0;
  const getInitialRouteName = () => {
    switch (onboardingStep) {
      case 0:
        return "ConnectInbox";
      case 1:
        return "FetchingUserInfo";
      case 2:
        return "OnboardingChat";
      default:
        return "ConnectInbox";
    }
  };

  return (
    <Stack.Navigator
      initialRouteName={getInitialRouteName()}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="ConnectInbox" component={ConnectInboxScreen} />
      <Stack.Screen
        name="FetchingUserInfo"
        component={FetchingUserInfoScreen}
      />
      <Stack.Screen name="OnboardingChat" component={OnboardingChatScreen} />
    </Stack.Navigator>
  );
};
