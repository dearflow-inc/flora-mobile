import { ChatView } from "@/components/ChatView";
import { WebSocketStatusIndicator } from "@/components/WebSocketStatusIndicator";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  fetchEmailsOnboardingAsync,
  updateMyProfileAsync,
} from "@/store/slices/profileSlice";
import { OnboardingStackParamList } from "@/types/navigation";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OnboardingChatScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "OnboardingChat"
>;

export const OnboardingChatScreen = () => {
  const navigation = useNavigation<OnboardingChatScreenNavigationProp>();

  const dispatch = useAppDispatch();
  const { isFetchingEmailsOnboarding, isUpdating, onboardingChatId } =
    useAppSelector((state) => state.profile);

  const { colors } = useTheme();

  const styles = createStyles(colors);

  const handleChatClosed = async () => {
    try {
      await dispatch(fetchEmailsOnboardingAsync()).unwrap();

      // Mark onboarding as complete (step 3)
      await dispatch(updateMyProfileAsync({ onboarding: 3 })).unwrap();

      // The AppNavigator will automatically switch to the App stack
      // when onboardingStep >= 3
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
    }
  };

  const isLoading = isFetchingEmailsOnboarding || isUpdating;
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isFetchingEmailsOnboarding
              ? "Setting up your chat..."
              : "Preparing your onboarding experience..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          Flora has learned about your inbox but needs a little more information
          before we start.
        </Text>
        {/* Add WebSocket status indicator for debugging */}
        <WebSocketStatusIndicator showDetails={true} />
      </View>

      <ChatView
        offsetChat={0}
        chatId={onboardingChatId || undefined}
        autoCreateChat={!onboardingChatId}
        aiInitConversation={true}
        onChatCreated={(chatId) => {
          console.log("Onboarding chat created:", chatId);
        }}
        onChatClosed={handleChatClosed}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginBottom: 60,
    },
    header: {
      alignItems: "center",
      padding: 20,
      paddingBottom: 10,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 20,
      textAlign: "center",
    },
  });
