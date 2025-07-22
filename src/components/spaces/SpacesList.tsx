import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { CreateContextViewModal } from "@/components/scenarios/CreateContextViewModal";
import { useScenarios } from "@/hooks/useScenarios";
import { useTheme } from "@/hooks/useTheme";
import { ScenarioItem, TaskTypeWithComments } from "@/types/scenarios";
import { UserTaskType } from "@/types/userTask";

interface SpacesListProps {
  showHeader?: boolean;
  onBackPress?: () => void;
  showCreateButton?: boolean;
  style?: any;
  contentContainerStyle?: any;
}

export const SpacesList: React.FC<SpacesListProps> = ({
  showHeader = true,
  onBackPress,
  showCreateButton = true,
  style,
  contentContainerStyle,
}) => {
  const { colors } = useTheme();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedContextView, setSelectedContextView] = useState<string | null>(
    null
  );
  const [editingItem, setEditingItem] = useState<ScenarioItem | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [editedTaskTypes, setEditedTaskTypes] = useState<
    TaskTypeWithComments[]
  >([]);
  const [editedNotifyOnWhatsapp, setEditedNotifyOnWhatsapp] = useState(false);

  const {
    scenarios,
    contextViews,
    scenarioItems,
    loading,
    error,
    fetchScenarios,
    clearError,
    updateScenarioItem,
    deleteScenarioItem,
    deleteContextView,
    createScenarioItem,
  } = useScenarios();

  useEffect(() => {
    fetchScenarios();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      clearError();
    }
  }, [error, clearError]);

  // Group scenario items by context view
  const groupedItems = useMemo(() => {
    return scenarioItems.reduce((acc, item) => {
      if (!acc[item.targetContextViewId]) {
        acc[item.targetContextViewId] = [];
      }
      acc[item.targetContextViewId].push(item);
      return acc;
    }, {} as Record<string, ScenarioItem[]>);
  }, [scenarioItems]);

  // Auto-select first context view if none selected
  useEffect(() => {
    if (Object.keys(groupedItems).length > 0 && !selectedContextView) {
      const sortedContextViews = Object.entries(groupedItems).sort(
        ([a], [b]) => {
          const contextViewA = contextViews.find((view) => view.id === a);
          const contextViewB = contextViews.find((view) => view.id === b);
          return (
            (contextViewB?.importance || 0) - (contextViewA?.importance || 0)
          );
        }
      );
      setSelectedContextView(sortedContextViews[0][0]);
    }
  }, [groupedItems, contextViews]);

  const handleRefresh = () => {
    fetchScenarios();
  };

  const handleCreateSuccess = () => {
    fetchScenarios();
  };

  const handleEditItem = (item: ScenarioItem) => {
    setEditingItem(item);
    setEditedPrompt(item.classificationPrompt || "");
    setEditedTaskTypes(item.targetTaskTypes || []);
    setEditedNotifyOnWhatsapp(!!item.notifyOnWhatsapp);
  };

  const handleSaveEdit = async () => {
    if (editingItem) {
      try {
        await updateScenarioItem(editingItem.id, {
          classificationPrompt: editedPrompt,
          targetTaskTypes: editedTaskTypes,
          notifyOnWhatsapp: editedNotifyOnWhatsapp,
        });
        setEditingItem(null);
      } catch (error) {
        Alert.alert("Error", "Failed to update scenario item");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleDeleteItem = async (item: ScenarioItem) => {
    Alert.alert(
      "Delete Scenario Item",
      "Are you sure you want to delete this scenario item?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteScenarioItem(item.id);
            } catch (error) {
              Alert.alert("Error", "Failed to delete scenario item");
            }
          },
        },
      ]
    );
  };

  const handleDeleteContextView = async (contextViewId: string) => {
    Alert.alert(
      "Delete Context View",
      "Are you sure you want to delete this context view? This will also delete all associated scenario items.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteContextView(contextViewId);
              if (selectedContextView === contextViewId) {
                setSelectedContextView(null);
              }
            } catch (error) {
              Alert.alert("Error", "Failed to delete context view");
            }
          },
        },
      ]
    );
  };

  const handleCreateScenarioItem = async (contextViewId: string) => {
    try {
      await createScenarioItem({
        create: {
          systemReferenceType: "custom",
          name: "New Scenario Item",
          classificationPrompt: "",
        },
        targetContextViewId: contextViewId,
        targetImportance: 50,
        targetTaskTypes: [],
        targetTags: [],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create scenario item");
    }
  };

  const handleAddTaskType = (taskType: UserTaskType) => {
    if (!editedTaskTypes.some((t) => t.type === taskType)) {
      setEditedTaskTypes([...editedTaskTypes, { type: taskType }]);
    }
  };

  const handleRemoveTaskType = (taskTypeToRemove: UserTaskType) => {
    setEditedTaskTypes(
      editedTaskTypes.filter((t) => t.type !== taskTypeToRemove)
    );
  };

  const availableTaskTypes = Object.values(UserTaskType).filter(
    (type) =>
      ![
        UserTaskType.DELETE_INCOMPLETE_TASKS,
        UserTaskType.CONTACT_EMAIL_ADDRESS_UNSUBSCRIBE,
      ].includes(type)
  );

  const styles = createStyles(colors);

  if (loading && !scenarios) {
    return (
      <View style={[styles.container, style]}>
        {showHeader && (
          <View style={styles.header}>
            {onBackPress && (
              <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                <MaterialIcons
                  name="arrow-back"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Customise Spaces</Text>
            <View style={styles.placeholder} />
          </View>
        )}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading scenarios...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      {showHeader && (
        <View style={styles.header}>
          {onBackPress && (
            <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Customise Spaces</Text>
            <Text style={styles.headerSubtitle}>
              To create a new Space or Scenario ask Flora to help you.
            </Text>
          </View>
          {showCreateButton && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateModal(true)}
            >
              <MaterialIcons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={contentContainerStyle}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {contextViews.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No spaces so far.</Text>
            <Text style={styles.emptyStateSubtext}>
              Ask Flora to create a new space to get started.
            </Text>
          </View>
        ) : (
          <View style={styles.content}>
            {contextViews
              .sort((a, b) => (b.importance || 0) - (a.importance || 0))
              .map((contextView) => {
                const items = groupedItems[contextView.id] || [];
                const isOpen = selectedContextView === contextView.id;

                return (
                  <View
                    key={contextView.id}
                    style={styles.contextViewContainer}
                  >
                    {/* Context View Header */}
                    <TouchableOpacity
                      style={[
                        styles.contextViewHeader,
                        isOpen && styles.contextViewHeaderOpen,
                      ]}
                      onPress={() =>
                        setSelectedContextView(isOpen ? null : contextView.id)
                      }
                    >
                      <View style={styles.contextViewHeaderLeft}>
                        <MaterialIcons
                          name="chevron-right"
                          size={20}
                          color={colors.text}
                          style={[
                            styles.chevronIcon,
                            isOpen && styles.chevronIconOpen,
                          ]}
                        />
                        <View
                          style={[
                            styles.colorIndicator,
                            { backgroundColor: contextView.background },
                          ]}
                        />
                        <View style={styles.contextViewInfo}>
                          <Text
                            style={[
                              styles.contextViewName,
                              isOpen && styles.contextViewNameOpen,
                            ]}
                          >
                            {contextView.name}
                          </Text>
                          <Text
                            style={styles.contextViewDescription}
                            numberOfLines={1}
                          >
                            {contextView.description}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.contextViewActions}>
                        {isOpen && showCreateButton && (
                          <TouchableOpacity
                            style={styles.addItemButton}
                            onPress={() =>
                              handleCreateScenarioItem(contextView.id)
                            }
                          >
                            <MaterialIcons
                              name="add"
                              size={20}
                              color={colors.primary}
                            />
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() =>
                            handleDeleteContextView(contextView.id)
                          }
                        >
                          <MaterialIcons
                            name="delete"
                            size={20}
                            color={colors.danger}
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>

                    {/* Context View Content */}
                    {isOpen && (
                      <View style={styles.contextViewContent}>
                        {items.length === 0 ? (
                          <Text style={styles.emptyItemsText}>
                            No items in this context
                          </Text>
                        ) : (
                          items.map((item) => (
                            <View key={item.id} style={styles.scenarioItem}>
                              {editingItem?.id === item.id ? (
                                // Edit Mode
                                <View style={styles.editMode}>
                                  <TextInput
                                    style={styles.promptInput}
                                    value={editedPrompt}
                                    onChangeText={setEditedPrompt}
                                    placeholder="Enter classification prompt..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                  />

                                  {/* Task Types */}
                                  <View style={styles.taskTypesSection}>
                                    <Text style={styles.taskTypesLabel}>
                                      Task Types:
                                    </Text>
                                    <View style={styles.taskTypesContainer}>
                                      {editedTaskTypes.map(
                                        (taskType, index) => (
                                          <View
                                            key={index}
                                            style={styles.taskTypeChip}
                                          >
                                            <Text style={styles.taskTypeText}>
                                              {taskType.type}
                                            </Text>
                                            <TouchableOpacity
                                              onPress={() =>
                                                handleRemoveTaskType(
                                                  taskType.type
                                                )
                                              }
                                            >
                                              <MaterialIcons
                                                name="close"
                                                size={16}
                                                color={colors.textSecondary}
                                              />
                                            </TouchableOpacity>
                                          </View>
                                        )
                                      )}
                                      <TouchableOpacity
                                        style={styles.addTaskTypeButton}
                                        onPress={() => {
                                          Alert.alert(
                                            "Add Task Type",
                                            "Select a task type:",
                                            availableTaskTypes
                                              .filter(
                                                (type) =>
                                                  !editedTaskTypes.some(
                                                    (t) => t.type === type
                                                  )
                                              )
                                              .map((type) => ({
                                                text: type,
                                                onPress: () =>
                                                  handleAddTaskType(type),
                                              }))
                                          );
                                        }}
                                      >
                                        <MaterialIcons
                                          name="add"
                                          size={16}
                                          color={colors.primary}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  {/* Notification Toggle */}
                                  <View style={styles.notificationToggle}>
                                    <Text style={styles.notificationLabel}>
                                      Enable Notifications
                                    </Text>
                                    <Switch
                                      value={editedNotifyOnWhatsapp}
                                      onValueChange={setEditedNotifyOnWhatsapp}
                                      trackColor={{
                                        false: colors.border,
                                        true: colors.primary,
                                      }}
                                      thumbColor={colors.surface}
                                    />
                                  </View>

                                  {/* Edit Actions */}
                                  <View style={styles.editActions}>
                                    <TouchableOpacity
                                      style={styles.saveButton}
                                      onPress={handleSaveEdit}
                                    >
                                      <MaterialIcons
                                        name="check"
                                        size={20}
                                        color={colors.text}
                                      />
                                      <Text style={styles.saveButtonText}>
                                        Save
                                      </Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      style={styles.cancelButton}
                                      onPress={handleCancelEdit}
                                    >
                                      <MaterialIcons
                                        name="close"
                                        size={20}
                                        color={colors.textSecondary}
                                      />
                                      <Text style={styles.cancelButtonText}>
                                        Cancel
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              ) : (
                                // View Mode
                                <View style={styles.viewMode}>
                                  <View style={styles.itemHeader}>
                                    <Text style={styles.itemName}>
                                      {item.name}
                                    </Text>
                                    <View style={styles.itemActions}>
                                      <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleEditItem(item)}
                                      >
                                        <MaterialIcons
                                          name="edit"
                                          size={18}
                                          color={colors.primary}
                                        />
                                      </TouchableOpacity>
                                      <TouchableOpacity
                                        style={styles.actionButton}
                                        onPress={() => handleDeleteItem(item)}
                                      >
                                        <MaterialIcons
                                          name="delete"
                                          size={18}
                                          color={colors.danger}
                                        />
                                      </TouchableOpacity>
                                    </View>
                                  </View>

                                  {item.classificationPrompt && (
                                    <Text style={styles.itemPrompt}>
                                      {item.classificationPrompt}
                                    </Text>
                                  )}

                                  <View style={styles.itemDetails}>
                                    {item.notifyOnWhatsapp && (
                                      <View
                                        style={styles.notificationIndicator}
                                      >
                                        <MaterialIcons
                                          name="notifications"
                                          size={16}
                                          color={colors.success}
                                        />
                                        <Text style={styles.notificationText}>
                                          Notification
                                        </Text>
                                      </View>
                                    )}
                                    {item.targetTaskTypes &&
                                      item.targetTaskTypes.length > 0 && (
                                        <View style={styles.taskTypesDisplay}>
                                          {item.targetTaskTypes.map(
                                            (taskType, index) => (
                                              <View
                                                key={index}
                                                style={
                                                  styles.taskTypeDisplayChip
                                                }
                                              >
                                                <Text
                                                  style={
                                                    styles.taskTypeDisplayText
                                                  }
                                                >
                                                  {taskType.type}
                                                </Text>
                                              </View>
                                            )
                                          )}
                                        </View>
                                      )}
                                  </View>
                                </View>
                              )}
                            </View>
                          ))
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        )}
      </ScrollView>

      <CreateContextViewModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </View>
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
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    placeholder: {
      width: 32,
    },
    addButton: {
      padding: 8,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      fontSize: 16,
      color: colors.text,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.text,
      marginBottom: 8,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
    content: {
      padding: 16,
    },
    contextViewContainer: {
      marginBottom: 8,
    },
    contextViewHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    contextViewHeaderOpen: {
      backgroundColor: colors.primary + "10",
      borderColor: colors.primary,
    },
    contextViewHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    chevronIcon: {
      marginRight: 8,
      transform: [{ rotate: "0deg" }],
    },
    chevronIconOpen: {
      transform: [{ rotate: "90deg" }],
    },
    colorIndicator: {
      width: 20,
      height: 20,
      borderRadius: 10,
      marginRight: 12,
    },
    contextViewInfo: {
      flex: 1,
    },
    contextViewName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    contextViewNameOpen: {
      fontWeight: "700",
    },
    contextViewDescription: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    contextViewActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    addItemButton: {
      padding: 8,
      marginRight: 8,
    },
    deleteButton: {
      padding: 8,
    },
    contextViewContent: {
      paddingTop: 12,
      paddingLeft: 40,
    },
    emptyItemsText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    scenarioItem: {
      marginBottom: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    viewMode: {
      padding: 16,
    },
    itemHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    itemName: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      flex: 1,
    },
    itemActions: {
      flexDirection: "row",
    },
    actionButton: {
      padding: 4,
      marginLeft: 8,
    },
    itemPrompt: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 20,
    },
    itemDetails: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    notificationIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.success + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    notificationText: {
      fontSize: 12,
      color: colors.success,
      marginLeft: 4,
    },
    taskTypesDisplay: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 4,
    },
    taskTypeDisplayChip: {
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    taskTypeDisplayText: {
      fontSize: 12,
      color: colors.primary,
    },
    editMode: {
      padding: 16,
    },
    promptInput: {
      fontSize: 14,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
      minHeight: 80,
      textAlignVertical: "top",
    },
    taskTypesSection: {
      marginBottom: 12,
    },
    taskTypesLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    taskTypesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      alignItems: "center",
    },
    taskTypeChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "20",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    taskTypeText: {
      fontSize: 12,
      color: colors.primary,
      marginRight: 4,
    },
    addTaskTypeButton: {
      backgroundColor: colors.border,
      padding: 8,
      borderRadius: 12,
    },
    notificationToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    notificationLabel: {
      fontSize: 14,
      color: colors.text,
    },
    editActions: {
      flexDirection: "row",
      gap: 12,
    },
    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    saveButtonText: {
      color: colors.surface,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
    },
    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
    },
  });
