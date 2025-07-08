import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface VideoContextViewProps {
  videos: any[];
  onVideoPress: (video: any) => void;
}

export const VideoContextView: React.FC<VideoContextViewProps> = ({
  videos,
  onVideoPress,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  if (!videos || videos.length === 0) {
    return (
      <View style={styles.noVideosContainer}>
        <MaterialIcons
          name="video-library"
          size={24}
          color={colors.textSecondary}
        />
        <Text style={styles.noVideosText}>No videos found</Text>
      </View>
    );
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Video Context ({videos.length} video{videos.length > 1 ? "s" : ""})
      </Text>

      <ScrollView
        style={styles.videosContainer}
        showsVerticalScrollIndicator={false}
      >
        {videos.map((video, index) => (
          <TouchableOpacity
            key={video.id || index}
            style={styles.videoItem}
            onPress={() => onVideoPress(video)}
          >
            <View style={styles.videoThumbnail}>
              <MaterialIcons
                name="play-circle-filled"
                size={48}
                color={colors.primary}
              />
            </View>

            <View style={styles.videoInfo}>
              <Text style={styles.videoTitle} numberOfLines={2}>
                {video.title || video.name || "Untitled Video"}
              </Text>

              <View style={styles.videoMeta}>
                {video.duration && (
                  <Text style={styles.videoMetaText}>
                    {formatDuration(video.duration)}
                  </Text>
                )}

                {video.createdAt && (
                  <Text style={styles.videoMetaText}>
                    {new Date(video.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {video.description && (
                <Text style={styles.videoDescription} numberOfLines={2}>
                  {video.description}
                </Text>
              )}
            </View>

            <MaterialIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 12,
    },
    videosContainer: {
      flex: 1,
      maxHeight: 400, // Limit height to prevent overflow
    },
    videoItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 12,
      marginBottom: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    videoThumbnail: {
      width: 60,
      height: 60,
      backgroundColor: colors.surface,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    videoInfo: {
      flex: 1,
    },
    videoTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 4,
    },
    videoMeta: {
      flexDirection: "row",
      gap: 12,
      marginBottom: 4,
    },
    videoMetaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    videoDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    noVideosContainer: {
      padding: 24,
      alignItems: "center",
    },
    noVideosText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
  });
