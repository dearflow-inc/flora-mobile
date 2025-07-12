import { useTheme } from "@/hooks/useTheme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface EmailActionBarProps {
  onAskAI: () => void;
  onRefresh: () => void;
  onFollowUp: () => void;
  onAttach: () => void;
  onSend: () => void;
  isAskingAI: boolean;
  isSending: boolean;
  isExecuting: boolean;
  hasFollowUp: boolean;
  disabled?: boolean;
  sendButtonText?: string;
}

export const EmailActionBar: React.FC<EmailActionBarProps> = ({
  onAskAI,
  onRefresh,
  onFollowUp,
  onAttach,
  onSend,
  isAskingAI,
  isSending,
  isExecuting,
  hasFollowUp,
  disabled = false,
  sendButtonText = "Send",
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const isLoading = isAskingAI || isSending || isExecuting;
  const isLoadingOrDisabled =
    isAskingAI || isSending || isExecuting || disabled;

  return (
    <View style={styles.container}>
      <View style={styles.actionButtons}>
        {/* Ask AI Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAskAI}
          disabled={isLoading}
        >
          <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRefresh}
          disabled={isLoading}
        >
          <MaterialIcons
            name="refresh"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Follow-up Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onFollowUp}
          disabled={isLoading}
        >
          <MaterialIcons
            name="schedule"
            size={20}
            color={hasFollowUp ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>

        {/* Attachment Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAttach}
          disabled={isLoading}
        >
          <MaterialIcons
            name="attach-file"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Send Section */}
      <View style={styles.sendSection}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            isLoadingOrDisabled && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={isLoadingOrDisabled}
        >
          {isSending || isExecuting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="send" size={18} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>{sendButtonText}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    actionButtons: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButton: {
      padding: 8,
      marginRight: 8,
      borderRadius: 8,
    },
    sendSection: {
      flexDirection: "row",
      alignItems: "center",
    },
    sendButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
    },
    sendButtonDisabled: {
      opacity: 0.6,
    },
    sendButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 6,
    },
  });
