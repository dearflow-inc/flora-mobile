import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import { regenerateTextService } from "@/services/regenerateTextService";
import { createFeedbackAsync } from "@/store/slices/profileSlice";
import { FeedbackPurpose } from "@/types/profile";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const feedbackOptions = [
  {
    name: "General Inquiry",
    value: FeedbackPurpose.GENERAL_HELP,
  },
  {
    name: "Ask for Feature",
    value: FeedbackPurpose.ASK_FEATURE,
  },
  {
    name: "Report a Bug or Error",
    value: FeedbackPurpose.REPORT_BUG_ERROR,
  },
];

const socials = [
  {
    icon: "business",
    name: "LinkedIn",
    url: "linkedin.com/company/dearflow",
    href: "https://linkedin.com/company/dearflow",
    bgColor: "#FAEEFD",
  },
  {
    icon: "flutter-dash",
    name: "Twitter",
    url: "x.com/dearflow_ai",
    href: "https://twitter.com/dearflow_ai",
    bgColor: "#F5F3FC",
  },
  {
    icon: "camera-alt",
    name: "Instagram",
    url: "instagram.com/dearflow_ai",
    href: "https://instagram.com/dearflow_ai",
    bgColor: "#EBF9FC",
  },
  {
    icon: "chat",
    name: "Discord",
    url: "dearflow.ai",
    href: "https://discord.gg/nfQ8guRn2G",
    bgColor: "#F1F6FC",
  },
];

export const SupportScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { colors } = useTheme();
  const { currentProfile, isCreatingFeedback } = useAppSelector(
    (state) => state.profile
  );

  const [formData, setFormData] = useState({
    name: "",
    feedback: "",
    feedbackPurpose: FeedbackPurpose.GENERAL_HELP,
  });

  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showAIModal, setShowAIModal] = useState(true); // Opens immediately
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAskingAI, setIsAskingAI] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      setFormData((prev) => ({
        ...prev,
        name: currentProfile.name || "",
      }));
    }
  }, [currentProfile]);

  const handleInputChange = (key: string, value: string | FeedbackPurpose) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmitFeedback = async () => {
    if (!currentProfile) {
      Alert.alert("Error", "Profile not found");
      return;
    }

    if (!formData.name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    if (!formData.feedback.trim()) {
      Alert.alert("Error", "Please enter your feedback");
      return;
    }

    try {
      await dispatch(
        createFeedbackAsync({
          authUserId: currentProfile.authUserId,
          email: currentProfile.email || "",
          name: formData.name,
          feedback: formData.feedback,
          purpose: formData.feedbackPurpose,
        })
      ).unwrap();

      Alert.alert("Success", "Feedback submitted successfully!");
      setFormData((prev) => ({
        ...prev,
        feedback: "",
      }));
    } catch (error) {
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    }
  };

  const handleSocialPress = (href: string) => {
    Linking.openURL(href).catch(() => {
      Alert.alert("Error", "Could not open link. Please try again.");
    });
  };

  const getFeedbackPurposeLabel = (purpose: FeedbackPurpose) => {
    const option = feedbackOptions.find((opt) => opt.value === purpose);
    return option ? option.name : purpose;
  };

  const handleDropdownSelect = (value: FeedbackPurpose) => {
    handleInputChange("feedbackPurpose", value);
    setIsDropdownVisible(false);
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) {
      Alert.alert("Error", "Please describe your issue or feature request");
      return;
    }

    setIsAskingAI(true);
    try {
      const response = await regenerateTextService.regenerateText({
        originalText: formData.feedback,
        sectionToReplace: formData.feedback,
        modificationInstructions: `The user is currently writing a feedback message or feature request. Please help them with their request. The user's request is: ${aiQuestion}`,
        formerVersions: [],
      });

      setFormData((prev) => ({
        ...prev,
        feedback: response.replacement,
      }));
      setAiQuestion("");
      setShowAIModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to generate AI response. Please try again.");
    } finally {
      setIsAskingAI(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeContainer}>
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Support & Help</Text>
          </View>

          {/* AI Assistant Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI Assistant</Text>
            <Text style={styles.sectionDescription}>
              Get help with your questions or submit feature requests
            </Text>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => setShowAIModal(true)}
            >
              <MaterialIcons
                name="smart-toy"
                size={24}
                color={colors.primary}
              />
              <Text style={styles.aiButtonText}>Ask AI for Help</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Form Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send a Message to Us</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(value) => handleInputChange("name", value)}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setIsDropdownVisible(true)}
              >
                <Text style={styles.dropdownButtonText}>
                  {getFeedbackPurposeLabel(formData.feedbackPurpose)}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Feedback</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.feedback}
                onChangeText={(value) => handleInputChange("feedback", value)}
                placeholder="Please describe your issue or feedback..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                isCreatingFeedback && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitFeedback}
              disabled={isCreatingFeedback}
            >
              {isCreatingFeedback ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Social Media Section - Moved to bottom */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect With Us</Text>
            <View style={styles.socialGrid}>
              {socials.map((social, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.socialItem,
                    { backgroundColor: social.bgColor },
                  ]}
                  onPress={() => handleSocialPress(social.href)}
                >
                  <MaterialIcons
                    name={social.icon as keyof typeof MaterialIcons.glyphMap}
                    size={24}
                    color={colors.primary}
                  />
                  <Text style={styles.socialName}>{social.name}</Text>
                  <Text style={styles.socialUrl}>{social.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Dropdown Modal */}
          <Modal
            visible={isDropdownVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setIsDropdownVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsDropdownVisible(false)}
            >
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select Reason</Text>
                {feedbackOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      formData.feedbackPurpose === option.value &&
                        styles.modalOptionSelected,
                    ]}
                    onPress={() => handleDropdownSelect(option.value)}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.feedbackPurpose === option.value &&
                          styles.modalOptionTextSelected,
                      ]}
                    >
                      {option.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* AI Modal */}
          <Modal
            visible={showAIModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowAIModal(false)}
          >
            <KeyboardAvoidingView
              style={styles.modalOverlay}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
            >
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    Tell me a Feature request or issue you are facing
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAIModal(false)}
                    disabled={isAskingAI}
                  >
                    <MaterialIcons
                      name="close"
                      size={24}
                      color={isAskingAI ? colors.textSecondary : colors.text}
                    />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.modalInput}
                  value={aiQuestion}
                  onChangeText={setAiQuestion}
                  placeholder="Describe what you want AI to help with..."
                  placeholderTextColor={colors.textSecondary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!isAskingAI}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalButton}
                    onPress={() => setShowAIModal(false)}
                    disabled={isAskingAI}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.modalButtonPrimary,
                      isAskingAI && styles.modalButtonDisabled,
                    ]}
                    onPress={handleAskAI}
                    disabled={!aiQuestion.trim() || isAskingAI}
                  >
                    {isAskingAI ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.modalButtonTextPrimary}>Ask AI</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    safeContainer: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 20,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      marginRight: 16,
    },
    backButtonText: {
      fontSize: 16,
      color: colors.primary,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    section: {
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
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    aiButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "10",
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    aiButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.primary,
      marginLeft: 12,
    },
    socialGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    socialItem: {
      borderRadius: 12,
      padding: 16,
      width: "48%",
      minHeight: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    socialName: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginTop: 8,
      marginBottom: 4,
    },
    socialUrl: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: "center",
    },
    inputGroup: {
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
    textArea: {
      minHeight: 100,
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
    },
    dropdownArrow: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    submitButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      padding: 16,
      alignItems: "center",
      marginTop: 10,
    },
    submitButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    submitButtonText: {
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
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
      marginRight: 16,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      minHeight: 100,
      marginBottom: 20,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    modalButton: {
      flex: 1,
      borderRadius: 8,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    modalButtonPrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modalButtonDisabled: {
      backgroundColor: colors.textSecondary,
      borderColor: colors.textSecondary,
    },
    modalButtonText: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
    },
    modalButtonTextPrimary: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
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
