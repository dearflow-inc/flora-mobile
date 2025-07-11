import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
import { deleteToolExecutionAsync } from "@/store/slices/toolExecutionSlice";
import { ToolExecution } from "@/types/toolExecution";
import { parseEmailDraftFromToolExecution } from "@/types/toolExecution";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface EmailDraftItemProps {
  toolExecution: ToolExecution;
  onPress: (toolExecution: ToolExecution) => void;
}

export const EmailDraftItem: React.FC<EmailDraftItemProps> = ({
  toolExecution,
  onPress,
}) => {
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const styles = createStyles(colors);

  // Animation refs
  const translateX = useRef(new Animated.Value(0));
  const opacity = useRef(new Animated.Value(1));
  const leftBackgroundOpacity = useRef(new Animated.Value(0));
  const rightBackgroundOpacity = useRef(new Animated.Value(0));

  // Parse email draft data from tool execution
  const emailData = parseEmailDraftFromToolExecution(toolExecution);

  // Get recipients for display
  const getRecipientsText = () => {
    const allRecipients = [...emailData.to, ...emailData.cc, ...emailData.bcc];

    if (allRecipients.length === 0) {
      return "No recipients";
    }

    const recipientEmails = allRecipients.map((r) => r.email);
    if (recipientEmails.length === 1) {
      return recipientEmails[0];
    }

    return `${recipientEmails[0]} +${recipientEmails.length - 1} more`;
  };

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

  const handleDelete = async () => {
    try {
      await dispatch(deleteToolExecutionAsync(toolExecution.id)).unwrap();
    } catch (error) {
      console.error(error);
    }
  };

  const onGestureEvent = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateX.current.setValue(translationX);

      // Show delete background for both left and right swipes
      const progress = Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1);
      leftBackgroundOpacity.current.setValue(progress * 0.8);
      rightBackgroundOpacity.current.setValue(progress * 0.8);
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.END || state === State.CANCELLED) {
      if (Math.abs(translationX) > SWIPE_THRESHOLD) {
        console.log("Deleting tool execution", toolExecution.id);
        // Swipe threshold reached, delete the draft
        Animated.parallel([
          Animated.timing(translateX.current, {
            toValue: translationX > 0 ? screenWidth : -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity.current, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // Use setTimeout to defer the delete operation to avoid the warning
          setTimeout(() => {
            handleDelete();
          }, 0);
        });
      } else {
        // Reset position
        Animated.spring(translateX.current, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        leftBackgroundOpacity.current.setValue(0);
        rightBackgroundOpacity.current.setValue(0);
      }
    }
  };

  return (
    <View style={styles.draftItemContainer}>
      {/* Delete background for left swipe */}
      <Animated.View
        style={[
          styles.swipeBackground,
          styles.leftSwipeBackground,
          {
            opacity: leftBackgroundOpacity.current,
            backgroundColor: colors.danger,
          },
        ]}
      >
        <View style={styles.swipeIndicatorCenter}>
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.swipeText}>Delete</Text>
        </View>
      </Animated.View>

      {/* Delete background for right swipe */}
      <Animated.View
        style={[
          styles.swipeBackground,
          styles.rightSwipeBackground,
          {
            opacity: rightBackgroundOpacity.current,
            backgroundColor: colors.danger,
          },
        ]}
      >
        <View style={styles.swipeIndicatorCenter}>
          <MaterialIcons name="delete" size={24} color="white" />
          <Text style={styles.swipeText}>Delete</Text>
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
            styles.draftItem,
            {
              transform: [{ translateX: translateX.current }],
              opacity: opacity.current,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.draftTouchable}
            onPress={() => onPress(toolExecution)}
            activeOpacity={0.7}
          >
            <View style={styles.draftContent}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <MaterialIcons name="drafts" size={24} color={colors.primary} />
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                {/* Subject */}
                <Text style={styles.subject} numberOfLines={1}>
                  {emailData.subject || "No subject"}
                </Text>

                {/* Recipients */}
                <Text style={styles.recipients} numberOfLines={1}>
                  To: {getRecipientsText()}
                </Text>

                {/* Preview */}
                {emailData.body && (
                  <Text style={styles.preview} numberOfLines={2}>
                    {emailData.body.replace(/<[^>]*>/g, "")}
                  </Text>
                )}
              </View>

              {/* Timestamp */}
              <View style={styles.timestampContainer}>
                <Text style={styles.timestamp}>
                  {formatTimestamp(toolExecution.createdAt)}
                </Text>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color={colors.textSecondary}
                />
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
    draftItemContainer: {
      position: "relative",
      overflow: "hidden",
    },
    draftItem: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    draftTouchable: {
      flex: 1,
    },
    draftContent: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    iconContainer: {
      marginRight: 12,
      marginTop: 2,
    },
    contentContainer: {
      flex: 1,
      marginRight: 12,
    },
    subject: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    recipients: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    preview: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    timestampContainer: {
      alignItems: "flex-end",
      justifyContent: "space-between",
      minHeight: 40,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    swipeBackground: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: "100%",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
    },
    leftSwipeBackground: {
      left: 0,
    },
    rightSwipeBackground: {
      right: 0,
    },
    swipeIndicatorCenter: {
      alignItems: "center",
      justifyContent: "center",
    },
    swipeText: {
      color: "white",
      fontSize: 14,
      fontWeight: "600",
      marginTop: 4,
    },
  });
