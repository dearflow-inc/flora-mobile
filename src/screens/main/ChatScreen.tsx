import { ChatView } from "@/components/ChatView";
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
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export const ChatScreen = () => {
  const dispatch = useAppDispatch();
  const { connected: wsConnected } = useWebSocket();
  const { colors } = useTheme();
  const { currentProfile } = useAppSelector((state) => state.profile);

  const [isMenuModalVisible, setIsMenuModalVisible] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../../assets/images/icon.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Flora</Text>
        </View>
        <View style={styles.headerRight}>
          {wsConnected && <View style={styles.connectionDot} />}
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsMenuModalVisible(true)}
          >
            <MaterialIcons name="more-vert" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ChatView aiInitConversation={true} />

      {/* Menu Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isMenuModalVisible}
        onRequestClose={() => setIsMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setIsMenuModalVisible(false);
                handleClearChat();
              }}
            >
              <MaterialIcons name="cleaning-services" size={24} color="#333" />
              <Text style={styles.menuOptionText}>Clear Chat</Text>
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
  });
