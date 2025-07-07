import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { fetchChatAsync } from "@/store/slices/chatSlice";
import { OnboardingStackParamList } from "@/types/navigation";
import { useTheme } from "@/hooks/useTheme";
import { fetchUserInfoAsync } from "@/store/slices/profileSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

type FetchingUserInfoScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "FetchingUserInfo"
>;

const LOADING_MESSAGES = [
  "Reading your emails...",
  "Planning next steps...",
  "Understanding your writing style...",
  "Learning about your job...",
  "Getting to know your communication patterns...",
  "Storing my knowledge on you...",
  "Okay almost ready...!",
  "Final touches coming in...",
];

export const FetchingUserInfoScreen = () => {
  const navigation = useNavigation<FetchingUserInfoScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isLoading: isChatLoading } = useAppSelector((state) => state.chat);
  const { currentProfile } = useAppSelector((state) => state.profile);
  const [isPolling, setIsPolling] = useState(false);
  const chatFound = useSelector(
    (state: RootState) =>
      state.chat.currentChat?.id === currentProfile?.id + "-onboarding"
  );
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const { colors } = useTheme();

  const styles = createStyles(colors);

  useEffect(() => {
    // Start polling when screen loads and profile is available
    if (currentProfile?.id) {
      handleStartPolling();
    }
  }, [currentProfile?.id]);

  useEffect(() => {
    // Start polling when screen loads and profile is available
    if (currentProfile?.onboarding === 1) {
      try {
        dispatch(fetchUserInfoAsync()).unwrap();
      } catch (err) {}
    }
  }, [currentProfile?.onboarding]);

  useEffect(() => {
    // Clean up polling when component unmounts
    return () => {
      setIsPolling(false);
    };
  }, []);

  // Typing animation effect
  useEffect(() => {
    if (!isPolling || chatFound) return;

    const currentMessage = LOADING_MESSAGES[currentMessageIndex];
    setTypedText("");
    setIsTyping(true);

    let charIndex = 0;
    const typingInterval = setInterval(() => {
      if (charIndex < currentMessage.length) {
        setTypedText(currentMessage.slice(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTyping(false);
        clearInterval(typingInterval);
      }
    }, 50); // Typing speed - 50ms per character

    return () => clearInterval(typingInterval);
  }, [currentMessageIndex, isPolling, chatFound]);

  // Message cycling effect - cycle through messages every 5 seconds
  useEffect(() => {
    if (!isPolling || chatFound) return;

    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prevIndex) =>
        prevIndex + 1 >= LOADING_MESSAGES.length
          ? LOADING_MESSAGES.length - 1
          : prevIndex + 1
      );
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(messageInterval);
  }, [isPolling, chatFound]);

  const handleStartPolling = () => {
    setIsPolling(true);
    setPollingAttempts(0);
    pollForChat();
  };

  const pollForChat = async () => {
    if (!currentProfile?.id) {
      return;
    }

    setInterval(() => {
      try {
        dispatch(fetchChatAsync(`${currentProfile.id}-onboarding`)).unwrap();
      } catch (error) {}
    }, 1000);
  };

  const isLoading = isPolling || isChatLoading;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Reading your inbox...</Text>
          <Text style={styles.subtitle}>
            We're preparing your personalized onboarding experience
          </Text>
        </View>

        <View style={styles.content}>
          {isLoading && !chatFound ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.typingText}>
                {typedText}
                {isTyping && <Text style={styles.cursor}>|</Text>}
              </Text>
            </View>
          ) : chatFound ? (
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>✅</Text>
                <Text style={styles.infoText}>
                  Your onboarding chat is ready!
                </Text>
              </View>
              {currentProfile && (
                <View style={styles.profileInfo}>
                  <Text style={styles.profileLabel}>Profile Details:</Text>
                  <Text style={styles.profileText}>
                    Name: {currentProfile.name || "Not set"}
                  </Text>
                  <Text style={styles.profileText}>
                    Email: {currentProfile.email || "Not set"}
                  </Text>
                  <Text style={styles.profileText}>
                    Company: {currentProfile.company || "Not set"}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>⏳</Text>
                <Text style={styles.infoText}>
                  Waiting for your chat to be created...
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {chatFound && (
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => navigation.navigate("OnboardingChat")}
            >
              <Text style={styles.primaryButtonText}>Continue to Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      padding: 20,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 60,
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
    content: {
      marginBottom: 60,
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
    },
    typingText: {
      fontSize: 18,
      color: colors.text,
      marginTop: 30,
      textAlign: "center",
      fontWeight: "500",
      minHeight: 25, // Prevent layout shift
    },
    cursor: {
      color: colors.primary,
      fontWeight: "normal",
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 20,
      textAlign: "center",
    },
    subLoadingText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 10,
      textAlign: "center",
      opacity: 0.7,
    },
    infoContainer: {
      gap: 20,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    infoIcon: {
      fontSize: 24,
      marginRight: 15,
    },
    infoText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    profileInfo: {
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    profileLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 10,
    },
    profileText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    actions: {
      gap: 15,
    },
    button: {
      borderRadius: 8,
      padding: 15,
      alignItems: "center",
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: colors.primary,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
  });
