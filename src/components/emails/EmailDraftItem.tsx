import { useTheme } from "@/hooks/useTheme";
import { AppDispatch, RootState } from "@/store";
import {
  deleteToolExecutionAsync,
  removeToolExecutionFromList,
} from "@/store/slices/toolExecutionSlice";
import {
  ToolExecution,
  parseEmailDraftFromToolExecution,
} from "@/types/toolExecution";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { useDispatch, useSelector } from "react-redux";

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
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const backgroundOpacity = useRef(new Animated.Value(0)).current;

  // Get drafts from store to detect when this draft is removed
  const drafts = useSelector((state: RootState) => state.toolExecutions.drafts);
  const isDraftInStore = drafts.some((draft) => draft.id === toolExecution.id);

  const styles = createStyles(colors);
  const emailData = parseEmailDraftFromToolExecution(toolExecution);

  const getRecipientsText = () => {
    const allRecipients = [...emailData.to, ...emailData.cc, ...emailData.bcc];
    if (allRecipients.length === 0) return "No recipients";

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
      // Optimistically remove the draft from the store immediately
      dispatch(removeToolExecutionFromList(toolExecution.id));

      // Then make the API call in the background
      await dispatch(deleteToolExecutionAsync(toolExecution.id)).unwrap();
    } catch (error) {
      // If the API call fails, we could restore the draft here
      // For now, just show an error alert
      Alert.alert("Error", "Failed to delete draft. Please try again.");
    }
  };

  const onGestureEvent = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.ACTIVE) {
      translateX.setValue(translationX);
      // Show delete background when swiping
      const progress = Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1);
      backgroundOpacity.setValue(progress * 0.8);
    }
  };

  const onHandlerStateChange = (event: any) => {
    const { translationX, state } = event.nativeEvent;

    if (state === State.END || state === State.CANCELLED) {
      if (Math.abs(translationX) > SWIPE_THRESHOLD) {
        console.log("Deleting tool execution", toolExecution.id);
        // Swipe threshold reached, delete the draft
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: translationX > 0 ? screenWidth : -screenWidth,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
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
        // Snap back to original position
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(backgroundOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  // Don't render if the draft is no longer in the store
  if (!isDraftInStore) {
    return null;
  }

  return (
    <View style={styles.draftItemContainer}>
      {/* Delete background shown when swiping */}
      <Animated.View
        style={[
          styles.swipeBackground,
          {
            opacity: backgroundOpacity,
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
          styles.draftItem,
          {
            transform: [{ translateX }],
            opacity,
          },
        ]}
      >
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          shouldCancelWhenOutside={false}
          activeOffsetX={[-5, 5]}
          failOffsetY={[-20, 20]}
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
        </PanGestureHandler>
      </Animated.View>
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
      position: "relative",
      zIndex: 2,
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
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1,
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
  });
