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
  getFilterCount,
  getFilterTitle,
  getFilterIcon,
} from "@/utils/taskUtils";
import { UserTask } from "@/types/userTask";

interface TaskSidebarProps {
  sidebarTranslateX: Animated.Value;
  sidebarVisible: boolean;
  activeFilter: UserTaskFilter;
  userTasks: UserTask[];
  onFilterSelect: (filter: UserTaskFilter) => void;
  onClose: () => void;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  sidebarTranslateX,
  sidebarVisible,
  activeFilter,
  userTasks,
  onFilterSelect,
  onClose,
}) => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  if (!sidebarVisible) return null;

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
          ["inbox", "archived", "sent", "snoozed", "trash"] as UserTaskFilter[]
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
            <Text
              style={[
                styles.sidebarItemCount,
                activeFilter === filter && styles.sidebarItemCountActive,
              ]}
            >
              {getFilterCount(userTasks, filter)}
            </Text>
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
