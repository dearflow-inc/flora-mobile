import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { MessageToolCall } from "@/store/slices/chatSlice";

// Available tools enum (simplified version from webapp)
export enum AvailableTools {
  CONTINUE_THOUGHT = "continue_thought",
  CLOSE_CHAT = "close_chat",
  CREATE_CONTACT = "create_contact",
  SEARCH_CONTACTS = "search_contacts",
  READ_CONTACTS = "read_contacts",
  UPDATE_CONTACT = "update_contact",
  DELETE_CONTACT = "delete_contact",
  SEARCH_EMAILS = "search_emails",
  CREATE_TODO = "create_todo",
  READ_TODOS = "read_todos",
  UPDATE_TODO = "update_todo",
  DRAFT_EMAIL = "draft_email",
  ROUTE_USER_INTERFACE = "route_user_interface",
  SCRAPE_WEBSITE = "scrape_website",
  SEND_MESSAGE_WITH_USER_ACTIONS = "send_message_with_user_actions",
  // Add more tools as needed
}

// Tool display configuration
export const AvailableToolsDisplay: {
  [key in AvailableTools]: {
    message: (args: any, result?: any) => string;
    icon?: string;
  };
} = {
  [AvailableTools.CONTINUE_THOUGHT]: {
    message: () => "Continuing my thought...",
    icon: "psychology",
  },
  [AvailableTools.CLOSE_CHAT]: {
    message: () => "Closing chat session",
    icon: "close",
  },
  [AvailableTools.CREATE_CONTACT]: {
    message: () => "Creating a new contact",
    icon: "person-add",
  },
  [AvailableTools.READ_CONTACTS]: {
    message: () => "Searching your contacts",
    icon: "contacts",
  },
  [AvailableTools.SEARCH_CONTACTS]: {
    message: () => "Searching through your contacts",
    icon: "search",
  },
  [AvailableTools.UPDATE_CONTACT]: {
    message: () => "Updating contact information",
    icon: "edit",
  },
  [AvailableTools.DELETE_CONTACT]: {
    message: () => "Deleting contact",
    icon: "delete",
  },
  [AvailableTools.SEARCH_EMAILS]: {
    message: (args: any) => {
      const { searchParams } = args;
      const queryParts: string[] = [];
      if (searchParams?.from) {
        queryParts.push(`from:${searchParams.from}`);
      }
      if (searchParams?.to) {
        queryParts.push(`to:${searchParams.to}`);
      }
      if (searchParams?.subject) {
        queryParts.push(`subject:${searchParams.subject}`);
      }
      if (searchParams?.body) {
        queryParts.push(searchParams.body);
      }
      return `Searching your emails: ${queryParts.join(" ")}`;
    },
    icon: "email",
  },
  [AvailableTools.CREATE_TODO]: {
    message: (args: any) => {
      const deadline = args.deadline
        ? new Date(args.deadline).toLocaleDateString()
        : "";
      return `Creating a new todo "${args.title}"${
        deadline ? ` for ${deadline}` : ""
      }`;
    },
    icon: "check-circle",
  },
  [AvailableTools.READ_TODOS]: {
    message: () => "Reading your todos...",
    icon: "list",
  },
  [AvailableTools.UPDATE_TODO]: {
    message: () => "Updating todo...",
    icon: "edit",
  },
  [AvailableTools.DRAFT_EMAIL]: {
    message: () => "Drafting an email...",
    icon: "drafts",
  },
  [AvailableTools.ROUTE_USER_INTERFACE]: {
    message: (args: any) => `Opening ${args.route?.split("?")[0] || "page"}`,
    icon: "open-in-new",
  },
  [AvailableTools.SCRAPE_WEBSITE]: {
    message: () => "Scraping website...",
    icon: "web",
  },
  [AvailableTools.SEND_MESSAGE_WITH_USER_ACTIONS]: {
    message: () => "Suggesting actions...",
    icon: "auto-awesome",
  },
};

interface ToolCallDisplayProps {
  toolCall: MessageToolCall;
  onPress?: () => void;
}

export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({
  toolCall,
  onPress,
}) => {
  const toolConfig = AvailableToolsDisplay[toolCall.type as AvailableTools];

  if (!toolConfig) {
    // Create a fallback display for unknown tool types
    const fallbackMessage = toolCall.type.replace(/_/g, " ").toLowerCase();
    return (
      <TouchableOpacity
        style={[styles.toolCallContainer, { backgroundColor: "#FFE5E5" }]} // Debug: orange background
        onPress={onPress}
        disabled={!onPress}
      >
        <View style={styles.toolCallContent}>
          <Text style={[styles.toolCallText]}>{fallbackMessage}</Text>
        </View>
        <View style={styles.toolCallStatus}>
          {toolCall.result?.success && (
            <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
          )}
          {toolCall.result && !toolCall.result?.success && (
            <MaterialIcons name="error" size={16} color="#F44336" />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const message = toolConfig.message(toolCall.arguments, toolCall.result);
  return (
    <View
      style={[styles.toolCallContainer, { backgroundColor: "#cdcdcd" }]} // Debug: red background
    >
      <View style={styles.toolCallContent}>
        <Text style={[styles.toolCallText]}>{message}</Text>
      </View>
      <View style={styles.toolCallStatus}>
        {toolCall.result?.success && (
          <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
        )}
        {toolCall.result && !toolCall.result?.success && (
          <MaterialIcons name="error" size={16} color="#F44336" />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolCallContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginVertical: 2,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
    width: "100%",
  },
  toolCallContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toolCallIcon: {
    marginRight: 8,
  },
  toolCallText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  toolCallStatus: {
    marginLeft: 8,
  },
});
