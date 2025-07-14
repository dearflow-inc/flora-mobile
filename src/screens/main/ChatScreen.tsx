import { ChatView } from "@/components/ChatView";
import { WebSocketStatusIndicator } from "@/components/WebSocketStatusIndicator";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  AuthorType,
  clearChatAndCreateNewAsync,
} from "@/store/slices/chatSlice";
import { MaterialIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export const ChatScreen = () => {
  const dispatch = useAppDispatch();
  const { connected: wsConnected } = useWebSocket();
  const { colors } = useTheme();
  const { currentProfile } = useAppSelector((state) => state.profile);

  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  const styles = createStyles(colors);

  const handleClearChat = async () => {
    if (!currentProfile) {
      console.error("No current profile available");
      return;
    }

    // Create participants array with current user and virtual assistant
    const participants = [
      {
        type: AuthorType.VIRTUAL_ASSISTANT,
        externalId: "flora-general",
        meta: {
          name: "Flora",
        },
      },
    ];

    try {
      await dispatch(
        clearChatAndCreateNewAsync({
          participants,
          aiInitConversation: true,
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to clear chat and create new:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../../assets/images/flora.png")}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Flora</Text>
            <Text style={styles.headerSubtitle}>
              {wsConnected ? "Connected" : "Connecting..."}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowDebugInfo(!showDebugInfo)}
          >
            <MaterialIcons
              name="info-outline"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsMenuModalVisible(true)}
          >
            <MaterialIcons
              name="more-vert"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Debug info panel */}
      {showDebugInfo && (
        <View style={styles.debugPanel}>
          <WebSocketStatusIndicator showDetails={true} />
        </View>
      )}

      <ChatView
        offsetChat={60}
        autoCreateChat={true}
        aiInitConversation={true}
      />

      {/* Menu Modal */}
      <Modal
        visible={isMenuModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.menuItem} onPress={handleClearChat}>
              <MaterialIcons
                name="clear"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.menuItemText}>Clear Chat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
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
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    avatar: {
      width: 32,
      height: 32,
      marginRight: 12,
      borderRadius: 16,
    },
    headerInfo: {
      flexDirection: "column",
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    debugPanel: {
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logo: {
      width: 32,
      height: 32,
      marginRight: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    headerButton: {
      padding: 4,
      marginLeft: 8,
    },
    connectionDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#4CAF50",
      marginRight: 12,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
      paddingTop: 100,
      paddingRight: 20,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      minWidth: 150,
    },
    menuOption: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuOptionText: {
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
    },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuItemText: {
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
    },
  });
