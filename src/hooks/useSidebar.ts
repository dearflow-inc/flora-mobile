import { useState, useRef } from "react";
import { Animated, Dimensions } from "react-native";

const { width: screenWidth } = Dimensions.get("window");
const SIDEBAR_WIDTH = screenWidth * 0.75;

export const useSidebar = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarTranslateX = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  const openSidebar = () => {
    setSidebarVisible(true);
    Animated.timing(sidebarTranslateX, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeSidebar = () => {
    Animated.timing(sidebarTranslateX, {
      toValue: -SIDEBAR_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSidebarVisible(false);
    });
  };

  return {
    sidebarVisible,
    sidebarTranslateX,
    openSidebar,
    closeSidebar,
    SIDEBAR_WIDTH,
  };
};
