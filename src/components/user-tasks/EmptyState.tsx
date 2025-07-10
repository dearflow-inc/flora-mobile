import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

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

interface EmptyStateProps {
  title?: string;
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "All caught up!",
  message,
}) => {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  const getRandomMotivationalMessage = () => {
    const randomIndex = Math.floor(
      Math.random() * MOTIVATIONAL_MESSAGES.length
    );
    return MOTIVATIONAL_MESSAGES[randomIndex];
  };

  return (
    <View style={styles.emptyStateContainer}>
      <View style={styles.emptyStateIconContainer}>
        <MaterialIcons name="task-alt" size={80} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateMotivationalMessage}>
        {message || getRandomMotivationalMessage()}
      </Text>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
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
  });
