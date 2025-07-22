import { useAppDispatch } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import { completeSuggestedAction } from "@/store/slices/chatSlice";
import {
  ChatMessageSuggestedAction,
  SuggestedActionType,
} from "@/types/suggestedAction";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ConnectInboxModal } from "./ConnectInboxModal";
import { SpacesDrawer } from "./spaces/SpacesDrawer";

interface SuggestedActionProps {
  chatId: string;
  chatMessageId: string;
  action: ChatMessageSuggestedAction;
  onSetChatInput: (input: string) => void;
  onSendSuggestedAction: (actionText: string) => Promise<void>;
  disabled?: boolean;
  shouldShowSuggestedActions?: boolean;
}

export const SuggestedAction = ({
  chatId,
  chatMessageId,
  action,
  onSetChatInput,
  onSendSuggestedAction,
  disabled = false,
  shouldShowSuggestedActions = false,
}: SuggestedActionProps) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const styles = createStyles(colors);
  const [showConnectInboxModal, setShowConnectInboxModal] = useState(false);
  const [showSpacesDrawer, setShowSpacesDrawer] = useState(false);

  const handleCompleteAction = () => {
    if (action.complete || disabled) return;
    dispatch(
      completeSuggestedAction({
        messageId: chatMessageId,
        actionId: action.id,
      })
    );
  };

  const handleSuggestedResponse = () => {
    if (disabled) return;
    handleCompleteAction();
    onSendSuggestedAction(action.entityId);
  };

  const handleConnectTool = () => {
    handleCompleteAction();
    setShowConnectInboxModal(true);
  };

  const handleBuyPlan = () => {
    if (disabled) return;
    handleCompleteAction();
    Alert.alert("Upgrade Plan", `Upgrade to ${action.entityId}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upgrade",
        onPress: () => console.log("Buy plan:", action.entityId),
      },
    ]);
  };

  const handleDisplay = () => {
    handleCompleteAction();

    if (action.entityId === "spaces-overview") {
      setShowSpacesDrawer(true);
    } else {
      Alert.alert("Display Content", `Display: ${action.entityId}`, [
        { text: "OK" },
      ]);
    }
  };

  return (
    <>
      {shouldShowSuggestedActions &&
        action.type === SuggestedActionType.SUGGESTED_RESPONSE_BUTTON &&
        !disabled && (
          <TouchableOpacity
            style={[styles.responseButton, disabled && styles.disabled]}
            onPress={handleSuggestedResponse}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.responseButtonText,
                disabled && styles.disabledText,
              ]}
            >
              {action.entityId}
            </Text>
          </TouchableOpacity>
        )}

      {action.type === SuggestedActionType.CONNECT_TOOL && (
        <TouchableOpacity
          style={[styles.connectButton]}
          onPress={handleConnectTool}
          activeOpacity={0.7}
        >
          <MaterialIcons name="link" size={16} color={colors.primary} />
          <Text style={[styles.connectButtonText]}>
            Connect {action.entityId}
          </Text>
        </TouchableOpacity>
      )}

      {action.type === SuggestedActionType.SUGGEST_BUY_PLAN && !disabled && (
        <TouchableOpacity
          style={[styles.planButton, disabled && styles.disabled]}
          onPress={handleBuyPlan}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="upgrade"
            size={16}
            color={disabled ? colors.textSecondary : "#FF6B35"}
          />
          <Text
            style={[styles.planButtonText, disabled && styles.disabledText]}
          >
            Upgrade Plan
          </Text>
        </TouchableOpacity>
      )}

      {action.type === SuggestedActionType.DISPLAY && (
        <TouchableOpacity
          style={[styles.displayButton, disabled && styles.disabled]}
          onPress={handleDisplay}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="visibility"
            size={16}
            color={disabled ? colors.textSecondary : colors.primary}
          />
          <Text
            style={[styles.displayButtonText, disabled && styles.disabledText]}
          >
            {action.entityId}
          </Text>
        </TouchableOpacity>
      )}

      <ConnectInboxModal
        visible={showConnectInboxModal}
        onClose={() => setShowConnectInboxModal(false)}
        onSuccess={() => {
          Alert.alert("Success", "Inbox connected successfully!");
        }}
        updateOnboarding={false}
      />
      <SpacesDrawer
        visible={showSpacesDrawer}
        onClose={() => setShowSpacesDrawer(false)}
      />
    </>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    responseButton: {
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: colors.surface,
    },
    responseButtonText: {
      fontSize: 14,
      color: colors.text,
    },
    connectButton: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: colors.primary + "10",
    },
    connectButtonText: {
      fontSize: 14,
      color: colors.primary,
      marginLeft: 6,
    },
    planButton: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FF6B35",
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: "#FF6B35" + "10",
    },
    planButtonText: {
      fontSize: 14,
      color: "#FF6B35",
      marginLeft: 6,
    },
    displayButton: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: 8,
      marginBottom: 8,
      backgroundColor: colors.surface,
    },
    displayButtonText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 6,
    },
    disabled: {
      opacity: 0.5,
    },
    disabledText: {
      color: colors.textSecondary,
    },
  });
