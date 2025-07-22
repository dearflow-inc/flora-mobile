import { ChatMessageAttachment } from "@/components/ChatMessageAttachment";
import { SuggestedAction } from "@/components/SuggestedAction";
import { AvailableTools, ToolCallDisplay } from "@/components/ToolCallDisplay";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { useTheme } from "@/hooks/useTheme";
import {
  AuthorType,
  ChatMessage,
  clearError,
  createChatAsync,
  fetchLatestChatAsync,
  fetchMessagesAsync,
  sendMessageAsync,
} from "@/store/slices/chatSlice";
import { ChatAttachment } from "@/types/attachment";
import { MaterialIcons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ChatViewProps {
  chatId?: string;
  showHeader?: boolean;
  onChatCreated?: (chatId: string) => void;
  onChatClosed?: () => void;
  autoCreateChat?: boolean;
  aiInitConversation?: boolean;
  offsetChat?: number;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chatId,
  showHeader = true,
  onChatCreated,
  onChatClosed,
  autoCreateChat = true,
  aiInitConversation = false,
  offsetChat = 60,
}) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const {
    currentChatId,
    currentChat,
    messages,
    isLoading,
    isCreatingChat,
    isSendingMessage,
    isLoadingMessages,
    aiIsWorking,
    error,
  } = useAppSelector((state) => state.chat);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [inputText, setInputText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const lastScrollY = useRef(0);
  const [isTouching, setIsTouching] = useState(false);

  // Check if chat is closed
  const isChatClosed = useMemo(
    () => currentChat?.state === "closed",
    [currentChat?.state]
  );

  const styles = createStyles(colors, isChatClosed, insets);

  useEffect(() => {
    // Initialize chat when component mounts
    if (chatId) {
      // If specific chatId is provided, load that chat
      dispatch(fetchMessagesAsync({ chatId }));
    } else if (autoCreateChat) {
      // Otherwise, initialize with latest or create new
      initializeChat();
    }
  }, [chatId, autoCreateChat]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isChatClosed) {
      timeout = setTimeout(() => {
        onChatClosed?.();
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [isChatClosed]);

  useEffect(() => {
    // Load messages when currentChatId changes
    if (currentChatId && !chatId) {
      dispatch(fetchMessagesAsync({ chatId: currentChatId }));
    }
  }, [currentChatId, chatId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Scroll to bottom when keyboard opens
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
    };
  }, []);

  const initializeChat = async () => {
    try {
      // First try to fetch the latest chat
      const result = await dispatch(fetchLatestChatAsync()).unwrap();

      if (!result) {
        // No latest chat found, create a new one
        await handleCreateNewChat();
      }
    } catch (error: any) {
      // Only create a new chat if it's a "no chat found" error
      if (
        error.message?.includes("404") ||
        error.message?.includes("Not Found")
      ) {
        await handleCreateNewChat();
      }
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error]);

  const handleCreateNewChat = async () => {
    if (!user?.authUserId) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    try {
      const result = await dispatch(
        createChatAsync({
          participants: [
            {
              type: AuthorType.VIRTUAL_ASSISTANT,
              externalId: "flora-general",
            },
          ],
          aiInitConversation,
        })
      ).unwrap();

      if (onChatCreated && result.id) {
        onChatCreated(result.id);
      }
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const sendMessage = async () => {
    const activeChatId = chatId || currentChatId;
    if (!inputText.trim() || !activeChatId) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      await dispatch(
        sendMessageAsync({
          chatId: activeChatId,
          message: messageText,
          attachmentIds: [],
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to send message:", error);
      setInputText(messageText); // Restore text on error
    }
  };

  const sendSuggestedAction = async (actionText: string) => {
    const activeChatId = chatId || currentChatId;
    if (!actionText.trim() || !activeChatId) return;

    try {
      await dispatch(
        sendMessageAsync({
          chatId: activeChatId,
          message: actionText.trim(),
          attachmentIds: [],
        })
      ).unwrap();
    } catch (error) {
      console.error("Failed to send suggested action:", error);
    }
  };

  const cleanMessageContent = (content: string): string => {
    // Remove system info prefix: /<-System Info ... System Info->/
    const systemInfoRegex = /\/<-System Info[\s\S]*?System Info->\//g;
    let cleaned = content
      .replace(systemInfoRegex, "")
      .replace(/【\d+:\d+†[^】]+】/g, "")
      .replace(/<#!INVISIBLE_PROMPT_THAT_THE_USER_CANT_SEE>*?<\/#!>/g, "")
      .trim();

    // Auto-linkify URLs that aren't already in Markdown link format
    cleaned = autoLinkify(cleaned);

    return cleaned;
  };

  const autoLinkify = (text: string): string => {
    // URL regex pattern that matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s<>\[\]]+)/g;

    // Markdown link regex to identify existing markdown links
    const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;

    // Find all existing markdown links to avoid double-linking
    const existingLinks: { start: number; end: number; url: string }[] = [];
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      existingLinks.push({
        start: match.index,
        end: match.index + match[0].length,
        url: match[2],
      });
    }

    // Replace URLs that aren't already part of markdown links
    return text.replace(urlRegex, (url, ...args) => {
      const urlStart = args[args.length - 2]; // offset argument
      const urlEnd = urlStart + url.length;

      // Check if this URL is already part of a markdown link
      const isAlreadyLinked = existingLinks.some(
        (link) => urlStart >= link.start && urlEnd <= link.end
      );

      if (isAlreadyLinked) {
        return url; // Don't modify URLs that are already in markdown links
      }

      // Convert plain URL to markdown link
      return `[${url}](${url})`;
    });
  };

  const copyToClipboard = (text: string) => {
    Clipboard.setString(text);
  };

  const handleAttachmentPress = (attachment: ChatAttachment) => {
    console.log("Attachment pressed:", attachment);
  };

  const onRefresh = async () => {
    if (!isTouching) return;
    const activeChatId = chatId || currentChatId;
    if (!activeChatId) return;

    setRefreshing(true);
    setPullDistance(0);
    try {
      await dispatch(fetchMessagesAsync({ chatId: activeChatId })).unwrap();
    } catch (error) {
      console.error("Failed to refresh messages:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleLinkPress = (url: string) => {
    // Open links in an in-app browser for better user experience
    WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
    }).catch(() => {
      // Fallback to system browser if WebBrowser fails
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "Cannot open this link");
        }
      });
    });
    return false; // Return false to prevent default handling
  };

  const getMarkdownStyles = (colors: any, isUser: boolean) => {
    const baseTextColor = isUser ? "#FFFFFF" : colors.text;
    return {
      body: {
        color: baseTextColor,
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 0,
      },
      paragraph: {
        marginBottom: 8,
        marginTop: 0,
        color: baseTextColor,
        fontSize: 16,
        lineHeight: 22,
      },
      text: {
        color: baseTextColor,
        fontSize: 16,
        lineHeight: 22,
      },
      strong: {
        color: baseTextColor,
        fontWeight: "bold" as const,
      },
      em: {
        color: baseTextColor,
        fontStyle: "italic" as const,
      },
      code_inline: {
        backgroundColor: isUser ? "rgba(255, 255, 255, 0.2)" : colors.surface,
        color: baseTextColor,
        padding: 2,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      },
      code_block: {
        backgroundColor: isUser ? "rgba(255, 255, 255, 0.2)" : colors.surface,
        color: baseTextColor,
        padding: 8,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        marginVertical: 4,
      },
      fence: {
        backgroundColor: isUser ? "rgba(255, 255, 255, 0.2)" : colors.surface,
        color: baseTextColor,
        padding: 8,
        borderRadius: 4,
        fontSize: 14,
        fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
        marginVertical: 4,
      },
      link: {
        color: isUser ? "#B3E5FC" : colors.primary,
        textDecorationLine: "underline" as const,
        fontWeight: "500" as const,
      },
      blockquote: {
        backgroundColor: isUser ? "rgba(255, 255, 255, 0.1)" : colors.surface,
        borderLeftWidth: 4,
        borderLeftColor: isUser ? "#B3E5FC" : colors.primary,
        paddingLeft: 12,
        paddingVertical: 8,
        marginVertical: 4,
        borderRadius: 4,
      },
      heading1: {
        color: baseTextColor,
        fontSize: 20,
        fontWeight: "bold" as const,
        marginBottom: 8,
        marginTop: 4,
      },
      heading2: {
        color: baseTextColor,
        fontSize: 18,
        fontWeight: "bold" as const,
        marginBottom: 6,
        marginTop: 4,
      },
      heading3: {
        color: baseTextColor,
        fontSize: 16,
        fontWeight: "bold" as const,
        marginBottom: 4,
        marginTop: 4,
      },
      list_item: {
        color: baseTextColor,
        fontSize: 16,
        lineHeight: 22,
        marginBottom: 2,
      },
      bullet_list: {
        marginVertical: 4,
      },
      ordered_list: {
        marginVertical: 4,
      },
    } as any;
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.message.author.type === AuthorType.PROFILE;
    const rawContent = item.message.content[0]?.body || "";
    const messageContent = cleanMessageContent(rawContent);
    const hasToolCalls =
      item.message.toolCalls && item.message.toolCalls.length > 0;
    const hasAttachments =
      item.message.attachments && item.message.attachments.length > 0;
    const hasSuggestedActions =
      item.message.suggestedActions && item.message.suggestedActions.length > 0;

    // Only show suggested actions for the latest message
    const sortedMessages = [...messages].sort(
      (a, b) =>
        new Date(a.message.createdAt).getTime() -
        new Date(b.message.createdAt).getTime()
    );
    const latestMessage = sortedMessages[sortedMessages.length - 1];
    const isLatestMessage = latestMessage && latestMessage.id === item.id;
    const shouldShowSuggestedActions = hasSuggestedActions && isLatestMessage;

    // If this is a bot message with only tool calls and no content, render just the tool calls
    if (
      !isUser &&
      hasToolCalls &&
      !messageContent.trim() &&
      !hasAttachments &&
      !shouldShowSuggestedActions
    ) {
      return (
        <View style={[styles.toolCallMessage]}>
          {item.message.toolCalls!.map((toolCall) => (
            <ToolCallDisplay
              key={toolCall.toolCallId}
              toolCall={toolCall}
              onPress={() => {
                console.log("Tool call pressed:", toolCall.type);
              }}
            />
          ))}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessage : styles.botMessage,
        ]}
      >
        {/* Render tool calls before message content for bot messages */}
        {!isUser && hasToolCalls && (
          <View style={styles.toolCallsContainer}>
            {item.message.toolCalls
              ?.filter(
                (call) =>
                  ![AvailableTools.SEND_MESSAGE_WITH_USER_ACTIONS].includes(
                    call.type as AvailableTools
                  )
              )!
              .map((toolCall) => (
                <ToolCallDisplay
                  key={toolCall.toolCallId}
                  toolCall={toolCall}
                  onPress={() => {}}
                />
              ))}
          </View>
        )}

        {/* Render message content if it exists */}
        {messageContent.trim() && (
          <View style={styles.messageTextContainer}>
            <Markdown
              style={getMarkdownStyles(colors, isUser)}
              onLinkPress={handleLinkPress}
            >
              {messageContent}
            </Markdown>
          </View>
        )}
        {/* Render attachments */}
        {hasAttachments && (
          <View style={styles.attachmentsContainer} key={item.id}>
            {item.message.attachments!.map((attachment, index) => (
              <ChatMessageAttachment
                key={attachment.id + index}
                attachment={attachment}
                onPress={handleAttachmentPress}
              />
            ))}
          </View>
        )}

        {/* Render suggested actions */}
        <View style={styles.suggestedActionsContainer}>
          {item.message.suggestedActions!.map((action, index) => (
            <SuggestedAction
              key={action.id + index}
              chatId={chatId || currentChatId!}
              chatMessageId={item.id}
              action={action}
              onSetChatInput={setInputText}
              onSendSuggestedAction={sendSuggestedAction}
              disabled={action.complete}
              shouldShowSuggestedActions={shouldShowSuggestedActions}
            />
          ))}
        </View>
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
            {new Date(item.message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => copyToClipboard(messageContent)}
          >
            <MaterialIcons
              name="content-copy"
              size={14}
              color={isUser ? "#E0E0E0" : "#999999"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isCreatingChat) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Creating new chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {isLoadingMessages ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={[...messages].sort(
            (a, b) =>
              new Date(a.message.createdAt).getTime() -
              new Date(b.message.createdAt).getTime()
          )}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          // Remove flex: 1 from here
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          onTouchStart={() => setIsTouching(true)}
          onTouchEnd={() => setIsTouching(false)}
          onScroll={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            const currentScrollY = contentOffset.y;
            const maxScrollY = contentSize.height - layoutMeasurement.height;
            const isAtEnd = currentScrollY >= maxScrollY - 10;

            setIsAtBottom(isAtEnd);

            // Detect pull-up gesture when at bottom
            if (isAtEnd && !refreshing) {
              const overscroll = currentScrollY - maxScrollY;
              if (overscroll > 0) {
                setPullDistance(overscroll);

                // Trigger refresh if pulled enough and finger is still down
                if (overscroll > 150 && pullDistance >= 150 && isTouching) {
                  onRefresh();
                }
              }

              if (overscroll <= 0) {
                setPullDistance(0);
              }
            } else {
              setPullDistance(0);
            }

            lastScrollY.current = currentScrollY;
          }}
          onScrollEndDrag={(event) => {
            const { contentOffset, contentSize, layoutMeasurement } =
              event.nativeEvent;
            const currentScrollY = contentOffset.y;
            const maxScrollY = contentSize.height - layoutMeasurement.height;
            const isAtEnd = currentScrollY >= maxScrollY - 10;

            setIsAtBottom(isAtEnd);

            // Reset pull distance when scroll ends
            if (isAtEnd && !refreshing) {
              const overscroll = currentScrollY - maxScrollY;
              if (overscroll <= 0) {
                setPullDistance(0);
              }
            } else {
              setPullDistance(0);
            }

            lastScrollY.current = currentScrollY;
          }}
          scrollEventThrottle={16}
          bounces={true}
        />
      )}

      {refreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.refreshText}>Refreshing messages...</Text>
        </View>
      )}

      {pullDistance > 50 && !refreshing && isTouching && (
        <View style={styles.pullIndicator}>
          <Text style={styles.pullText}>
            {pullDistance > 100 ? "Release to refresh" : "Pull up to refresh"}
          </Text>
        </View>
      )}

      {aiIsWorking && (
        <View style={styles.aiWorkingIndicator}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.aiWorkingText}>Flora is thinking...</Text>
        </View>
      )}

      {isChatClosed ? (
        <View style={styles.chatClosedContainer}>
          <Text style={styles.chatClosedText}>Chat closed</Text>
          <TouchableOpacity
            style={styles.openNewChatButton}
            onPress={handleCreateNewChat}
            activeOpacity={0.7}
          >
            <Text style={styles.openNewChatButtonText}>Open new Chat?</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            multiline
            maxLength={500}
            editable={!isSendingMessage}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSendingMessage) &&
                styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isSendingMessage}
          >
            {isSendingMessage ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <MaterialIcons
                name="send"
                size={24}
                color={inputText.trim() ? "#007AFF" : "#CCCCCC"}
              />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any, isChatClosed: boolean, insets: any) =>
  StyleSheet.create({
    chatContainer: {
      flex: 1,
      justifyContent: "flex-start",
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
    messagesList: {
      flex: 1,
    },
    messagesContainer: {
      padding: 16,
      paddingBottom: 32, // Add extra bottom padding for better spacing from input
    },
    messageContainer: {
      maxWidth: "80%",
      marginBottom: 16,
      padding: 12,
      borderRadius: 16,
    },
    userMessage: {
      alignSelf: "flex-end",
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    toolCallMessage: {
      alignSelf: "flex-start",
      borderBottomLeftRadius: 4,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
      marginBottom: 16,
    },
    botMessage: {
      alignSelf: "flex-start",
      backgroundColor: colors.surface,
      borderBottomLeftRadius: 4,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    messageTextContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      width: "100%",
    },
    messageText: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 22,
      flex: 1,
      marginRight: 8,
    },
    userMessageText: {
      color: "#FFFFFF",
    },
    copyButton: {
      padding: 4,
      marginTop: -2,
    },
    timestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    userTimestamp: {
      color: "#E0E0E0",
    },
    toolCallsContainer: {
      marginBottom: 8,
    },
    attachmentsContainer: {
      marginTop: 8,
    },
    suggestedActionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 8,
    },
    messageFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    refreshIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary + "1A",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    refreshText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.primary,
    },
    pullIndicator: {
      position: "absolute",
      bottom: isChatClosed
        ? 80 + Math.max(0, insets.bottom - 30)
        : 60 + Math.max(0, insets.bottom - 30), // Normal positioning
      left: 0,
      right: 0,
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary + "1A",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      zIndex: 10,
    },
    pullText: {
      fontSize: 14,
      color: colors.primary,
    },
    aiWorkingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.primary + "1A",
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    aiWorkingText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.primary,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "flex-end",
      padding: 8,
      paddingBottom: 8 + Math.max(0, insets.bottom - 30), // Normal bottom padding when keyboard is closed
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      minHeight: 44,
      // Remove negative marginBottom to fix positioning issues
    },
    textInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 16,
      maxHeight: 100,
      backgroundColor: colors.background,
      color: colors.text,
    },
    sendButton: {
      marginLeft: 8,
      padding: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    chatClosedContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      paddingBottom: 16 + Math.max(0, insets.bottom - 30), // Normal bottom padding when keyboard is closed
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    chatClosedText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginRight: 16,
    },
    openNewChatButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    openNewChatButtonText: {
      fontSize: 16,
      color: "#FFFFFF",
      fontWeight: "500",
    },
  });
