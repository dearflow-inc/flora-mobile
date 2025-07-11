import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Dimensions,
  Alert,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { CustomAvatar } from "@/components/ui/CustomAvatar";
import { UserTask } from "@/types/userTask";
import { EmailWithoutContent, EmailLabel } from "@/types/email";
import {
  getEmailSenderInfo,
  getTaskActions,
  formatTimestamp,
  getEmailFromContext,
} from "@/utils/taskUtils";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface UserTaskItemProps {
  task: UserTask;
  emails: EmailWithoutContent[];
  onPress: (task: UserTask) => void;
  onDelete?: (taskId: string) => void;
  onArchive?: (taskId: string) => void;
}

export const UserTaskItem: React.FC<UserTaskItemProps> = ({
  task,
  emails,
  onPress,
  onDelete,
  onArchive,
}) => {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const leftBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const rightBackgroundOpacity = useRef(new Animated.Value(0)).current;

  const styles = createStyles(colors);
  const senderInfo = getEmailSenderInfo(task, emails);

  // Check if the associated email is read or doesn't have UNREAD label
  const relatedEmail = getEmailFromContext(task, emails);
  const isRead =
    relatedEmail?.status?.internalRead === true ||
    !relatedEmail?.externalLabels?.includes(EmailLabel.UNREAD);

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
        // Swipe threshold reached
        if (translationX < 0 && onDelete) {
          // Left swipe - delete
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -screenWidth,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onDelete(task.id);
          });
        } else if (translationX > 0 && onArchive) {
          // Right swipe - archive
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: screenWidth,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onArchive(task.id);
          });
        } else {
          // No action handler provided, snap back
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
      } else {
        // Snap back to original position
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
    }
  };

  return (
    <View style={styles.taskContainer}>
      {/* Left background (delete) */}
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

      {/* Right background (archive) */}
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
        shouldCancelWhenOutside={false}
        activeOffsetX={[-5, 5]}
        failOffsetY={[-20, 20]}
      >
        <Animated.View
          style={[
            styles.emailItem,
            styles.taskItem,
            {
              transform: [{ translateX }],
              opacity,
              borderLeftColor: isRead ? colors.primary + "40" : colors.primary,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.taskTouchable}
            onPress={() => onPress(task)}
            activeOpacity={0.7}
          >
            <View style={styles.gmailLayout}>
              {/* Avatar Column */}
              <View style={styles.avatarColumn}>
                <CustomAvatar
                  src={
                    senderInfo.isFromEmail
                      ? undefined
                      : require("../../../assets/images/flora.png")
                  }
                  alt={senderInfo.isFromEmail ? senderInfo.name : "Flora"}
                  size={40}
                />
              </View>

              {/* Content Column */}
              <View style={styles.contentColumn}>
                {/* Name and Date Row */}
                <View style={styles.nameRow}>
                  <Text
                    style={[
                      styles.sender,
                      styles.taskSender,
                      isRead && styles.taskSenderRead,
                    ]}
                  >
                    {senderInfo.isFromEmail ? senderInfo.name : "Flora"}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatTimestamp(task.createdAt)}
                  </Text>
                </View>

                {/* Task Title */}
                <Text style={styles.subject} numberOfLines={2}>
                  {task.title}
                </Text>

                {/* Task Description */}
                {task.description && (
                  <Text style={styles.preview} numberOfLines={2}>
                    {task.description}
                  </Text>
                )}

                {/* Task Actions */}
                <View style={styles.taskActions}>
                  {getTaskActions(task).map((action, index) => (
                    <View key={index} style={styles.actionChip}>
                      <Text style={styles.actionText}>{action}</Text>
                    </View>
                  ))}
                </View>
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
    taskContainer: {
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
      alignItems: "flex-end",
      paddingRight: 20,
    },
    rightBackground: {
      justifyContent: "center",
      alignItems: "flex-start",
      paddingLeft: 20,
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
    taskItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    taskTouchable: {
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
    taskSender: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
    },
    taskSenderRead: {
      fontWeight: "400",
      color: colors.textSecondary,
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
    preview: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    taskActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    actionChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "10",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    actionText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "500",
    },
  });
