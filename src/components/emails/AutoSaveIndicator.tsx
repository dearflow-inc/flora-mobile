import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface AutoSaveIndicatorProps {
  lastSaved: Date | null;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  lastSaved,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const formatLastSaved = () => {
    if (!lastSaved) return "";
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Saved just now";
    if (minutes === 1) return "Saved 1 minute ago";
    return `Saved ${minutes} minutes ago`;
  };

  if (!lastSaved) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons name="cloud-done" size={14} color={colors.primary} />
      <Text style={styles.text}>{formatLastSaved()}</Text>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
    },
    text: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
  });
