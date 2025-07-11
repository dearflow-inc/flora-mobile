import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import {
  UserTaskFilter,
  getFilterTitle,
  getFilterIcon,
} from "@/utils/taskUtils";
import { UserTask, UserTaskStatus } from "@/types/userTask";

interface TaskSidebarProps {
  sidebarTranslateX: Animated.Value;
  sidebarVisible: boolean;
  activeFilter: UserTaskFilter;
  userTasks: UserTask[];
  emailDraftsCount?: number;
  sentEmailsCount?: number;
  trashedEmailsCount?: number;
  onFilterSelect: (filter: UserTaskFilter) => void;
  onClose: () => void;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  sidebarTranslateX,
  sidebarVisible,
  activeFilter,
  userTasks,
  emailDraftsCount = 0,
  sentEmailsCount = 0,
  trashedEmailsCount = 0,
  onFilterSelect,
  onClose,
}) => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  if (!sidebarVisible) return null;

  // Calculate counts for user task filters
  const inboxCount = userTasks.filter(
    (task) =>
      task.status === UserTaskStatus.PENDING ||
      task.status === UserTaskStatus.FAILED
  ).length;

  const snoozedCount = userTasks.filter(
    (task) => task.status === UserTaskStatus.SNOOZE
  ).length;

  const completedCount = userTasks.filter(
    (task) =>
      task.status === UserTaskStatus.COMPLETED ||
      task.status === UserTaskStatus.COMPLETED_EXTERNAL
  ).length;

  const getFilterCount = (filter: UserTaskFilter): number | null => {
    switch (filter) {
      case "inbox":
        return inboxCount;
      case "snoozed":
        return snoozedCount;
      case "draft":
        return emailDraftsCount;
      case "sent":
        return null;
      case "archived":
        return null;
      case "trash":
        return null;
      default:
        return 0;
    }
  };

  return (
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
          <TouchableOpacity onPress={onClose}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sidebarContent}>
        {(
          [
            "inbox",
            "snoozed",
            "draft",
            "sent",
            "archived",
            "trash",
          ] as UserTaskFilter[]
        ).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.sidebarItem,
              activeFilter === filter && styles.sidebarItemActive,
            ]}
            onPress={() => onFilterSelect(filter)}
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
            {getFilterCount(filter) !== null && (
              <Text
                style={[
                  styles.sidebarItemCount,
                  activeFilter === filter && styles.sidebarItemCountActive,
                ]}
              >
                {getFilterCount(filter)}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    sidebar: {
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: "75%",
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
  });
