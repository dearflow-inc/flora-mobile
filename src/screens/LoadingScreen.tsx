import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export const LoadingScreen = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    text: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
  });
