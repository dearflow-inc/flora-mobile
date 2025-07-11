import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { CustomAvatar } from "@/components/ui/CustomAvatar";
import { EmailWithoutContent } from "@/types/email";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface EmailItemProps {
  email: EmailWithoutContent;
  swipeAnimation: Animated.Value;
  onSwipeEvent: (
    emailId: string,
    translationX: number,
    velocityX: number,
    state: State
  ) => void;
  onPress: (email: EmailWithoutContent) => void;
  onDelete?: (emailId: string) => void;
  onArchive?: (emailId: string) => void;
}

export const EmailItem: React.FC<EmailItemProps> = ({
  email,
  swipeAnimation,
  onSwipeEvent,
  onPress,
  onDelete,
  onArchive,
}) => {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const leftBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const rightBackgroundOpacity = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffInHours =
      (now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return new Date(date).toLocaleDateString();
    }
  };

  const getSenderInfo = () => {
    if (email.isOutgoing) {
      return {
        name: "You",
        email: "you@example.com",
        isOutgoing: true,
      };
    }
    return {
      name: email.from.meta?.name || email.from.meta?.email || "Unknown",
      email: email.from.meta?.email || "unknown@example.com",
      isOutgoing: false,
    };
  };

  const getRecipientsText = () => {
    if (email.isOutgoing) {
      const allRecipients = [...email.to, ...email.cc, ...email.bcc];
      if (allRecipients.length === 0) return "No recipients";

      const recipientEmails = allRecipients.map(
        (r) => r.meta?.email || r.meta?.name || "Unknown"
      );
      if (recipientEmails.length === 1) {
        return recipientEmails[0];
      }
      return `${recipientEmails[0]} +${recipientEmails.length - 1} more`;
    }
    return "";
  };

  const onGestureEvent = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateX.setValue(translationX);

      // Show different backgrounds based on swipe direction
      if (translationX < 0) {
        // Left swipe - show delete background
        const progress = Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1);
        leftBackgroundOpacity.setValue(progress * 0.8);
        rightBackgroundOpacity.setValue(0);
      } else if (translationX > 0) {
        // Right swipe - show archive background
        const progress = Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1);
        rightBackgroundOpacity.setValue(progress * 0.8);
        leftBackgroundOpacity.setValue(0);
      } else {
        leftBackgroundOpacity.setValue(0);
        rightBackgroundOpacity.setValue(0);
      }
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { translationX, state, velocityX } = event.nativeEvent;

    if (state === State.END) {
      if (
        Math.abs(translationX) > SWIPE_THRESHOLD ||
        Math.abs(velocityX) > 800
      ) {
        if (translationX < 0 && onDelete) {
          // Left swipe - delete
          onDelete(email.id);
        } else if (translationX > 0 && onArchive) {
          // Right swipe - archive
          onArchive(email.id);
        }
      }

      // Reset animations
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(leftBackgroundOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rightBackgroundOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    onSwipeEvent(email.id, translationX, velocityX, state);
  };

  const senderInfo = getSenderInfo();

  return (
    <View style={styles.emailContainer}>
      {/* Swipe backgrounds */}
      <Animated.View
        style={[
          styles.swipeBackground,
          styles.leftBackground,
          {
            opacity: leftBackgroundOpacity,
            backgroundColor: colors.danger,
          },
        ]}
      >
        <View style={styles.swipeIndicatorCenter}>
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.swipeText}>Delete</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.swipeBackground,
          styles.rightBackground,
          {
            opacity: rightBackgroundOpacity,
            backgroundColor: colors.success,
          },
        ]}
      >
        <View style={styles.swipeIndicatorCenter}>
          <MaterialIcons name="archive" size={24} color="white" />
          <Text style={styles.swipeText}>Archive</Text>
        </View>
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        shouldCancelWhenOutside={true}
        activeOffsetX={[-10, 10]}
        failOffsetY={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.emailItem,
            {
              transform: [{ translateX }],
              opacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.emailTouchable}
            onPress={() => onPress(email)}
            activeOpacity={0.7}
          >
            <View style={styles.gmailLayout}>
              {/* Avatar Column */}
              <View style={styles.avatarColumn}>
                <CustomAvatar
                  src={
                    email.isOutgoing
                      ? undefined
                      : require("../../../assets/images/flora.png")
                  }
                  alt={email.isOutgoing ? "You" : senderInfo.name}
                  size={40}
                />
              </View>

              {/* Content Column */}
              <View style={styles.contentColumn}>
                <View style={styles.nameRow}>
                  <Text style={styles.sender} numberOfLines={1}>
                    {email.isOutgoing ? "You" : senderInfo.name}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatTimestamp(email.sent)}
                  </Text>
                </View>

                <Text style={styles.subject} numberOfLines={1}>
                  {email.subject || "No subject"}
                </Text>

                {email.isOutgoing && (
                  <Text style={styles.recipients} numberOfLines={1}>
                    To: {getRecipientsText()}
                  </Text>
                )}

                {email.previewText && (
                  <Text style={styles.preview} numberOfLines={2}>
                    {email.previewText}
                  </Text>
                )}

                {email.isOutgoing && (
                  <View style={styles.outgoingIndicator}>
                    <MaterialIcons
                      name="send"
                      size={14}
                      color={colors.primary}
                    />
                    <Text style={styles.outgoingText}>Sent</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    emailContainer: {
      position: "relative",
      overflow: "hidden",
    },
    swipeBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    leftBackground: {
      justifyContent: "center",
      alignItems: "flex-start",
      paddingLeft: 20,
    },
    rightBackground: {
      justifyContent: "center",
      alignItems: "flex-end",
      paddingRight: 20,
    },
    swipeIndicatorCenter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    swipeText: {
      fontSize: 16,
      fontWeight: "600",
      color: "white",
    },
    emailItem: {
      backgroundColor: colors.surface,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: "relative",
      zIndex: 2,
    },
    emailTouchable: {
      flex: 1,
    },
    gmailLayout: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 0,
      paddingVertical: 0,
    },
    avatarColumn: {
      width: 48,
      alignItems: "center",
      paddingTop: 2,
    },
    contentColumn: {
      flex: 1,
      marginLeft: 8,
    },
    nameRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    sender: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      flex: 1,
    },
    timestamp: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    subject: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 4,
    },
    recipients: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    preview: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    outgoingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 4,
      gap: 4,
    },
    outgoingText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "500",
    },
  });
