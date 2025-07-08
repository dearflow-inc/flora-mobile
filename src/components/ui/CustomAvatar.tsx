import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface CustomAvatarProps {
  src?: string;
  alt?: string;
  size?: number;
}

export const CustomAvatar: React.FC<CustomAvatarProps> = ({
  src,
  alt = "",
  size = 40,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors, size);

  const getInitial = () => {
    return alt.charAt(0).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {src ? (
        <Image source={{ uri: src }} style={styles.image} />
      ) : (
        <View style={styles.gradient}>
          <Text style={styles.initial}>{getInitial()}</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any, size: number) =>
  StyleSheet.create({
    container: {
      width: size,
      height: size,
      borderRadius: size / 2,
      overflow: "hidden",
    },
    image: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    gradient: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    initial: {
      color: "white",
      fontSize: size * 0.4,
      fontWeight: "600",
    },
  });
