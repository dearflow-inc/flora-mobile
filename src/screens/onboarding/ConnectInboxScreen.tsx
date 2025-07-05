import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Linking,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateMyProfileAsync } from "@/store/slices/profileSlice";
import { setTheme } from "@/store/slices/appSlice";
import { OnboardingStackParamList } from "@/types/navigation";
import { useTheme } from "@/hooks/useTheme";
import { ConnectInboxModal } from "@/components/ConnectInboxModal";

type ConnectInboxScreenNavigationProp = NativeStackNavigationProp<
  OnboardingStackParamList,
  "ConnectInbox"
>;

export const ConnectInboxScreen = () => {
  const navigation = useNavigation<ConnectInboxScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { isUpdating } = useAppSelector((state) => state.profile);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const { colors, isDark, theme } = useTheme();

  const styles = createStyles(colors);

  // Function to toggle theme
  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark";
    dispatch(setTheme(newTheme));
  };

  const handleConnectInbox = () => {
    setShowProviderModal(true);
  };

  const handleConnectSuccess = () => {
    navigation.navigate("FetchingUserInfo");
  };

  const handlePrivacyLink = () => {
    Linking.openURL("https://docs.dearflow.ai/your-privacy/security-mission");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.themeToggleContainer}>
        <View style={styles.themeToggle}>
          <MaterialIcons
            name="light-mode"
            size={20}
            color={!isDark ? colors.primary : colors.textSecondary}
          />
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={colors.surface}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
          <MaterialIcons
            name="dark-mode"
            size={20}
            color={isDark ? colors.primary : colors.textSecondary}
          />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>Connect Your Inbox</Text>
          <Text style={styles.subtitle}>
            Connect your email to get started with personalized assistance
          </Text>
        </View>

        <View style={styles.content}>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📧</Text>
              <Text style={styles.featureText}>
                Sync your emails automatically
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🤖</Text>
              <Text style={styles.featureText}>
                Get AI-powered actionable insights & todos
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>
                Smart notifications and reminders
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              isUpdating && styles.buttonDisabled,
            ]}
            onPress={handleConnectInbox}
            disabled={isUpdating}
          >
            <Text style={styles.primaryButtonText}>Connect Inbox</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.privacyLinkContainer}>
          <TouchableOpacity onPress={handlePrivacyLink}>
            <Text style={styles.privacyText}>
              We take your privacy serious.
            </Text>
            <Text style={styles.privacyLink}>How we handle your data?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConnectInboxModal
        visible={showProviderModal}
        onClose={() => setShowProviderModal(false)}
        onSuccess={handleConnectSuccess}
        updateOnboarding={true}
      />
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    themeToggleContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 5,
      backgroundColor: colors.background,
    },
    themeToggle: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 10,
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
    featureList: {
      gap: 20,
    },
    featureItem: {
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
    featureIcon: {
      fontSize: 24,
      marginRight: 15,
    },
    featureText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
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
    buttonDisabled: {
      backgroundColor: colors.border,
    },
    privacyLinkContainer: {
      marginTop: 30,
      alignItems: "center",
    },
    privacyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    privacyLink: {
      fontSize: 14,
      color: colors.primary,
      textAlign: "center",
      textDecorationLine: "underline",
    },
  });
