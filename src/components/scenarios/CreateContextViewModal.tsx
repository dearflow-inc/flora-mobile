import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useScenarios } from "@/hooks/useScenarios";
import { useTheme } from "@/hooks/useTheme";
import { CreateContextViewRequest } from "@/types/scenarios";

interface CreateContextViewModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateContextViewModal: React.FC<CreateContextViewModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useTheme();
  const {
    createContextView,
    contextViewsLoading,
    contextViewsError,
    clearContextViewsError,
  } = useScenarios();

  const [formData, setFormData] = useState<CreateContextViewRequest>({
    name: "",
    description: "",
    importance: 1,
    textColor: "#FFFFFF",
    backgroundColor: "#007AFF",
  });

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!formData.description.trim()) {
      Alert.alert("Error", "Description is required");
      return;
    }

    try {
      await createContextView(formData);
      Alert.alert("Success", "Context view created successfully");
      setFormData({
        name: "",
        description: "",
        importance: 1,
        textColor: "#FFFFFF",
        backgroundColor: "#007AFF",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating context view:", error);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      importance: 1,
      textColor: "#FFFFFF",
      backgroundColor: "#007AFF",
    });
    clearContextViewsError();
    onClose();
  };

  React.useEffect(() => {
    if (contextViewsError) {
      Alert.alert("Error", contextViewsError);
      clearContextViewsError();
    }
  }, [contextViewsError, clearContextViewsError]);

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Context View</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter context view name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Enter description"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Importance</Text>
            <View style={styles.importanceContainer}>
              {[1, 2, 3, 4, 5].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.importanceButton,
                    formData.importance === level &&
                      styles.importanceButtonActive,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, importance: level })
                  }
                >
                  <Text
                    style={[
                      styles.importanceText,
                      formData.importance === level &&
                        styles.importanceTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Colors</Text>
            <View style={styles.colorContainer}>
              <View style={styles.colorInput}>
                <Text style={styles.colorLabel}>Background</Text>
                <View style={styles.colorPreview}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: formData.backgroundColor },
                    ]}
                  />
                  <TextInput
                    style={styles.colorInputField}
                    value={formData.backgroundColor}
                    onChangeText={(text) =>
                      setFormData({ ...formData, backgroundColor: text })
                    }
                    placeholder="#007AFF"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
              <View style={styles.colorInput}>
                <Text style={styles.colorLabel}>Text</Text>
                <View style={styles.colorPreview}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: formData.textColor },
                    ]}
                  />
                  <TextInput
                    style={styles.colorInputField}
                    value={formData.textColor}
                    onChangeText={(text) =>
                      setFormData({ ...formData, textColor: text })
                    }
                    placeholder="#FFFFFF"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleCancel}
            disabled={contextViewsLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={contextViewsLoading}
          >
            {contextViewsLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>Create</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    closeButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    placeholder: {
      width: 32,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    formGroup: {
      marginBottom: 24,
    },
    label: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    textArea: {
      height: 80,
      textAlignVertical: "top",
    },
    importanceContainer: {
      flexDirection: "row",
      gap: 8,
    },
    importanceButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.surface,
    },
    importanceButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    importanceText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    importanceTextActive: {
      color: "#FFFFFF",
    },
    colorContainer: {
      gap: 16,
    },
    colorInput: {
      gap: 8,
    },
    colorLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    colorPreview: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    colorSwatch: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorInputField: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      padding: 8,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    footer: {
      flexDirection: "row",
      padding: 20,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitButton: {
      backgroundColor: colors.primary,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    submitButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  });
