import { useTheme } from "@/hooks/useTheme";
import { useState } from "react";
import { Animated } from "react-native";

interface ContextView {
  id: string;
  name: string;
  color: string;
  importance: number;
}

export const useContextViews = (contextViews: ContextView[]) => {
  const [selectedContextViewId, setSelectedContextViewId] = useState<
    string | null
  >(null);
  const [contextViewSwitchAnimation] = useState(new Animated.Value(0));
  const { colors } = useTheme();

  const getContextViewList = () => {
    return [
      { id: "all", name: "All", color: colors.primary },
      { id: "important", name: "Important", color: colors.primary },
      ...(contextViews || [])
        .sort((a, b) => b.importance - a.importance)
        .map((cv) => ({
          id: cv.id,
          name: cv.name,
          color: cv.color,
        })),
    ];
  };

  const switchToNextContextView = () => {
    const contextViewList = getContextViewList();
    const currentIndex = contextViewList.findIndex(
      (cv) => cv.id === selectedContextViewId
    );
    const nextIndex = (currentIndex + 1) % contextViewList.length;
    const nextContextView = contextViewList[nextIndex];

    // Add visual feedback
    Animated.sequence([
      Animated.timing(contextViewSwitchAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contextViewSwitchAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedContextViewId(nextContextView?.id);
  };

  const switchToPreviousContextView = () => {
    const contextViewList = getContextViewList();
    const currentIndex = contextViewList.findIndex(
      (cv) => cv.id === selectedContextViewId
    );
    const previousIndex =
      currentIndex === 0 ? contextViewList.length - 1 : currentIndex - 1;
    const previousContextView = contextViewList[previousIndex];

    // Add visual feedback
    Animated.sequence([
      Animated.timing(contextViewSwitchAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(contextViewSwitchAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedContextViewId(previousContextView?.id);
  };

  return {
    selectedContextViewId,
    setSelectedContextViewId,
    contextViewSwitchAnimation,
    getContextViewList,
    switchToNextContextView,
    switchToPreviousContextView,
  };
};
