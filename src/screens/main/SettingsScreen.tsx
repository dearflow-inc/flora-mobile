import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import { resetAppData, saveThemeAsync } from "@/store/slices/appSlice";
import { deleteAccountAsync, signOutAsync } from "@/store/slices/authSlice";
import { clearCurrentChat } from "@/store/slices/chatSlice";
import {
  clearAdminProfiles,
  clearCurrentProfile,
  clearDashboardData,
  clearOnboardingChatId,
  clearProfileSharing,
  fetchMyProfileAsync,
  updateMyProfileAsync,
} from "@/store/slices/profileSlice";
import { resetTodos } from "@/store/slices/todoSlice";
import {
  ProfileEmailPreference,
  ProfileEmailPreferenceType,
} from "@/types/profile";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const timezones = [
  { name: "UTC", value: "UTC" },
  { name: "Eastern Time (US & Canada)", value: "America/New_York" },
  { name: "Central Time (US & Canada)", value: "America/Chicago" },
  { name: "Mountain Time (US & Canada)", value: "America/Denver" },
  { name: "Pacific Time (US & Canada)", value: "America/Los_Angeles" },
  { name: "Alaska", value: "America/Anchorage" },
  { name: "Hawaii", value: "Pacific/Honolulu" },
  { name: "London", value: "Europe/London" },
  { name: "Paris", value: "Europe/Paris" },
  { name: "Berlin", value: "Europe/Berlin" },
  { name: "Rome", value: "Europe/Rome" },
  { name: "Moscow", value: "Europe/Moscow" },
  { name: "Dubai", value: "Asia/Dubai" },
  { name: "Mumbai", value: "Asia/Kolkata" },
  { name: "Bangkok", value: "Asia/Bangkok" },
  { name: "Singapore", value: "Asia/Singapore" },
  { name: "Tokyo", value: "Asia/Tokyo" },
  { name: "Seoul", value: "Asia/Seoul" },
  { name: "Sydney", value: "Australia/Sydney" },
  { name: "Auckland", value: "Pacific/Auckland" },
];

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors, isDark } = useTheme();
  const { currentProfile, isLoading, isUpdating } = useAppSelector(
    (state) => state.profile
  );

  const [timeZone, setTimeZone] = useState("");
  const [emailPreferences, setEmailPreferences] = useState<
    ProfileEmailPreference[]
  >([]);
  const [isTimezoneDropdownVisible, setIsTimezoneDropdownVisible] =
    useState(false);

  useEffect(() => {
    // Fetch profile when component mounts
    dispatch(fetchMyProfileAsync());
  }, [dispatch]);

  useEffect(() => {
    // Update local state when profile is loaded
    if (currentProfile) {
      setTimeZone(currentProfile.mainTimeZone || "UTC");
      setEmailPreferences(
        currentProfile.emailPreferences || [
          { emailType: ProfileEmailPreferenceType.NEWSLETTER, active: true },
          { emailType: ProfileEmailPreferenceType.WEEKLY, active: true },
          {
            emailType: ProfileEmailPreferenceType.TECHNICAL_REQUIREMENTS,
            active: true,
          },
        ]
      );
    }
  }, [currentProfile]);

  const handleThemeToggle = async (value: boolean) => {
    const theme = value ? "dark" : "light";
    try {
      await dispatch(saveThemeAsync(theme)).unwrap();
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to save theme preference. Please try again."
      );
    }
  };

  const handleTimeZoneChange = async (value: string) => {
    setTimeZone(value);
    setIsTimezoneDropdownVisible(false);

    // Auto-save timezone change
    if (currentProfile) {
      try {
        await dispatch(
          updateMyProfileAsync({
            timeZone: value,
          })
        ).unwrap();
      } catch (error) {
        Alert.alert("Error", "Failed to update timezone. Please try again.");
      }
    }
  };

  const handleEmailPreferenceToggle = (
    emailType: ProfileEmailPreferenceType
  ) => {
    return async (value: boolean) => {
      const updatedPreferences = emailPreferences.map((pref) =>
        pref.emailType === emailType ? { ...pref, active: value } : pref
      );

      setEmailPreferences(updatedPreferences);

      // Auto-save email preference change
      if (currentProfile) {
        try {
          await dispatch(
            updateMyProfileAsync({
              emailPreferences: updatedPreferences,
            })
          ).unwrap();
        } catch (error) {
          Alert.alert(
            "Error",
            "Failed to update email preferences. Please try again."
          );
        }
      }
    };
  };

  const handleOpenPrivacyPolicy = () => {
    const url = "https://app.dearflow.ai/legal/privacy-policy";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open privacy policy. Please try again.");
    });
  };

  const handleOpenTermsOfService = () => {
    const url = "https://app.dearflow.ai/legal/terms-of-use";
    Linking.openURL(url).catch(() => {
      Alert.alert(
        "Error",
        "Could not open terms of service. Please try again."
      );
    });
  };

  const handleContactSupport = () => {
    navigation.navigate("ContactSupport" as never);
  };

  const handleSupport = () => {
    navigation.navigate("Support" as never);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear Data",
      "Are you sure you want to clear all app data? This will remove all your todos, chats, and profile data but keep your account logged in.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            // Clear all slices except auth
            dispatch(resetAppData());
            dispatch(clearCurrentProfile());
            dispatch(clearDashboardData());
            dispatch(clearProfileSharing());
            dispatch(clearAdminProfiles());
            dispatch(clearOnboardingChatId());
            dispatch(clearCurrentChat());
            dispatch(resetTodos());
            Alert.alert("Success", "App data cleared successfully");
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => dispatch(signOutAsync()),
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => dispatch(deleteAccountAsync()),
        },
      ]
    );
  };

  const formatEmailPreferenceType = (type: ProfileEmailPreferenceType) => {
    switch (type) {
      case ProfileEmailPreferenceType.NEWSLETTER:
        return "Newsletter";
      case ProfileEmailPreferenceType.WEEKLY:
        return "Weekly Updates";
      case ProfileEmailPreferenceType.TECHNICAL_REQUIREMENTS:
        return "Technical Requirements";
      default:
        return type;
    }
  };

  const getEmailPreference = (type: ProfileEmailPreferenceType) => {
    return (
      emailPreferences.find((pref) => pref.emailType === type)?.active || false
    );
  };

  const getTimezoneLabel = (value: string) => {
    const timezone = timezones.find((tz) => tz.value === value);
    return timezone ? timezone.name : value;
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={isDark}
              onValueChange={handleThemeToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDark ? "#FFFFFF" : "#F4F3F4"}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Preferences</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {formatEmailPreferenceType(ProfileEmailPreferenceType.NEWSLETTER)}
            </Text>
            <Switch
              value={getEmailPreference(ProfileEmailPreferenceType.NEWSLETTER)}
              onValueChange={handleEmailPreferenceToggle(
                ProfileEmailPreferenceType.NEWSLETTER
              )}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                getEmailPreference(ProfileEmailPreferenceType.NEWSLETTER)
                  ? "#FFFFFF"
                  : "#F4F3F4"
              }
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {formatEmailPreferenceType(ProfileEmailPreferenceType.WEEKLY)}
            </Text>
            <Switch
              value={getEmailPreference(ProfileEmailPreferenceType.WEEKLY)}
              onValueChange={handleEmailPreferenceToggle(
                ProfileEmailPreferenceType.WEEKLY
              )}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                getEmailPreference(ProfileEmailPreferenceType.WEEKLY)
                  ? "#FFFFFF"
                  : "#F4F3F4"
              }
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>
              {formatEmailPreferenceType(
                ProfileEmailPreferenceType.TECHNICAL_REQUIREMENTS
              )}
            </Text>
            <Switch
              value={getEmailPreference(
                ProfileEmailPreferenceType.TECHNICAL_REQUIREMENTS
              )}
              onValueChange={handleEmailPreferenceToggle(
                ProfileEmailPreferenceType.TECHNICAL_REQUIREMENTS
              )}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                getEmailPreference(
                  ProfileEmailPreferenceType.TECHNICAL_REQUIREMENTS
                )
                  ? "#FFFFFF"
                  : "#F4F3F4"
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenPrivacyPolicy}
          >
            <Text style={styles.actionButtonText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleOpenTermsOfService}
          >
            <Text style={styles.actionButtonText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleContactSupport}
          >
            <Text style={styles.actionButtonText}>Contact Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleSupport}>
            <Text style={styles.actionButtonText}>Support & Help</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleClearData}
          >
            <Text style={styles.dangerButtonText}>Clear App Data</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleDeleteAccount}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Timezone Dropdown Modal */}
        <Modal
          visible={isTimezoneDropdownVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsTimezoneDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setIsTimezoneDropdownVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Time Zone</Text>
              <ScrollView style={styles.modalScrollView}>
                {timezones.map((timezone) => (
                  <TouchableOpacity
                    key={timezone.value}
                    style={[
                      styles.modalOption,
                      timeZone === timezone.value && styles.modalOptionSelected,
                    ]}
                    onPress={() => handleTimeZoneChange(timezone.value)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        timeZone === timezone.value &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {timezone.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
    },
    inputRow: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    dropdownButton: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.surface,
    },
    dropdownButtonText: {
      fontSize: 16,
      color: colors.text,
      flex: 1,
    },
    dropdownArrow: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    savingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    savingText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.primary,
    },
    actionButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    actionButtonText: {
      fontSize: 16,
      color: colors.primary,
    },
    dangerButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    dangerButtonText: {
      fontSize: 16,
      color: colors.danger,
    },
    logoutButton: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
    },
    logoutButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      width: "90%",
      maxWidth: 400,
      maxHeight: "80%",
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 16,
      textAlign: "center",
    },
    modalScrollView: {
      maxHeight: 400,
    },
    modalOption: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    modalOptionSelected: {
      backgroundColor: colors.primary,
    },
    modalOptionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
    },
    modalOptionTextSelected: {
      color: "#FFFFFF",
    },
  });
