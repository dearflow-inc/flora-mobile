import { EmailContextView } from "@/components/context/EmailContextView";
import { useTheme } from "@/hooks/useTheme";
import { AppDispatch, RootState } from "@/store";
import { fetchEmailsByThreadIdAsync } from "@/store/slices/emailSlice";
import { Email } from "@/types/email";
import { AppStackParamList } from "@/types/navigation";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

type EmailThreadScreenProps = NativeStackNavigationProp<
  AppStackParamList,
  "EmailThreadDetail"
>;

interface EmailThreadScreenParams {
  threadId: string;
}

export const EmailThreadScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<EmailThreadScreenProps>();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { threadId } = (route.params as EmailThreadScreenParams) || {};

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [contextData, setContextData] = useState<{
    emails?: Email[];
  }>({});

  const { threadEmails, isLoading: isLoadingEmails } = useSelector(
    (state: RootState) => state.emails
  );

  const styles = createStyles(colors);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (threadId) {
      loadThreadData();
    }
  }, [threadId]);

  const loadThreadData = async () => {
    if (!threadId) return;

    try {
      const threadResult = await dispatch(fetchEmailsByThreadIdAsync(threadId));

      if (
        threadResult.type === "emails/fetchEmailsByThreadId/fulfilled" &&
        threadResult.payload &&
        Array.isArray(threadResult.payload)
      ) {
        setContextData({ emails: threadResult.payload });
      }
    } catch (error) {
      console.error("Failed to load email thread:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadThreadData();
    setIsRefreshing(false);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderContext = () => {
    // Show loading state when initially loading and no emails are available
    if (
      isLoadingEmails ||
      !contextData.emails ||
      contextData.emails.length === 0
    ) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading email thread...</Text>
        </View>
      );
    }

    // Show empty state when not loading and no emails found
    if (
      !isLoadingEmails &&
      (!contextData.emails || contextData.emails.length === 0)
    ) {
      return (
        <View style={styles.emptyStateContainer}>
          <MaterialIcons name="email" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>No Emails Found</Text>
          <Text style={styles.emptyStateText}>
            No emails found in this thread.
          </Text>
        </View>
      );
    }

    // Show EmailContextView with emails and loading state
    return (
      <View
        style={[
          styles.contextContainer,
          {
            height: height - 120, // Full height minus header
            maxHeight: height - 120,
            width: width,
          },
        ]}
      >
        <EmailContextView emails={contextData.emails || []} />
      </View>
    );
  };

  if (!threadId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error" size={48} color={colors.danger} />
          <Text style={styles.errorTitle}>Thread Not Found</Text>
          <Text style={styles.errorText}>
            The requested email thread could not be found.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Thread</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={handleRefresh}>
            <MaterialIcons name="refresh" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content - takes up remaining space */}
      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          scrollEnabled={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Context Section - takes up remaining space */}
          <View style={styles.contextWrapper}>{renderContext()}</View>
        </ScrollView>
      </View>
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
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 32,
    },
    errorTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 16,
    },
    errorText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 8,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingRight: 7,
      paddingLeft: 3,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
    },
    backButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "600",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      textAlign: "center",
    },
    headerRight: {
      flexDirection: "row",
    },
    headerButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    contextWrapper: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    contextContainer: {
      backgroundColor: colors.surface,
      flex: 1,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
  });
