import { useTheme } from "@/hooks/useTheme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface AIModalProps {
  visible: boolean;
  onClose: () => void;
  question: string;
  onQuestionChange: (text: string) => void;
  onAskAI: () => void;
  isAskingAI: boolean;
}

export const AIModal: React.FC<AIModalProps> = ({
  visible,
  onClose,
  question,
  onQuestionChange,
  onAskAI,
  isAskingAI,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Ask AI for Help</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.modalInput}
            value={question}
            onChangeText={onQuestionChange}
            placeholder="Describe what you want AI to help with..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={3}
          />

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalButtonPrimary]}
              onPress={onAskAI}
              disabled={isAskingAI || !question.trim()}
            >
              {isAskingAI ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.modalButtonTextPrimary}>Ask AI</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

interface FollowUpModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (followUpIn?: number) => void;
}

export const FollowUpModal: React.FC<FollowUpModalProps> = ({
  visible,
  onClose,
  onSelectTime,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const followUpOptions = [
    { title: "Let Flora decide", value: undefined, icon: "psychology" },
    { title: "In 1 hour", value: 1000 * 60 * 60, icon: "schedule" },
    { title: "In 8 hours", value: 1000 * 60 * 60 * 8, icon: "schedule" },
    { title: "In 1 day", value: 1000 * 60 * 60 * 24, icon: "schedule" },
    { title: "In 3 days", value: 1000 * 60 * 60 * 24 * 3, icon: "schedule" },
    { title: "In 1 week", value: 1000 * 60 * 60 * 24 * 7, icon: "schedule" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Schedule Follow-up</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.followUpOptions}>
            {followUpOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.followUpOption}
                onPress={() => {
                  onSelectTime(option.value);
                  onClose();
                }}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.followUpOptionText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface SnoozeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (snoozeFor: number) => void;
}

export const SnoozeModal: React.FC<SnoozeModalProps> = ({
  visible,
  onClose,
  onSelectTime,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const snoozeOptions = [
    { title: "In 30 minutes", value: 1000 * 60 * 30, icon: "schedule" },
    { title: "In 1 hour", value: 1000 * 60 * 60, icon: "schedule" },
    { title: "In 3 hours", value: 1000 * 60 * 60 * 3, icon: "schedule" },
    { title: "In 8 hours", value: 1000 * 60 * 60 * 8, icon: "schedule" },
    { title: "In 1 day", value: 1000 * 60 * 60 * 24, icon: "schedule" },
    { title: "In 3 days", value: 1000 * 60 * 60 * 24 * 3, icon: "schedule" },
    { title: "In 1 week", value: 1000 * 60 * 60 * 24 * 7, icon: "schedule" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Snooze Task</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.followUpOptions}>
            {snoozeOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.followUpOption}
                onPress={() => {
                  onSelectTime(option.value);
                  onClose();
                }}
              >
                <MaterialIcons
                  name={option.icon as any}
                  size={20}
                  color={colors.primary}
                />
                <Text style={styles.followUpOptionText}>{option.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      padding: 20,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: 16,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 12,
    },
    modalButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalButtonText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    modalButtonTextPrimary: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "500",
    },
    followUpOptions: {
      gap: 12,
    },
    followUpOption: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    followUpOptionText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
  });
