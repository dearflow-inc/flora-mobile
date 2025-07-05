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
import {
  selectEmailDrafts,
  createToolExecutionAsync,
} from "@/store/slices/toolExecutionSlice";
import { fetchMyEmailsAsync } from "@/store/slices/emailSlice";
import { useNavigation } from "@react-navigation/native";
import { Email, EmailWithoutContent, EmailLabel } from "@/types/email";
import {
  parseEmailDraftFromToolExecution,
  ToolEndpointAction,
  ParameterType,
} from "@/types/toolExecution";

const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = screenWidth * 0.75;

type EmailFilter = "inbox" | "sent" | "drafts" | "trash";

export const EmailsScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<EmailFilter>("inbox");
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();

  const { emails, isLoading } = useSelector((state: RootState) => state.emails);
  const drafts = useSelector(selectEmailDrafts);

  const styles = createStyles(colors);
  const sidebarTranslateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    dispatch(fetchMyEmailsAsync());
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
      case "drafts":
        // For drafts, we'll handle this separately since we show tool execution drafts
        return [];
      default:
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
    if (activeFilter !== "drafts") return [];

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

  const handleEmailPress = (email: EmailWithoutContent) => {
    // TODO: Navigate to email detail screen
    console.log("Email pressed:", email.id);
  };

  const handleDraftPress = (draftId: string) => {
    navigation.navigate("ToolExecution", { toolExecutionId: draftId });
  };

  const handleFilterSelect = (filter: EmailFilter) => {
    setActiveFilter(filter);
    closeSidebar();
  };

  const renderEmail = ({ item }: { item: EmailWithoutContent }) => (
    <TouchableOpacity
      style={[
        styles.emailItem,
        !item.status?.internalRead && styles.unreadEmail,
      ]}
      onPress={() => handleEmailPress(item)}
    >
      <View style={styles.emailHeader}>
        <View style={styles.emailInfo}>
          <Text
            style={[
              styles.sender,
              !item.status?.internalRead && styles.unreadText,
            ]}
          >
            {item.from.meta?.name || item.from.meta?.email || "Unknown"}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.sent).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            /* TODO: Toggle star */
          }}
        >
          <MaterialIcons
            name={
              item.externalLabels.includes(EmailLabel.STARRED)
                ? "star"
                : "star-border"
            }
            size={20}
            color={
              item.externalLabels.includes(EmailLabel.STARRED)
                ? "#FFD700"
                : "#CCCCCC"
            }
          />
        </TouchableOpacity>
      </View>
      <Text
        style={[
          styles.subject,
          !item.status?.internalRead && styles.unreadText,
        ]}
      >
        {item.subject}
      </Text>
      <Text style={styles.preview} numberOfLines={2}>
        {item.previewText || "No preview available"}
      </Text>
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
        <View style={styles.emailHeader}>
          <View style={styles.emailInfo}>
            <Text style={styles.sender}>
              Draft to:{" "}
              {Array.isArray(emailData.to)
                ? emailData.to.join(", ")
                : "Unknown"}
            </Text>
            <Text style={styles.timestamp}>
              {new Date(item.updatedAt).toLocaleDateString()}
            </Text>
          </View>
          <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
        </View>
        <Text style={styles.subject}>{emailData.subject || "No subject"}</Text>
        <Text style={styles.preview}>
          {emailData.body
            ? emailData.body.substring(0, 100) + "..."
            : "No content"}
        </Text>
      </TouchableOpacity>
    );
  };

  const getFilterCount = (filter: EmailFilter) => {
    switch (filter) {
      case "inbox":
        return emails.filter(
          (email) =>
            email.externalLabels.includes(EmailLabel.INBOX) &&
            !email.externalLabels.includes(EmailLabel.TRASH)
        ).length;
      case "drafts":
        return drafts.length;
      case "sent":
        return emails.filter((email) =>
          email.externalLabels.includes(EmailLabel.SENT)
        ).length;
      case "trash":
        return emails.filter((email) =>
          email.externalLabels.includes(EmailLabel.TRASH)
        ).length;
      default:
        return 0;
    }
  };

  const getFilterTitle = (filter: EmailFilter) => {
    switch (filter) {
      case "inbox":
        return "Inbox";
      case "sent":
        return "Sent";
      case "drafts":
        return "Drafts";
      case "trash":
        return "Trash";
      default:
        return "Inbox";
    }
  };

  const getFilterIcon = (filter: EmailFilter) => {
    switch (filter) {
      case "inbox":
        return "inbox";
      case "sent":
        return "send";
      case "drafts":
        return "drafts";
      case "trash":
        return "delete";
      default:
        return "inbox";
    }
  };

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
          <Text style={styles.sidebarTitle}>All Inboxes</Text>
          <TouchableOpacity onPress={closeSidebar}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sidebarContent}>
        {(["inbox", "drafts", "sent", "trash"] as EmailFilter[]).map(
          (filter) => (
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
                  activeFilter === filter
                    ? colors.primary
                    : colors.textSecondary
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
          )
        )}
      </View>
    </Animated.View>
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
                placeholder="Search emails..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {activeFilter === "drafts" ? (
            <FlatList
              data={filteredDrafts}
              renderItem={renderDraft}
              keyExtractor={(item) => item.id}
              style={styles.emailsList}
              contentContainerStyle={styles.emailsContainer}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={() => dispatch(fetchMyEmailsAsync())}
            />
          ) : (
            <FlatList
              data={filteredEmails}
              renderItem={renderEmail}
              keyExtractor={(item) => item.id}
              style={styles.emailsList}
              contentContainerStyle={styles.emailsContainer}
              showsVerticalScrollIndicator={false}
              refreshing={isLoading}
              onRefresh={() => dispatch(fetchMyEmailsAsync())}
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
        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
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
      paddingHorizontal: 16,
      paddingVertical: 12,
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
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: "relative",
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
      marginBottom: 8,
    },
    emailInfo: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sender: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      flex: 1,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    subject: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 4,
    },
    preview: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
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
  });
