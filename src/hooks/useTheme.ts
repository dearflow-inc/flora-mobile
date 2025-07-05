import { useAppSelector } from "./redux";

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  primary: string;
  danger: string;
  success: string;
  warning: string;
  shadow: string;
}

const lightTheme: ThemeColors = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  border: "#E0E0E0",
  primary: "#4285DA",
  danger: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  shadow: "#000000",
};

const darkTheme: ThemeColors = {
  background: "#1C1C1E",
  surface: "#2C2C2E",
  text: "#FFFFFF",
  textSecondary: "#AEAEB2",
  border: "#38383A",
  primary: "#4285DA",
  danger: "#FF453A",
  success: "#30D158",
  warning: "#FF9F0A",
  shadow: "#000000",
};

export const useTheme = () => {
  const theme = useAppSelector((state) => state.app.theme);

  const colors = theme === "dark" ? darkTheme : lightTheme;

  const isDark = theme === "dark";

  return {
    colors,
    isDark,
    theme,
  };
};
