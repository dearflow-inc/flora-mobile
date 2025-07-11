import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface FollowUpIndicatorProps {
  followUpAt?: Date;
  onRemove: () => void;
}

export const FollowUpIndicator: React.FC<FollowUpIndicatorProps> = ({
  followUpAt,
  onRemove,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const formatFollowUpTime = () => {
    if (!followUpAt) return "Flora Picks";
    return followUpAt.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <View style={styles.container}>
      <MaterialIcons name="schedule" size={16} color={colors.primary} />
      <Text style={styles.text}>
        Follow-up scheduled for {formatFollowUpTime()}
      </Text>
      <TouchableOpacity onPress={onRemove}>
        <MaterialIcons name="close" size={16} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "10",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    text: {
      flex: 1,
      fontSize: 14,
      color: colors.primary,
      marginLeft: 8,
    },
  });
