import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
} from "react-native";
import * as Device from "expo-device";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateMyProfileAsync } from "@/store/slices/profileSlice";
import GmailIcon from "@/../assets/tools/GoogleMail.svg";
import OutlookIcon from "@/../assets/tools/Outlook.svg";
import { initiateOAuth, handleOAuthCallback } from "@/utils/oauth";
import { OAUTH_CONFIG } from "@/config/api";
import { secureStorage } from "@/services/secureStorage";
import { useTheme } from "@/hooks/useTheme";

interface ConnectInboxModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  updateOnboarding?: boolean;
}

export const ConnectInboxModal = ({
  visible,
  onClose,
  onSuccess,
  updateOnboarding = false,
}: ConnectInboxModalProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isConnecting, setIsConnecting] = useState(false);
  const { colors } = useTheme();

  const styles = createStyles(colors);

  // Helper function to get device ID similar to notification service
  const getDeviceId = async (): Promise<string> => {
    let deviceId = await secureStorage.getItem("device_id");
    if (!deviceId) {
      deviceId =
        Device.modelName + "_" + Math.random().toString(36).substring(2, 15);
      await secureStorage.setItem("device_id", deviceId);
    }
    return deviceId;
  };

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      // Check for both custom scheme and Expo Go scheme
      const isOAuthCallback =
        event.url.includes(
          `${OAUTH_CONFIG.DEEP_LINK_SCHEME}://oauth/callback`
        ) || event.url.includes(`oauth/callback`);

      if (isOAuthCallback) {
        try {
          const result = await handleOAuthCallback(event.url);

          if (result.success) {
            // Update onboarding step if requested
            if (updateOnboarding) {
              await dispatch(updateMyProfileAsync({ onboarding: 1 })).unwrap();
            }

            // Close modal and call success callback
            onClose();
            onSuccess?.();
          } else {
            Alert.alert("Error", "Failed to connect inbox. Please try again.");
          }
        } finally {
          setIsConnecting(false);
        }
      }
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      subscription?.remove();
    };
  }, [dispatch, onClose, onSuccess, updateOnboarding]);

  const handleProviderSelect = async (provider: "gmail" | "outlook") => {
    setIsConnecting(true);

    try {
      // Get current user ID from auth state
      const sessionAuthUserId = user?.authUserId || "";

      // Get device information
      const deviceId = await getDeviceId();
      const deviceName =
        Device.modelName || Device.deviceName || "Unknown Device";

      // Initiate OAuth flow
      await initiateOAuth(provider, sessionAuthUserId, deviceId, deviceName, [
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/pubsub",
      ]);
    } catch (error) {
      console.error("OAuth initiation error:", error);
      Alert.alert("Error", `Failed to connect ${provider}. Please try again.`);
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (isConnecting) return;
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose Your Provider</Text>
          <Text style={styles.modalSubtitle}>
            Select your email provider and connect your inbox
          </Text>

          <View style={styles.providerOptions}>
            <TouchableOpacity
              style={[
                styles.providerButton,
                isConnecting && styles.buttonDisabled,
              ]}
              onPress={() => handleProviderSelect("gmail")}
              disabled={isConnecting}
            >
              <GmailIcon width={24} height={24} style={styles.providerIcon} />
              <Text style={styles.providerText}>Gmail</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.providerButton,
                isConnecting && styles.buttonDisabled,
              ]}
              onPress={() => handleProviderSelect("outlook")}
              disabled={isConnecting}
            >
              <OutlookIcon width={24} height={24} style={styles.providerIcon} />
              <Text style={styles.providerText}>Outlook</Text>
            </TouchableOpacity>
          </View>

          {isConnecting && (
            <Text style={styles.connectingText}>Connecting...</Text>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isConnecting}
          >
            <Text
              style={[
                styles.cancelButtonText,
                isConnecting && styles.disabledText,
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 30,
      margin: 20,
      width: "90%",
      maxWidth: 400,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    modalTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
      marginBottom: 10,
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 30,
    },
    providerOptions: {
      gap: 15,
      marginBottom: 30,
    },
    providerButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    providerIcon: {
      width: 24,
      height: 24,
      marginRight: 15,
    },
    providerText: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    buttonDisabled: {
      opacity: 0.5,
    },
    connectingText: {
      fontSize: 16,
      color: colors.primary,
      textAlign: "center",
      marginBottom: 20,
    },
    cancelButton: {
      padding: 15,
      alignItems: "center",
    },
    cancelButtonText: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    disabledText: {
      color: colors.textSecondary,
      opacity: 0.5,
    },
  });
