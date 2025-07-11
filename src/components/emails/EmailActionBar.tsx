import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface EmailActionBarProps {
  onAskAI: () => void;
  onRefresh: () => void;
  onFollowUp: () => void;
  onAttach: () => void;
  onSend: () => void;
  onUndoSend: () => void;
  isAskingAI: boolean;
  isSending: boolean;
  isExecuting: boolean;
  hasFollowUp: boolean;
  pendingSend: boolean;
  undoSendTimer: number;
  disabled?: boolean;
}

export const EmailActionBar: React.FC<EmailActionBarProps> = ({
  onAskAI,
  onRefresh,
  onFollowUp,
  onAttach,
  onSend,
  onUndoSend,
  isAskingAI,
  isSending,
  isExecuting,
  hasFollowUp,
  pendingSend,
  undoSendTimer,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const isLoadingOrDisabled =
    isAskingAI || isSending || isExecuting || disabled;

  return (
    <View style={styles.container}>
      <View style={styles.actionButtons}>
        {/* Ask AI Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onAskAI}
          disabled={isLoadingOrDisabled}
        >
          <MaterialIcons name="auto-awesome" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Refresh Button */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onRefresh}
          disabled={isLoadingOrDisabled}
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
          disabled={disabled}
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
          disabled={disabled}
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
        {!pendingSend ? (
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
                <Text style={styles.sendButtonText}>Send</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.undoSendContainer}>
            <Text style={styles.undoSendText}>Sending in {undoSendTimer}s</Text>
            <TouchableOpacity style={styles.undoButton} onPress={onUndoSend}>
              <Text style={styles.undoButtonText}>Undo</Text>
            </TouchableOpacity>
          </View>
        )}
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
    undoSendContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    undoSendText: {
      fontSize: 14,
      color: colors.text,
      marginRight: 12,
    },
    undoButton: {
      backgroundColor: colors.primary,
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 6,
    },
    undoButtonText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "500",
    },
  });
