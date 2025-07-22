import { ConnectInboxModal } from "@/components/ConnectInboxModal";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import { fetchUsageAsync, signOutAsync } from "@/store/slices/authSlice";
import {
  fetchMyProfileAsync,
  updateMyProfileAsync,
  uploadMyProfileAvatarAsync,
} from "@/store/slices/profileSlice";
import { DearflowPaymentPlan as AuthDearflowPaymentPlan } from "@/types/auth";
import { DearflowPaymentPlan, UpdateMyProfileRequest } from "@/types/profile";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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

export const ProfileScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { currentProfile, isLoading, isUploadingAvatar, isUpdating, error } =
    useAppSelector((state) => state.profile);
  const { user, emailUsage, isFetchingUsage } = useAppSelector(
    (state) => state.auth
  );

  // Edit profile modal state
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isTimezoneDropdownVisible, setIsTimezoneDropdownVisible] =
    useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    timeZone: "",
  });

  // Connect inbox modal state
  const [showConnectInboxModal, setShowConnectInboxModal] = useState(false);

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Fetch profile when component mounts
    dispatch(fetchMyProfileAsync());
    // Fetch email usage data
    dispatch(fetchUsageAsync("email_inbox_email_classified"));
  }, [dispatch]);

  useEffect(() => {
    // Update edit form when profile changes
    if (currentProfile) {
      setEditForm({
        name: currentProfile.name || "",
        description: currentProfile.description || "",
        timeZone: currentProfile.mainTimeZone || "UTC",
      });
    }
  }, [currentProfile]);

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

  const handleEditProfile = () => {
    setIsEditModalVisible(true);
  };

  const handleSettings = () => {
    // Navigate to settings screen
    navigation.navigate("Settings" as never);
  };

  const handleSaveProfile = async () => {
    try {
      const updateData: UpdateMyProfileRequest = {
        name: editForm.name.trim() || undefined,
        description: editForm.description.trim() || undefined,
        timeZone: editForm.timeZone || undefined,
      };

      await dispatch(updateMyProfileAsync(updateData)).unwrap();
      setIsEditModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };

  const handleSaveProfile1 = async () => {
    try {
      await dispatch(updateMyProfileAsync({ onboarding: 0 })).unwrap();
    } catch (error) {
      Alert.alert("Error", "Failed to restart onboarding. Please try again.");
    }
  };

  const handleTimezoneSelect = (value: string) => {
    setEditForm({ ...editForm, timeZone: value });
    setIsTimezoneDropdownVisible(false);
  };

  const getTimezoneLabel = (value: string) => {
    const timezone = timezones.find((tz) => tz.value === value);
    return timezone ? timezone.name : value;
  };

  const handleAvatarPress = () => {
    Alert.alert(
      "Update Profile Picture",
      "Choose how you'd like to update your profile picture:",
      [
        {
          text: "Take Photo",
          onPress: async () => {
            console.log("Opening camera...");
            await openCamera();
          },
        },
        {
          text: "Choose from Library",
          onPress: async () => {
            console.log("Opening image library...");
            await openImageLibrary();
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const openCamera = async () => {
    console.log("openCamera called");

    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Camera permission is required to take photos."
        );
        return;
      }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      };

      console.log("Camera options:", options);

      const result = await ImagePicker.launchCameraAsync(options);
      console.log("Camera result:", result);
      handleImagePickerResponse(result);
    } catch (error) {
      console.error("Error opening camera:", error);
      Alert.alert("Error", "Failed to open camera");
    }
  };

  const openImageLibrary = async () => {
    console.log("openImageLibrary called");

    try {
      // Request media library permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission denied",
          "Media library permission is required to select photos."
        );
        return;
      }

      const options = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.8,
      };

      console.log("Image library options:", options);

      const result = await ImagePicker.launchImageLibraryAsync(options);
      console.log("Image library result:", result);
      handleImagePickerResponse(result);
    } catch (error) {
      console.error("Error opening image library:", error);
      Alert.alert("Error", "Failed to open image library");
    }
  };

  const handleImagePickerResponse = (result: ImagePicker.ImagePickerResult) => {
    console.log("handleImagePickerResponse called with:", result);

    if (result.canceled) {
      console.log("User cancelled image picker");
      return;
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      console.log("Selected asset:", asset);
      if (asset.uri) {
        console.log("Starting upload for URI:", asset.uri);
        uploadAvatar(asset.uri);
      } else {
        console.error("No URI found in asset");
        Alert.alert("Error", "No image was selected");
      }
    } else {
      console.error("No assets found in result");
      Alert.alert("Error", "No image was selected");
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    try {
      console.log("Starting avatar upload with URI:", imageUri);

      // Create a file object compatible with React Native
      const imageFile = {
        uri: imageUri,
        type: "image/jpeg",
        name: `avatar_${Date.now()}.jpg`,
      };

      // Upload the avatar
      const result = await dispatch(
        uploadMyProfileAvatarAsync(imageFile as any)
      );

      if (uploadMyProfileAvatarAsync.fulfilled.match(result)) {
        Alert.alert("Success", "Profile picture updated successfully!");
        // Refresh the profile to get the updated avatar
        dispatch(fetchMyProfileAsync());
      } else {
        const errorMessage = result.payload as string;
        console.error("Upload failed:", errorMessage);
        Alert.alert(
          "Error",
          errorMessage || "Failed to update profile picture. Please try again."
        );
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      Alert.alert(
        "Error",
        "Failed to update profile picture. Please try again."
      );
    }
  };

  const formatPlan = (plan: DearflowPaymentPlan) => {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const formatAuthPlan = (plan: AuthDearflowPaymentPlan) => {
    switch (plan) {
      case "free":
        return "Free";
      case "email_abilities_monthly":
        return "Email Abilities Monthly";
      case "email_abilities_yearly":
        return "Email Abilities Yearly";
      default:
        return plan.charAt(0).toUpperCase() + plan.slice(1);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchMyProfileAsync()),
        dispatch(fetchUsageAsync("emails")),
      ]);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnectInbox = () => {
    setShowConnectInboxModal(true);
  };

  const handleConnectInboxSuccess = () => {
    setShowConnectInboxModal(false);
    // Refresh profile to get updated data
    dispatch(fetchMyProfileAsync());
    Alert.alert("Success", "Your inbox has been connected successfully!");
  };

  const styles = createStyles(colors);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading profile: {error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchMyProfileAsync())}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
            >
              <View style={styles.avatar}>
                {currentProfile?.avatar ? (
                  <Image
                    source={{ uri: currentProfile.avatar }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {currentProfile?.name?.charAt(0).toUpperCase() ||
                      currentProfile?.email?.charAt(0).toUpperCase() ||
                      "U"}
                  </Text>
                )}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  </View>
                )}
              </View>
              {!isUploadingAvatar && (
                <View style={styles.avatarEditOverlay}>
                  <Text style={styles.avatarEditText}>Edit</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.name}>{currentProfile?.name || "User"}</Text>
            <Text style={styles.email}>
              {currentProfile?.email || "user@example.com"}
            </Text>
          </View>

          {/* Subscription Section */}
          <View style={styles.subscriptionSection}>
            <Text style={styles.sectionTitle}>Subscription</Text>
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Text style={styles.subscriptionTitle}>
                  {user?.paymentPlans?.length
                    ? formatAuthPlan(user.paymentPlans[0].plan)
                    : "Free"}
                </Text>
                <Text style={styles.subscriptionStatus}>
                  {user?.paymentPlans?.length ? "Active" : "Free Plan"}
                </Text>
              </View>
              <View style={styles.usageContainer}>
                <Text style={styles.usageLabel}>Emails Scanned</Text>
                {isFetchingUsage ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.usageValue}>
                    {emailUsage
                      ? !user?.paymentPlans.some(
                          (plan) => plan.plan === AuthDearflowPaymentPlan.FREE
                        )
                        ? emailUsage.totalPassedThisMonth.toLocaleString()
                        : `${emailUsage.totalPassedThisMonth}/300`
                      : "0"}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  Linking.openURL("https://app.dearflow.ai/profile/plan")
                }
              >
                <Text style={styles.subscriptionLink}>
                  Change your subscription on our{" "}
                  <Text style={styles.subscriptionLinkHighlight}>webapp</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.subscriptionSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.editIcon}>✏️</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>
                  {currentProfile?.name || "Not set"}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>
                  {currentProfile?.email || "Not set"}
                </Text>
              </View>
              {currentProfile?.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{currentProfile.phone}</Text>
                </View>
              )}
              {currentProfile?.whatsApp && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>WhatsApp:</Text>
                  <Text style={styles.infoValue}>
                    {currentProfile.whatsApp}
                  </Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Time Zone:</Text>
                <Text style={styles.infoValue}>
                  {currentProfile?.mainTimeZone
                    ? getTimezoneLabel(currentProfile.mainTimeZone)
                    : "UTC"}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Description:</Text>
                <Text style={styles.infoValueLeft}>
                  {currentProfile?.description || "Not set"}
                </Text>
              </View>
            </View>
          </View>

          {currentProfile?.currentMainTargets &&
            currentProfile.currentMainTargets.length > 0 && (
              <View style={styles.profileInfo}>
                <Text style={styles.sectionTitle}>Main Targets</Text>
                {currentProfile.currentMainTargets.map((target, index) => (
                  <View key={target.id} style={styles.targetItem}>
                    <Text style={styles.targetText}>{target.text}</Text>
                  </View>
                ))}
              </View>
            )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate("Scenarios" as never)}
            >
              <Text style={styles.actionButtonText}>Show Scenarios</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSettings}
            >
              <Text style={styles.actionButtonText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleConnectInbox}
            >
              <Text style={styles.actionButtonText}>Connect Inbox</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Edit Profile Modal */}
        <Modal
          visible={isEditModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.keyboardAvoidingView}
              keyboardVerticalOffset={Platform.OS === "ios" ? -20 : 0}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Edit Profile</Text>
                  <TouchableOpacity
                    onPress={() => setIsEditModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.modalForm}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.textInput}
                      value={editForm.name}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, name: text })
                      }
                      placeholder="Enter your name"
                      placeholderTextColor={colors.textSecondary}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Description</Text>
                    <TextInput
                      style={[styles.textInput, styles.descriptionInput]}
                      value={editForm.description}
                      onChangeText={(text) =>
                        setEditForm({ ...editForm, description: text })
                      }
                      placeholder="Tell us about yourself"
                      placeholderTextColor={colors.textSecondary}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Time Zone</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setIsTimezoneDropdownVisible(true)}
                    >
                      <Text style={styles.dropdownButtonText}>
                        {getTimezoneLabel(editForm.timeZone)}
                      </Text>
                      <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setIsEditModalVisible(false)}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalSaveButton,
                      isUpdating && styles.modalSaveButtonDisabled,
                    ]}
                    onPress={handleSaveProfile}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalSaveText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

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
            <View style={styles.timezoneModalContent}>
              <Text style={styles.modalTitle}>Select Time Zone</Text>
              <ScrollView style={styles.timezoneScrollView}>
                {timezones.map((timezone) => (
                  <TouchableOpacity
                    key={timezone.value}
                    style={[
                      styles.timezoneOption,
                      editForm.timeZone === timezone.value &&
                        styles.timezoneOptionSelected,
                    ]}
                    onPress={() => handleTimezoneSelect(timezone.value)}
                  >
                    <Text
                      style={[
                        styles.timezoneOptionText,
                        editForm.timeZone === timezone.value &&
                          styles.timezoneOptionTextSelected,
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

        {/* Connect Inbox Modal */}
        <ConnectInboxModal
          visible={showConnectInboxModal}
          onClose={() => setShowConnectInboxModal(false)}
          onSuccess={handleConnectInboxSuccess}
          updateOnboarding={false}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
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
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: colors.danger,
      textAlign: "center",
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    retryButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    profileHeader: {
      alignItems: "center",
      marginBottom: 30,
      padding: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    avatarContainer: {
      position: "relative",
      marginBottom: 16,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 40,
    },
    avatarText: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#FFFFFF",
    },
    avatarEditOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      paddingVertical: 4,
      borderBottomLeftRadius: 40,
      borderBottomRightRadius: 40,
    },
    avatarLoadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 40,
    },
    avatarEditText: {
      color: "#FFFFFF",
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
    },
    name: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    profileInfo: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      marginBottom: 20,
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
      marginBottom: 8,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    editIconButton: {
      padding: 4,
    },
    editIcon: {
      fontSize: 20,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoColumn: {
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "flex-start",
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      color: colors.text,
      flex: 2,
      textAlign: "right",
    },
    infoValueLeft: {
      fontSize: 14,
      color: colors.text,
      flex: 2,
      marginTop: 4,
      textAlign: "left",
    },
    targetItem: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginBottom: 8,
    },
    targetText: {
      fontSize: 14,
      color: colors.text,
    },
    actions: {
      marginTop: 10,
    },
    actionButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      alignItems: "center",
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    logoutButton: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginTop: 20,
    },
    logoutButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    keyboardAvoidingView: {
      flex: 1,
      width: "100%",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 20,
      minHeight: "50%",
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingBottom: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    modalCloseButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    modalCloseText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: "500",
    },
    modalForm: {
      padding: 20,
      flex: 1,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    descriptionInput: {
      height: 100,
      textAlignVertical: "top",
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
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 20,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalCancelButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      marginRight: 10,
      backgroundColor: colors.border,
      alignItems: "center",
    },
    modalCancelText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    modalSaveButton: {
      flex: 1,
      padding: 16,
      borderRadius: 8,
      marginLeft: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
    },
    modalSaveButtonDisabled: {
      opacity: 0.6,
    },
    modalSaveText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    timezoneModalContent: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      margin: 20,
      maxHeight: "80%",
    },
    timezoneScrollView: {
      maxHeight: 400,
    },
    timezoneOption: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    timezoneOptionSelected: {
      backgroundColor: colors.primary,
    },
    timezoneOptionText: {
      fontSize: 16,
      color: colors.text,
      textAlign: "center",
    },
    timezoneOptionTextSelected: {
      color: "#FFFFFF",
    },
    // Subscription section styles
    subscriptionSection: {
      marginBottom: 20,
    },
    subscriptionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 20,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    subscriptionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    subscriptionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    subscriptionStatus: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    subscriptionLink: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
      marginLeft: "auto",
    },
    subscriptionLinkHighlight: {
      fontSize: 14,
      color: colors.primary,
      textDecorationLine: "underline",
    },
    usageContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
    },
    usageLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    usageValue: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
  });
