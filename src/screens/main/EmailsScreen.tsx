import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Animated,
  Dimensions,
  Image,
  Alert,
} from "react-native";
import { PanGestureHandler, State } from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { CustomAvatar } from "@/components/ui/CustomAvatar";
import {
  selectEmailDrafts,
  createToolExecutionAsync,
} from "@/store/slices/toolExecutionSlice";
import { fetchMyEmailsAsync } from "@/store/slices/emailSlice";
import {
  fetchUserTasksAsync,
  selectUserTasks,
  selectUserTasksLoading,
  selectUserTasksError,
} from "@/store/slices/userTaskSlice";
import {
  fetchMyScenarios,
  selectContextViews,
  selectScenariosLoading,
} from "@/store/slices/scenariosSlice";
import { useNavigation } from "@react-navigation/native";
import { Email, EmailWithoutContent, EmailLabel } from "@/types/email";
import {
  parseEmailDraftFromToolExecution,
  ToolEndpointAction,
  ParameterType,
} from "@/types/toolExecution";
import { UserTask, UserTaskStatus, UserTaskType } from "@/types/userTask";

const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = screenWidth * 0.75;

type UserTaskFilter = "inbox" | "archived" | "sent" | "snoozed" | "trash";

const MOTIVATIONAL_MESSAGES = [
  "Sing like nobody is listening",
  "Try origami",
  "Dance in the rain",
  "Write a letter to your future self",
  "Learn a new word today",
  "Call someone you haven't talked to in a while",
  "Take a photo of something beautiful",
  "Practice gratitude",
  "Try a new recipe",
  "Watch the sunset",
  "Plant something",
  "Read a poem",
  "Learn to juggle",
  "Create something with your hands",
  "Listen to a new genre of music",
  "Write down three things that made you smile today",
  "Try drawing with your non-dominant hand",
  "Go for a walk without your phone",
  "Learn to say 'hello' in a new language",
  "Practice mindful breathing for 5 minutes",
  "Compliment a stranger",
  "Try to solve a puzzle",
  "Watch clouds and find shapes",
  "Write a haiku about your day",
];

export const EmailsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<UserTaskFilter>("inbox");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedContextViewId, setSelectedContextViewId] = useState<
    string | null
  >(null);
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  const { emails, isLoading: emailsLoading } = useSelector(
    (state: RootState) => state.emails
  );
  const drafts = useSelector(selectEmailDrafts);

  // User tasks from Redux store
  const userTasks = useSelector(selectUserTasks);
  const isLoading = useSelector(selectUserTasksLoading);
  const userTasksError = useSelector(selectUserTasksError);

  // Scenarios from Redux store
  const contextViews = useSelector(selectContextViews);
  const scenariosLoading = useSelector(selectScenariosLoading);

  const styles = createStyles(colors);
  const sidebarTranslateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    dispatch(fetchUserTasksAsync({}));
    dispatch(fetchMyEmailsAsync()); // Still need emails for email context tasks
    dispatch(fetchMyScenarios());
  }, [dispatch]);

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(sidebarTranslateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarTranslateX, {
      toValue: -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  const onPanGestureEvent = (event: any) => {
    const { translationX, velocityX, state, x } = event.nativeEvent;

    if (state === State.BEGAN) {
      // Only start gesture if it begins from the left edge (first 30px)
      if (x > 30) {
        return;
      }
    }

    if (state === State.ACTIVE) {
      // Only respond to rightward gestures from the left edge
      if (x <= 30 && translationX > 0) {
        // Update sidebar position in real-time
        const progress = Math.min(translationX / (SIDEBAR_WIDTH * 0.7), 1);
        const targetValue = -SIDEBAR_WIDTH + progress * SIDEBAR_WIDTH;
        sidebarTranslateX.setValue(targetValue);

        if (!sidebarVisible) {
          setSidebarVisible(true);
        }
      }
    } else if (state === State.END || state === State.CANCELLED) {
      // Determine whether to open or close based on gesture velocity and distance
      if (translationX > SIDEBAR_WIDTH * 0.3 || velocityX > 800) {
        // Open sidebar
        openSidebar();
      } else {
        // Close sidebar
        closeSidebar();
      }
    }
  };

  const getFilteredUserTasks = () => {
    let filteredTasks = userTasks;

    switch (activeFilter) {
      case "inbox":
        // Incomplete & Actionable
        filteredTasks = userTasks.filter(
          (task) =>
            task.status === UserTaskStatus.PENDING ||
            task.status === UserTaskStatus.FAILED
        );
        break;
      case "archived":
        // Archived & Completed
        filteredTasks = userTasks.filter(
          (task) =>
            task.status === UserTaskStatus.COMPLETED ||
            task.status === UserTaskStatus.COMPLETED_EXTERNAL
        );
        break;
      case "sent":
        // Sent tasks - this might need to be adjusted based on your backend logic
        filteredTasks = userTasks.filter(
          (task) => task.status === UserTaskStatus.COMPLETED_EXTERNAL
        );
        break;
      case "snoozed":
        // Snoozed tasks
        filteredTasks = userTasks.filter(
          (task) => task.status === UserTaskStatus.SNOOZE
        );
        break;
      case "trash":
        // Trash tasks
        filteredTasks = userTasks.filter(
          (task) => task.status === UserTaskStatus.DELETED
        );
        break;
      default:
        break;
    }

    // Apply context view filter
    if (selectedContextViewId) {
      filteredTasks = filteredTasks.filter(
        (task) => task.contextViewId === selectedContextViewId
      );
    } else {
      // When showing "All" tasks, filter out EMAIL_CLEAN_UP tasks
      filteredTasks = filteredTasks.filter(
        (task) => task.type !== UserTaskType.EMAIL_CLEAN_UP
      );
    }

    // Apply search filter
    if (searchQuery) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredTasks;
  };

  const getFilteredEmails = () => {
    let filteredEmails = emails;

    switch (activeFilter) {
      case "inbox":
        filteredEmails = emails.filter(
          (email) =>
            email.externalLabels.includes(EmailLabel.INBOX) &&
            !email.externalLabels.includes(EmailLabel.TRASH)
        );
        break;
      case "sent":
        filteredEmails = emails.filter((email) =>
          email.externalLabels.includes(EmailLabel.SENT)
        );
        break;
      case "trash":
        filteredEmails = emails.filter((email) =>
          email.externalLabels.includes(EmailLabel.TRASH)
        );
        break;
      default:
        filteredEmails = [];
        break;
    }

    // Apply search filter
    if (searchQuery) {
      filteredEmails = filteredEmails.filter(
        (email) =>
          email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          email.from.meta?.name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    return filteredEmails;
  };

  const getFilteredDrafts = () => {
    let filteredDrafts = drafts;

    // Apply search filter to drafts
    if (searchQuery) {
      filteredDrafts = drafts.filter((draft) => {
        const emailData = parseEmailDraftFromToolExecution(draft);
        if (emailData) {
          const subjectMatch =
            emailData.subject &&
            emailData.subject.toLowerCase().includes(searchQuery.toLowerCase());
          const toMatch =
            emailData.to &&
            Array.isArray(emailData.to) &&
            emailData.to.some(
              (recipient: any) =>
                typeof recipient === "string" &&
                recipient.toLowerCase().includes(searchQuery.toLowerCase())
            );
          return subjectMatch || toMatch;
        }
        return false;
      });
    }

    return filteredDrafts;
  };

  const isEmailTask = (task: UserTask): boolean => {
    // Check if task type indicates it's email-related
    const emailTaskTypes = [
      UserTaskType.EMAIL_FOLLOW_UP,
      UserTaskType.EMAIL_REPLY,
      UserTaskType.EMAIL_SCHEDULER,
      UserTaskType.EMAIL_READ,
    ];

    if (emailTaskTypes.includes(task.type)) {
      return true;
    }

    // Also check context for email entities
    return task.context.some((ctx) => ctx.type === "email");
  };

  const getEmailFromContext = (
    task: UserTask
  ): EmailWithoutContent | undefined => {
    const emailContext = task.context.find((ctx) => ctx.type === "email");

    let emailId = emailContext?.emailId;

    if (task.type === UserTaskType.EMAIL_READ) {
      emailId =
        emailContext?.emailId ||
        task.actions.find((action) => action.type === UserTaskType.EMAIL_READ)
          ?.data.emailId;
    }

    if (emailId) {
      return emails.find((email) => email.id === emailId);
    }

    return undefined;
  };

  const getEmailSenderInfo = (task: UserTask) => {
    // First try to get email from context
    const relatedEmail = getEmailFromContext(task);
    if (relatedEmail) {
      return {
        name:
          relatedEmail.from.meta?.name ||
          relatedEmail.from.meta?.email ||
          "Unknown",
        isFromEmail: true,
      };
    }

    // If no email found but it's an email task, try to extract from task data
    if (isEmailTask(task)) {
      // Check if task title or description contains email-like info
      const emailMatch = task.description.match(/from[:\s]+([^,\n]+)/i);
      if (emailMatch) {
        return {
          name: emailMatch[1].trim(),
          isFromEmail: true,
        };
      }
      return {
        name: "Email Contact",
        isFromEmail: true,
      };
    }

    return {
      name: "Flora",
      isFromEmail: false,
    };
  };

  const handleCreateEmail = async () => {
    try {
      // Create a new tool execution for email composition
      const toolExecution = await dispatch(
        createToolExecutionAsync({
          toolEndpointAction: ToolEndpointAction.GMAIL_SEND,
          input: [
            {
              parameterId: "to",
              type: ParameterType.ARRAY,
              value: "[]",
            },
            {
              parameterId: "subject",
              type: ParameterType.STRING,
              value: "",
            },
            {
              parameterId: "body",
              type: ParameterType.ARRAY,
              value: "[]",
            },
          ],
          internalListeners: [],
        })
      ).unwrap();

      // Navigate to the tool execution screen
      navigation.navigate("ToolExecution", {
        toolExecutionId: toolExecution.id,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create email draft. Please try again.");
    }
  };

  const handleTaskPress = (task: UserTask) => {
    navigation.navigate("UserTaskDetail", { userTaskId: task.id });
  };

  const handleEmailPress = (email: EmailWithoutContent) => {
    // TODO: Navigate to email detail screen
    console.log("Email pressed:", email.id);
  };

  const handleDraftPress = (draftId: string) => {
    navigation.navigate("ToolExecution", { toolExecutionId: draftId });
  };

  const handleFilterSelect = (filter: UserTaskFilter) => {
    setActiveFilter(filter);
    closeSidebar();
  };

  const getStatusStyle = (status: UserTaskStatus) => {
    switch (status) {
      case UserTaskStatus.PENDING:
        return styles.statusPENDING;
      case UserTaskStatus.FAILED:
        return styles.statusFAILED;
      case UserTaskStatus.COMPLETED:
        return styles.statusCOMPLETED;
      case UserTaskStatus.COMPLETED_EXTERNAL:
        return styles.statusCOMPLETED_EXTERNAL;
      case UserTaskStatus.IGNORED:
        return styles.statusIGNORED;
      case UserTaskStatus.SNOOZE:
        return styles.statusSNOOZE;
      case UserTaskStatus.DELETED:
        return styles.statusDELETED;
      default:
        return styles.statusBadge;
    }
  };

  const getSpaceNameById = (contextViewId: string | undefined) => {
    if (!contextViewId) return "Unknown";
    const contextView = contextViews.find((cv) => cv.id === contextViewId);
    return contextView?.name || "Unknown";
  };

  // Color utility functions for readability
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const getContrastRatio = (color1: string, color2: string) => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 1;

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);
  };

  const adjustColorForReadability = (color: string, isDarkMode: boolean) => {
    const backgroundColor = isDarkMode ? colors.background : colors.surface;
    const contrastRatio = getContrastRatio(color, backgroundColor);

    // WCAG AA requires 4.5:1 contrast ratio for normal text
    if (contrastRatio >= 4.5) {
      return color;
    }

    const rgb = hexToRgb(color);
    if (!rgb) return colors.textSecondary;

    // If contrast is too low, adjust the color
    if (isDarkMode) {
      // In dark mode, lighten the color
      const factor = Math.min(2, 4.5 / contrastRatio);
      return `rgb(${Math.min(255, Math.round(rgb.r * factor))}, ${Math.min(
        255,
        Math.round(rgb.g * factor)
      )}, ${Math.min(255, Math.round(rgb.b * factor))})`;
    } else {
      // In light mode, darken the color
      const factor = Math.max(0.3, 1 / (4.5 / contrastRatio));
      return `rgb(${Math.round(rgb.r * factor)}, ${Math.round(
        rgb.g * factor
      )}, ${Math.round(rgb.b * factor)})`;
    }
  };

  const getSpaceColorById = (contextViewId: string | undefined) => {
    if (!contextViewId) return colors.textSecondary;
    const contextView = contextViews.find((cv) => cv.id === contextViewId);
    if (!contextView?.color) return colors.textSecondary;

    // Check if we're in dark mode (assuming dark mode has a dark background)
    const isDarkMode =
      colors.background === "#000000" ||
      colors.background === "#121212" ||
      colors.background.includes("1") ||
      colors.background.includes("2");

    return adjustColorForReadability(contextView.color, isDarkMode);
  };

  const getOriginalSpaceColorById = (contextViewId: string | undefined) => {
    if (!contextViewId) return colors.textSecondary;
    const contextView = contextViews.find((cv) => cv.id === contextViewId);
    return contextView?.color || colors.textSecondary;
  };

  const formatTimestamp = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const timeString = date.toLocaleTimeString([], timeOptions);

    // If it's today, show only time
    if (itemDate.getTime() === today.getTime()) {
      return timeString;
    }

    // If it's before today, show time then date
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    };

    const dateString_formatted = date.toLocaleDateString([], dateOptions);
    return `${timeString} • ${dateString_formatted}`;
  };

  const getTaskActions = (task: UserTask): string[] => {
    // Get actions from the task's actions array
    const actions =
      task.actions?.map((action) => {
        // Convert action type to readable format
        switch (action.type) {
          case UserTaskType.EMAIL_READ:
            return "Read";
          case UserTaskType.EMAIL_REPLY:
            return "Reply";
          case UserTaskType.EMAIL_FOLLOW_UP:
            return "Follow Up";
          case UserTaskType.EMAIL_SCHEDULER:
            return "Schedule";
          case UserTaskType.EMAIL_SEND:
            return "Send";
          case UserTaskType.EMAIL_CLEAN_UP:
            return "Clean Up";
          case UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE:
            return "Unsubscribe";
          default:
            // Remove underscores and capitalize
            return action.type
              .replace(/_/g, " ")
              .replace(/\b\w/g, (l) => l.toUpperCase());
        }
      }) || [];

    // If no actions are defined, default to "Read"
    return actions.length > 0 ? actions : ["Read"];
  };

  const renderUserTask = ({ item }: { item: UserTask }) => {
    const senderInfo = getEmailSenderInfo(item);

    return (
      <TouchableOpacity
        style={[styles.emailItem, styles.taskItem]}
        onPress={() => handleTaskPress(item)}
      >
        <View style={styles.gmailLayout}>
          {/* Avatar Column */}
          <View style={styles.avatarColumn}>
            <CustomAvatar
              src={senderInfo.isFromEmail ? undefined : undefined}
              alt={senderInfo.isFromEmail ? senderInfo.name : "Flora"}
              size={40}
            />
          </View>

          {/* Content Column */}
          <View style={styles.contentColumn}>
            {/* Name and Date Row */}
            <View style={styles.nameRow}>
              <Text style={[styles.sender, styles.taskSender]}>
                {senderInfo.name}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(item.createdAt)}
              </Text>
            </View>

            {/* Title */}
            <Text style={[styles.subject, styles.taskTitle]}>
              {item.title || item.description}
            </Text>

            {/* Description and Action Tags Row */}
            <View style={styles.descriptionRow}>
              {item.title && (
                <Text style={styles.preview} numberOfLines={1}>
                  {item.description}
                </Text>
              )}
              <View style={styles.actionChipsContainer}>
                {getTaskActions(item).map((action, index) => (
                  <View
                    key={index}
                    style={[
                      styles.actionChip,
                      {
                        backgroundColor: colors.primary + "15",
                        borderColor: colors.primary + "40",
                      },
                    ]}
                  >
                    <Text
                      style={[styles.actionChipText, { color: colors.primary }]}
                    >
                      {action}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmail = ({ item }: { item: EmailWithoutContent }) => (
    <TouchableOpacity
      style={[
        styles.emailItem,
        !item.status?.internalRead && styles.unreadEmail,
      ]}
      onPress={() => handleEmailPress(item)}
    >
      <View style={styles.gmailLayout}>
        {/* Avatar Column */}
        <View style={styles.avatarColumn}>
          <CustomAvatar
            src={item.from.meta?.avatar}
            alt={item.from.meta?.name || item.from.meta?.email || "Unknown"}
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
                !item.status?.internalRead && styles.unreadText,
              ]}
            >
              {item.from.meta?.name || item.from.meta?.email || "Unknown"}
            </Text>
            <View style={styles.rightSection}>
              <Text style={styles.timestamp}>{formatTimestamp(item.sent)}</Text>
              <TouchableOpacity onPress={() => {}}>
                <MaterialIcons
                  name={
                    item.externalLabels.includes(EmailLabel.STARRED)
                      ? "star"
                      : "star-border"
                  }
                  size={16}
                  color={
                    item.externalLabels.includes(EmailLabel.STARRED)
                      ? "#FFD700"
                      : "#CCCCCC"
                  }
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Title */}
          <Text
            style={[
              styles.subject,
              !item.status?.internalRead && styles.unreadText,
            ]}
          >
            {item.subject}
          </Text>

          {/* Description Row */}
          <View style={styles.descriptionRow}>
            <Text style={styles.preview} numberOfLines={1}>
              {item.previewText || "No preview available"}
            </Text>
          </View>
        </View>
      </View>
      {!item.status?.internalRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderDraft = ({ item }: { item: any }) => {
    const emailData = parseEmailDraftFromToolExecution(item);
    if (!emailData) return null;

    return (
      <TouchableOpacity
        style={[styles.emailItem, styles.draftItem]}
        onPress={() => handleDraftPress(item.id)}
      >
        <View style={styles.gmailLayout}>
          {/* Avatar Column */}
          <View style={styles.avatarColumn}>
            <CustomAvatar alt="Draft" size={40} />
          </View>

          {/* Content Column */}
          <View style={styles.contentColumn}>
            {/* Name and Date Row */}
            <View style={styles.nameRow}>
              <Text style={styles.sender}>
                Draft to:{" "}
                {Array.isArray(emailData.to)
                  ? emailData.to.join(", ")
                  : "Unknown"}
              </Text>
              <View style={styles.rightSection}>
                <Text style={styles.timestamp}>
                  {formatTimestamp(item.updatedAt)}
                </Text>
                <MaterialIcons
                  name="edit"
                  size={16}
                  color={colors.textSecondary}
                />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.subject}>
              {emailData.subject || "No subject"}
            </Text>

            {/* Description Row */}
            <View style={styles.descriptionRow}>
              <Text style={styles.preview} numberOfLines={1}>
                {emailData.body
                  ? emailData.body.substring(0, 100) + "..."
                  : "No content"}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const getFilterCount = (filter: UserTaskFilter) => {
    switch (filter) {
      case "inbox":
        return userTasks.filter(
          (task) =>
            task.status === UserTaskStatus.PENDING ||
            task.status === UserTaskStatus.FAILED
        ).length;
      case "archived":
        return userTasks.filter(
          (task) =>
            task.status === UserTaskStatus.COMPLETED ||
            task.status === UserTaskStatus.COMPLETED_EXTERNAL
        ).length;
      case "sent":
        return userTasks.filter(
          (task) => task.status === UserTaskStatus.COMPLETED_EXTERNAL
        ).length;
      case "snoozed":
        return userTasks.filter((task) => task.status === UserTaskStatus.SNOOZE)
          .length;
      case "trash":
        return userTasks.filter(
          (task) => task.status === UserTaskStatus.DELETED
        ).length;
      default:
        return 0;
    }
  };

  const getFilterTitle = (filter: UserTaskFilter) => {
    switch (filter) {
      case "inbox":
        return "Incomplete & Actionable";
      case "archived":
        return "Archived & Completed";
      case "sent":
        return "Sent";
      case "snoozed":
        return "Snoozed";
      case "trash":
        return "Trash";
      default:
        return "Inbox";
    }
  };

  const getFilterIcon = (filter: UserTaskFilter) => {
    switch (filter) {
      case "inbox":
        return "inbox";
      case "archived":
        return "archive";
      case "sent":
        return "send";
      case "snoozed":
        return "snooze";
      case "trash":
        return "delete";
      default:
        return "inbox";
    }
  };

  const filteredUserTasks = getFilteredUserTasks();
  const filteredEmails = getFilteredEmails();
  const filteredDrafts = getFilteredDrafts();

  const renderSidebar = () => (
    <Animated.View
      style={[
        styles.sidebar,
        {
          transform: [{ translateX: sidebarTranslateX }],
        },
      ]}
    >
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarLogoContainer}>
          <Image
            source={require("../../../assets/images/flora.png")}
            style={styles.sidebarLogo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.sidebarTitleContainer}>
          <Text style={styles.sidebarTitle}>All Tasks</Text>
          <TouchableOpacity onPress={closeSidebar}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sidebarContent}>
        {(
          ["inbox", "archived", "sent", "snoozed", "trash"] as UserTaskFilter[]
        ).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.sidebarItem,
              activeFilter === filter && styles.sidebarItemActive,
            ]}
            onPress={() => handleFilterSelect(filter)}
          >
            <MaterialIcons
              name={getFilterIcon(filter) as any}
              size={22}
              color={
                activeFilter === filter ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.sidebarItemText,
                activeFilter === filter && styles.sidebarItemTextActive,
              ]}
            >
              {getFilterTitle(filter)}
            </Text>
            <Text
              style={[
                styles.sidebarItemCount,
                activeFilter === filter && styles.sidebarItemCountActive,
              ]}
            >
              {getFilterCount(filter)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );

  const getRandomMotivationalMessage = () => {
    const randomIndex = Math.floor(
      Math.random() * MOTIVATIONAL_MESSAGES.length
    );
    return MOTIVATIONAL_MESSAGES[randomIndex];
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialIcons name="task-alt" size={80} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyStateTitle}>All caught up!</Text>
      <Text style={styles.emptyStateMotivationalMessage}>
        {getRandomMotivationalMessage()}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <PanGestureHandler onHandlerStateChange={onPanGestureEvent}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
              <MaterialIcons name="menu" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.searchBar}>
              <MaterialIcons
                name="search"
                size={20}
                color={colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <View style={styles.contextFilterContainer}>
            <FlatList
              data={[
                { id: null, name: "Important", color: colors.primary },
                ...(contextViews || [])
                  .sort((a, b) => b.importance - a.importance) // Sort by importance (highest first)
                  .map((cv) => ({
                    id: cv.id,
                    name: cv.name,
                    color: cv.color,
                  })),
              ]}
              renderItem={({ item }) => {
                const isSelected = selectedContextViewId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.contextChip,
                      isSelected
                        ? styles.contextChipSelected
                        : styles.contextChipUnselected,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surface,
                        borderColor: isSelected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedContextViewId(item.id)}
                  >
                    <Text
                      style={[
                        styles.contextChipText,
                        {
                          color: isSelected ? "#FFFFFF" : colors.text,
                        },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id || "all"}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contextChipsContainer}
            />
          </View>

          {filteredUserTasks.length === 0 && !isLoading && renderEmptyState()}

          {filteredUserTasks.length > 0 && (
            <FlatList
              data={filteredUserTasks}
              renderItem={renderUserTask}
              keyExtractor={(item) => item.id}
              style={styles.emailsList}
              contentContainerStyle={styles.emailsContainer}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading || scenariosLoading}
              onRefresh={() => {
                dispatch(fetchUserTasksAsync({}));
                dispatch(fetchMyScenarios());
              }}
            />
          )}
        </SafeAreaView>
      </PanGestureHandler>

      {sidebarVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={closeSidebar}
          activeOpacity={1}
        />
      )}

      {renderSidebar()}

      <TouchableOpacity
        style={styles.fab}
        onPress={handleCreateEmail}
        activeOpacity={0.7}
      >
        <MaterialIcons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.fabText}>Compose</Text>
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuButton: {
      padding: 8,
      marginRight: 12,
    },
    headerButton: {
      padding: 8,
      marginLeft: 12,
    },
    searchBar: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
    emailsList: {
      flex: 1,
    },
    emailsContainer: {
      paddingTop: 0,
    },
    emailItem: {
      backgroundColor: colors.surface,
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: "relative",
    },
    taskItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    unreadEmail: {
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    draftItem: {
      borderLeftWidth: 4,
      borderLeftColor: colors.warning || "#FFA500",
    },
    emailHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 6,
    },
    avatarSenderContainer: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    senderInfo: {
      marginLeft: 8,
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
    rightSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    descriptionRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 2,
    },
    emailInfo: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    taskHeaderLeft: {
      flex: 1,
    },
    floraTaskHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 2,
    },
    floraTaskIcon: {
      width: 20,
      height: 20,
      marginRight: 8,
      borderRadius: 4,
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
    taskType: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    timestamp: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    taskMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    importance: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    subject: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 3,
    },
    taskTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    preview: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 6,
    },
    taskFooter: {
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    statusText: {
      fontSize: 10,
      fontWeight: "600",
      textTransform: "uppercase",
    },
    statusPENDING: {
      backgroundColor: colors.warning + "20",
    },
    statusFAILED: {
      backgroundColor: colors.error + "20",
    },
    statusCOMPLETED: {
      backgroundColor: colors.success + "20",
    },
    statusCOMPLETED_EXTERNAL: {
      backgroundColor: colors.success + "20",
    },
    statusIGNORED: {
      backgroundColor: colors.textSecondary + "20",
    },
    statusSNOOZE: {
      backgroundColor: colors.warning + "20",
    },
    statusDELETED: {
      backgroundColor: colors.error + "20",
    },
    unreadText: {
      fontWeight: "600",
      color: colors.text,
    },
    unreadIndicator: {
      position: "absolute",
      top: 12,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      zIndex: 50,
    },
    sidebar: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      backgroundColor: colors.surface,
      shadowColor: "#000",
      shadowOffset: {
        width: 2,
        height: 0,
      },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 5,
      zIndex: 100,
    },
    sidebarHeader: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sidebarLogoContainer: {
      paddingBottom: 16,
    },
    sidebarLogo: {
      borderRadius: 10,
      width: 40,
      height: 40,
    },
    sidebarTitleContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sidebarTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    sidebarContent: {
      flex: 1,
      paddingTop: 8,
    },
    sidebarItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    sidebarItemActive: {
      backgroundColor: colors.primary + "20",
    },
    sidebarItemText: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 16,
      flex: 1,
    },
    sidebarItemTextActive: {
      color: colors.primary,
      fontWeight: "600",
    },
    sidebarItemCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    sidebarItemCountActive: {
      color: colors.primary,
    },
    fab: {
      position: "absolute",
      bottom: 20,
      right: 20,
      backgroundColor: colors.primary,
      borderRadius: 28,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 10,
    },
    fabText: {
      color: "#FFFFFF",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 8,
    },
    contextFilterContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
    },
    contextChipsContainer: {
      paddingHorizontal: 12,
      gap: 6,
    },
    contextChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1.5,
      marginRight: 8,
      minWidth: 60,
      alignItems: "center",
      justifyContent: "center",
    },
    contextChipSelected: {
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    contextChipUnselected: {
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    contextChipText: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    actionChipsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 3,
    },
    actionChip: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      marginRight: 3,
      marginBottom: 1,
    },
    actionChipText: {
      fontSize: 10,
      fontWeight: "600",
      textAlign: "center",
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
      backgroundColor: colors.background,
    },
    emptyStateIconContainer: {
      marginBottom: 20,
      opacity: 0.7,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    emptyStateMotivationalMessage: {
      fontSize: 18,
      color: colors.primary,
      textAlign: "center",
      marginBottom: 30,
      lineHeight: 24,
      fontStyle: "italic",
      fontWeight: "500",
    },
    emptyStateButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      borderRadius: 28,
      paddingHorizontal: 20,
      paddingVertical: 12,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    emptyStateButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 10,
    },
  });
