import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { useTheme } from "@/hooks/useTheme";
import {
  ChatAttachment,
  SystemReferenceType,
  SystemReferenceTypeDisplay,
  SystemReferenceTypeIcons,
} from "@/types/attachment";
import {
  selectEmailById,
  selectEmailByExternalId,
} from "@/store/slices/emailSlice";
import { RootState } from "@/store";

interface ChatMessageAttachmentProps {
  attachment: ChatAttachment;
  onPress?: (attachment: ChatAttachment) => void;
}

export const ChatMessageAttachment = ({
  attachment,
  onPress,
}: ChatMessageAttachmentProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  // Get email data from store if attachment is an email
  const emailFromStore = useSelector((state: RootState) => {
    if (attachment.type === SystemReferenceType.EMAIL) {
      // Try to find by emailId first, then by externalId
      if (attachment.emailId) {
        return selectEmailById(state, attachment.emailId);
      } else if (attachment.externalId) {
        return selectEmailByExternalId(state, attachment.externalId);
      }
    }
    return null;
  });

  // Determine attachment details based on type
  const attachmentDetails = useMemo(() => {
    const baseDetails = {
      type: SystemReferenceTypeDisplay[attachment.type],
      icon: SystemReferenceTypeIcons[attachment.type] || "description",
      title: SystemReferenceTypeDisplay[attachment.type],
      subtitle: "",
      clickable: true,
    };

    switch (attachment.type) {
      case SystemReferenceType.EMAIL:
        // Use email data from store if available, otherwise fall back to meta
        if (emailFromStore) {
          const fromEmail =
            emailFromStore.from.meta?.email || emailFromStore.from.externalId;
          const fromName = emailFromStore.from.meta?.name;
          const fromDisplay = fromName
            ? `${fromName} <${fromEmail}>`
            : fromEmail;

          return {
            ...baseDetails,
            title: emailFromStore.subject || "Email",
            subtitle: `From: ${fromDisplay}`,
          };
        } else {
          return {
            ...baseDetails,
            title: attachment.meta?.title || "Email",
            subtitle: attachment.meta?.email
              ? `From: ${attachment.meta.email}`
              : "",
          };
        }

      case SystemReferenceType.USER_TASK:
        return {
          ...baseDetails,
          title: attachment.meta?.title || "Task",
          subtitle: attachment.meta?.description
            ? attachment.meta.description.substring(0, 50) + "..."
            : "",
        };

      case SystemReferenceType.TODO:
        return {
          ...baseDetails,
          title: attachment.meta?.title || "Todo",
          subtitle: attachment.meta?.description
            ? attachment.meta.description.substring(0, 50) + "..."
            : "",
        };

      case SystemReferenceType.CONTACT:
        return {
          ...baseDetails,
          title: attachment.meta?.name || "Contact",
          subtitle:
            attachment.meta?.email || attachment.meta?.description || "",
        };

      case SystemReferenceType.DOCUMENT:
        return {
          ...baseDetails,
          title: attachment.meta?.name || "Document",
          subtitle: attachment.meta?.type || "Document",
        };

      case SystemReferenceType.VIDEO:
        return {
          ...baseDetails,
          title: attachment.meta?.title || "Video",
          subtitle: attachment.meta?.duration || "Video content",
        };

      case SystemReferenceType.PROFILE:
        return {
          ...baseDetails,
          title: attachment.meta?.name || "Profile",
          subtitle: attachment.meta?.email || "",
        };

      case SystemReferenceType.SYSTEM:
        return {
          ...baseDetails,
          title: attachment.meta?.title || "System",
          subtitle: attachment.meta?.description || "",
        };

      default:
        return baseDetails;
    }
  }, [attachment, emailFromStore]);

  const handlePress = () => {
    if (attachmentDetails.clickable && onPress) {
      onPress(attachment);
    } else {
      // Default behavior - show alert with attachment info
      Alert.alert(
        attachmentDetails.type,
        attachmentDetails.title +
          (attachmentDetails.subtitle ? `\n${attachmentDetails.subtitle}` : "")
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      disabled={!attachmentDetails.clickable}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons
          name={attachmentDetails.icon as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {attachmentDetails.title}
        </Text>
        {attachmentDetails.subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {attachmentDetails.subtitle}
          </Text>
        )}
      </View>
      {attachmentDetails.clickable && (
        <MaterialIcons
          name="chevron-right"
          size={16}
          color={colors.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      padding: 8,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: 4,
      maxWidth: 280,
      minWidth: 200,
    },
    iconContainer: {
      width: 32,
      height: 32,
      borderRadius: 4,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 8,
    },
    contentContainer: {
      flex: 1,
      marginRight: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      lineHeight: 16,
    },
    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 14,
      marginTop: 2,
    },
  });
