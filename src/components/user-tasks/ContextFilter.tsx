import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface ContextView {
  id: string | null;
  name: string;
  color: string;
}

interface ContextFilterProps {
  contextViews: ContextView[];
  selectedContextViewId: string | null;
  contextViewSwitchAnimation: Animated.Value;
  onContextViewSelect: (contextViewId: string | null) => void;
  onSwitchToNext: () => void;
  onSwitchToPrevious: () => void;
}

export const ContextFilter: React.FC<ContextFilterProps> = ({
  contextViews,
  selectedContextViewId,
  contextViewSwitchAnimation,
  onContextViewSelect,
  onSwitchToNext,
  onSwitchToPrevious,
}) => {
  const { colors } = useTheme();
  const contextViewScrollRef = useRef<ScrollView>(null);

  const styles = createStyles(colors);

  const scrollActiveContextViewIntoView = (contextViewId: string | null) => {
    const targetIndex = contextViews.findIndex((cv) => cv.id === contextViewId);

    if (targetIndex !== -1 && contextViewScrollRef.current) {
      let scrollPosition = 0;

      // Calculate approximate position based on chip width and spacing
      if (contextViewId === null) {
        scrollPosition = 0;
      } else {
        const contextViewIndex = contextViews.findIndex(
          (cv) => cv.id === contextViewId
        );

        scrollPosition =
          contextViewIndex * 8 +
          contextViewIndex * 32 +
          contextViews
            .slice(0, contextViewIndex)
            .reduce((acc, item) => acc + item.name.length * 6, 0);
      }

      contextViewScrollRef.current.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  };

  // Scroll to active context view when context views change or component mounts
  useEffect(() => {
    if (contextViews && contextViews.length > 0) {
      setTimeout(() => {
        scrollActiveContextViewIntoView(selectedContextViewId);
      }, 200);
    }
  }, [contextViews, selectedContextViewId]);

  return (
    <View style={styles.contextFilterContainer}>
      <Animated.View
        style={[
          styles.contextSwitchIndicator,
          {
            opacity: contextViewSwitchAnimation,
            transform: [
              {
                scale: contextViewSwitchAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.2],
                }),
              },
            ],
          },
        ]}
      />
      <ScrollView
        ref={contextViewScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contextChipsContainer}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      >
        {contextViews.map((item) => {
          const isSelected = selectedContextViewId === item.id;
          return (
            <TouchableOpacity
              key={item.id || "important"}
              style={[
                styles.contextChip,
                isSelected
                  ? styles.contextChipSelected
                  : styles.contextChipUnselected,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => {
                onContextViewSelect(item.id);

                // Scroll the selected context view into view
                setTimeout(() => {
                  scrollActiveContextViewIntoView(item.id);
                }, 100);
              }}
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
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    contextFilterContainer: {
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: 8,
      position: "relative",
    },
    contextSwitchIndicator: {
      position: "absolute",
      top: "50%",
      left: "50%",
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
      zIndex: 10,
      marginLeft: -2,
      marginTop: -2,
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
  });
