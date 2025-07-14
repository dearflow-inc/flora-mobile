import { CustomAvatar } from "@/components/ui/CustomAvatar";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  fetchEmailsByIdsAsync,
  selectEmailById,
} from "@/store/slices/emailSlice";
import {
  deleteUserTaskActionAsync,
  updateUserTaskActionDataAsync,
} from "@/store/slices/userTaskSlice";
import { UserTask, UserTaskAction, UserTaskType } from "@/types/userTask";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;

interface EmailCleanUpActionProps {
  action: UserTaskAction;
  userTask: UserTask;
}

interface EmailItem {
  emailId: string;
  isImportant: boolean;
}

export const EmailCleanUpAction: React.FC<EmailCleanUpActionProps> = ({
  action,
  userTask,
}) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const styles = createStyles(colors);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize emails state from action data
  const [emails, setEmails] = useState<EmailItem[]>(() => {
    if (action.data?.emailIds) {
      return action.data.emailIds
        .filter((email: any) => email.actions?.length === 0)
        .map((item: any) => ({
          emailId: item.emailId,
          isImportant: item.isImportant || false,
        }));
    }
    return [];
  });

  // Fetch all emails by IDs when component mounts
  useEffect(() => {
    if (action.data?.emailIds && action.data.emailIds.length > 0) {
      const emailIdsToFetch = action.data.emailIds
        .filter((email: any) => email.actions?.length === 0)
        .map((item: any) => item.emailId);

      if (emailIdsToFetch.length > 0) {
        dispatch(fetchEmailsByIdsAsync(emailIdsToFetch));
      }
    }
  }, [action.data?.emailIds, dispatch]);

  const handleMarkImportant = (emailId: string) => {
    const updatedEmails = emails.map((email) =>
      email.emailId === emailId ? { ...email, isImportant: true } : email
    );
    setEmails(updatedEmails);
    updateTimeoutRef.current = setTimeout(() => {
      dispatch(
        updateUserTaskActionDataAsync({
          userTaskId: userTask.id,
          request: {
            actionId: action.id,
            actionData: {
              actions: [
                {
                  emailId: emailId,
                  decision: "create-user-task",
                  userTask: UserTaskType.EMAIL_READ,
                },
              ],
            },
          },
        })
      );
    }, 300);
  };

  const handleDelete = () => {
    Alert.alert(
      "Remove Action",
      "Are you sure you want to remove this email cleanup action?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await dispatch(
                deleteUserTaskActionAsync({
                  userTaskId: userTask.id,
                  actionId: action.id,
                })
              ).unwrap();
              // Success - the action will be removed from the UI automatically
              // when the Redux store updates
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to remove action. Please try again.",
                [{ text: "OK" }]
              );
            }
          },
        },
      ]
    );
  };

  const EmailItemComponent = ({ item }: { item: EmailItem }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;
    const backgroundOpacity = useRef(new Animated.Value(0)).current;
    const email = useAppSelector((state) =>
      selectEmailById(state, item.emailId)
    );

    const onGestureEvent = (event: any) => {
      const { translationX, state, velocityX } = event.nativeEvent;

      if (state === State.ACTIVE) {
        translateX.setValue(translationX);
        // Show green background when swiping
        const progress = Math.min(Math.abs(translationX) / SWIPE_THRESHOLD, 1);
        backgroundOpacity.setValue(progress * 0.8);
      }
    };

    const onHandlerStateChange = (event: any) => {
      const { translationX, state, velocityX } = event.nativeEvent;

      if (state === State.END) {
        if (
          Math.abs(translationX) > SWIPE_THRESHOLD ||
          Math.abs(velocityX) > 800
        ) {
          // Both left and right swipes mark as important
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: translationX < 0 ? -screenWidth : screenWidth,
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
            handleMarkImportant(item.emailId);
            // Reset animation values for next render
            translateX.setValue(0);
            opacity.setValue(1);
            backgroundOpacity.setValue(0);
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

    const getEmailDisplayInfo = () => {
      if (email) {
        return {
          subject: email.subject || "No subject",
          from:
            email.from?.meta?.name ||
            email.from?.meta?.email ||
            "Unknown sender",
        };
      }
      return {
        subject: `Email ID: ${item.emailId}`,
        from: "Loading...",
      };
    };

    const { subject, from } = getEmailDisplayInfo();

    return (
      <View style={styles.emailItemContainer}>
        {/* Green background shown when swiping */}
        <Animated.View
          style={[
            styles.swipeBackground,
            {
              opacity: backgroundOpacity,
              backgroundColor: colors.success,
            },
          ]}
        >
          <View style={styles.swipeIndicatorCenter}>
            <MaterialIcons name="star" size={24} color="white" />
            <Text style={styles.swipeText}>Keep</Text>
          </View>
        </Animated.View>

        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
        >
          <Animated.View
            style={[
              styles.emailItem,
              { transform: [{ translateX }], opacity },
              item.isImportant && styles.emailItemImportant,
            ]}
          >
            <View style={styles.emailItemContent}>
              <CustomAvatar
                alt={
                  email?.isOutgoing
                    ? "You"
                    : email?.from.meta?.name ||
                      email?.from.meta?.email ||
                      "Unknown sender"
                }
                size={32}
              />
              <View style={styles.emailItemText}>
                <Text style={styles.emailSubject} numberOfLines={1}>
                  {subject}
                </Text>
                <Text style={styles.emailFrom} numberOfLines={1}>
                  From: {from}
                </Text>
              </View>
            </View>
          </Animated.View>
        </PanGestureHandler>
      </View>
    );
  };

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialIcons
            name="star"
            size={20}
            color={colors.warning}
            style={{ marginTop: 8 }}
          />
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Delete Emails</Text>
            <Text style={styles.instructionsTitle}>
              Swipe left or right to keep email
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          data={emails.filter((email) => !email.isImportant)}
          keyExtractor={(item) => item.emailId}
          renderItem={({ item }) => <EmailItemComponent item={item} />}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.emailList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons
                name="inbox"
                size={48}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyStateText}>No emails to review</Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 12,
    },
    headerTitleContainer: {
      display: "flex",
      flexDirection: "column",
      marginLeft: 8,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    deleteButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    instructionsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 16,
    },
    emailList: {
      paddingBottom: 16,
    },
    emailItemContainer: {
      position: "relative",
      marginBottom: 8,
      borderRadius: 6,
      overflow: "hidden",
    },
    swipeBackground: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 6,
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
    emailItem: {
      position: "relative",
      borderRadius: 6,
      zIndex: 2,
    },
    emailItemImportant: {
      backgroundColor: colors.warning + "10",
      borderColor: colors.warning + "30",
      borderWidth: 1,
    },
    emailItemContent: {
      flexDirection: "row",
      alignItems: "center",
      columnGap: 8,
      padding: 12,
      paddingLeft: 8,
      backgroundColor: colors.surface,
      borderRadius: 6,
    },
    emailItemText: {
      flex: 1,
      marginTop: 8,
    },
    emailSubject: {
      fontSize: 13,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 2,
    },
    emailFrom: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    emailStatus: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: "center",
      padding: 32,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
      textAlign: "center",
    },
  });
