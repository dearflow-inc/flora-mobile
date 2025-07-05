import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchToolExecutionByIdAsync } from "@/store/slices/toolExecutionSlice";
import { ToolEndpointAction } from "@/types/toolExecution";
import { ComposeEmail } from "./components/ComposeEmail";

type ToolExecutionScreenParams = {
  toolExecutionId: string;
};

export const ToolExecutionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { toolExecutionId } = (route.params as ToolExecutionScreenParams) || {};

  const { currentToolExecution, isLoading } = useSelector(
    (state: RootState) => state.toolExecutions
  );

  const styles = createStyles(colors);

  useEffect(() => {
    if (toolExecutionId) {
      dispatch(fetchToolExecutionByIdAsync(toolExecutionId));
    }
  }, [toolExecutionId, dispatch]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSendComplete = () => {
    navigation.goBack();
  };

  const getScreenTitle = () => {
    if (!currentToolExecution) return "Tool Execution";

    switch (currentToolExecution.toolEndpointAction) {
      case ToolEndpointAction.GMAIL_SEND:
        return "Compose Email";
      default:
        return "Tool Execution";
    }
  };

  const renderToolExecutionContent = () => {
    if (!currentToolExecution) return null;

    switch (currentToolExecution.toolEndpointAction) {
      case ToolEndpointAction.GMAIL_SEND:
        return (
          <ComposeEmail
            toolExecution={currentToolExecution}
            onSend={handleSendComplete}
          />
        );
      default:
        return (
          <View style={styles.unsupportedContainer}>
            <MaterialIcons
              name="build"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.unsupportedTitle}>Tool Execution</Text>
            <Text style={styles.unsupportedText}>
              Action: {currentToolExecution.toolEndpointAction}
            </Text>
            <Text style={styles.unsupportedText}>
              This tool execution type is not yet supported in the mobile app.
            </Text>
          </View>
        );
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentToolExecution) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={64} color="#FF5722" />
          <Text style={styles.errorText}>Tool execution not found</Text>
          <TouchableOpacity style={styles.button} onPress={handleBack}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
        <View style={styles.headerButton} />
      </View>

      {renderToolExecutionContent()}
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    errorText: {
      fontSize: 18,
      color: "#FF5722",
      marginTop: 16,
      marginBottom: 24,
      textAlign: "center",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    unsupportedContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
    },
    unsupportedTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    unsupportedText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    button: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      marginTop: 16,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
  });
