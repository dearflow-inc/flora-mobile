import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { notificationService } from "@/services/notificationService";

interface NotificationPermissionPromptProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  title?: string;
  message?: string;
  buttonText?: string;
}

export const NotificationPermissionPrompt: React.FC<
  NotificationPermissionPromptProps
> = ({
  visible,
  onClose,
  onPermissionGranted,
  onPermissionDenied,
  title = "Stay Updated",
  message = "Enable notifications to get reminders about your todos and deadlines and messages from Flora.",
  buttonText = "Enable Notifications",
}) => {
  const handleEnableNotifications = async () => {
    // If the button text is "Open Settings", just call the callback
    if (buttonText === "Open Settings") {
      onPermissionGranted?.();
      return;
    }

    try {
      const granted = await notificationService.requestPermissions();

      if (granted) {
        // Re-register device with new permissions
        await notificationService.registerDevice();

        Alert.alert(
          "Notifications Enabled",
          "You'll now receive reminders about your todos!",
          [{ text: "OK", onPress: onClose }]
        );

        onPermissionGranted?.();
      } else {
        Alert.alert(
          "Notifications Disabled",
          "You can enable notifications later in your device settings.",
          [{ text: "OK", onPress: onClose }]
        );

        onPermissionDenied?.();
      }
    } catch (error) {
      console.error("Error requesting notifications:", error);
      Alert.alert(
        "Error",
        "Failed to enable notifications. Please try again.",
        [{ text: "OK", onPress: onClose }]
      );
    }
  };

  const handleNotNow = () => {
    onClose();
    onPermissionDenied?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="notifications" size={48} color="#007AFF" />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.enableButton]}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.enableButtonText}>{buttonText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.notNowButton]}
              onPress={handleNotNow}
            >
              <Text style={styles.notNowButtonText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    maxWidth: 340,
    width: "100%",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  enableButton: {
    backgroundColor: "#007AFF",
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  notNowButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  notNowButtonText: {
    color: "#666666",
    fontSize: 16,
    fontWeight: "500",
  },
});
