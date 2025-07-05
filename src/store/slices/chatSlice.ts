import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { chatService } from "@/services/chatService";
import { ChatAttachment } from "@/types/attachment";
import { ChatMessageSuggestedAction } from "@/types/suggestedAction";

export enum AuthorType {
  PROFILE = "profile",
  VIRTUAL_ASSISTANT = "virtual_assistant",
  SYSTEM = "system",
  CONTACT = "contact",
}

// Types based on the backend schemas
export interface Author {
  type: AuthorType;
  externalId: string;
  meta?: {
    name?: string;
    email?: string;
    avatar?: string;
  };
}

export interface MessageContent {
  body: string;
  type: "text/html" | "text/plain";
}

export interface MessageToolCall {
  type: string;
  arguments: any;
  toolCallId: string;
  result?: {
    success?: boolean;
    error?: string;
    [key: string]: any;
  };
}

export interface ChatMessage {
  id: string;
  chat: string;
  dfOwner?: Author;
  refers?: string;
  message: {
    id: string;
    author: Author;
    content: MessageContent[];
    createdAt: string;
    suggestedActions?: ChatMessageSuggestedAction[];
    toolCalls?: MessageToolCall[];
    attachments?: ChatAttachment[];
  };
  read: Author[];
  suggestedActions?: ChatMessageSuggestedAction[];
}

export interface Chat {
  id: string;
  threadId: string;
  members: any[];
  creator: Author;
  createdAt: string;
  state: "active" | "closed";
  latestMessage?: ChatMessage;
  aiIsWorking?: boolean;
}

export interface ChatState {
  currentChatId: string | null;
  currentChat: Chat | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isCreatingChat: boolean;
  isSendingMessage: boolean;
  isLoadingMessages: boolean;
  aiIsWorking: boolean;
  error: string | null;
  streamId: string | null;
}

const initialState: ChatState = {
  currentChatId: null,
  currentChat: null,
  messages: [],
  isLoading: false,
  isCreatingChat: false,
  isSendingMessage: false,
  isLoadingMessages: false,
  aiIsWorking: false,
  error: null,
  streamId: null,
};

// Async thunks for API calls
export const createChatAsync = createAsyncThunk<
  Chat,
  { participants: Author[]; aiInitConversation?: boolean },
  { rejectValue: string }
>("chat/createChat", async (params, { rejectWithValue }) => {
  try {
    return await chatService.createChat(
      params.participants,
      params.aiInitConversation
    );
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create chat");
  }
});

export const fetchChatAsync = createAsyncThunk<
  Chat,
  string,
  { rejectValue: string }
>("chat/fetchChat", async (chatId, { rejectWithValue }) => {
  try {
    return await chatService.fetchChat(chatId);
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch chat");
  }
});

export const fetchLatestChatAsync = createAsyncThunk<
  Chat | null,
  void,
  { rejectValue: string }
>("chat/fetchLatestChat", async (_, { rejectWithValue }) => {
  try {
    return await chatService.fetchLatestChat();
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch latest chat");
  }
});

export const fetchMessagesAsync = createAsyncThunk<
  ChatMessage[],
  { chatId: string; skip?: number; limit?: number },
  { rejectValue: string }
>("chat/fetchMessages", async (params, { rejectWithValue }) => {
  try {
    return await chatService.fetchMessages(
      params.chatId,
      params.skip,
      params.limit
    );
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch messages");
  }
});

export const sendMessageAsync = createAsyncThunk<
  ChatMessage,
  {
    chatId: string;
    message: string;
    attachmentIds?: string[];
    refers?: string;
  },
  { rejectValue: string }
>("chat/sendMessage", async (params, { rejectWithValue }) => {
  try {
    return await chatService.sendMessage(
      params.chatId,
      params.message,
      params.attachmentIds,
      params.refers
    );
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to send message");
  }
});

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentChat: (state) => {
      state.currentChatId = null;
      state.currentChat = null;
      state.messages = [];
      state.aiIsWorking = false;
      state.streamId = null;
    },
    setCurrentChatId: (state, action: PayloadAction<string>) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      // Check if message already exists to prevent duplicates
      const existingMessage = state.messages.find(
        (msg) => msg.id === action.payload.id
      );
      if (!existingMessage) {
        state.messages.push(action.payload);
      }
    },
    updateMessage: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<ChatMessage> }>
    ) => {
      const messageIndex = state.messages.findIndex(
        (msg) => msg.id === action.payload.id
      );
      if (messageIndex !== -1) {
        state.messages[messageIndex] = {
          ...state.messages[messageIndex],
          ...action.payload.updates,
        };
      }
    },
    completeSuggestedAction: (
      state,
      action: PayloadAction<{ messageId: string; actionId: string }>
    ) => {
      const messageIndex = state.messages.findIndex(
        (msg) => msg.id === action.payload.messageId
      );
      if (messageIndex !== -1) {
        const message = state.messages[messageIndex];
        if (message.message.suggestedActions) {
          const actionIndex = message.message.suggestedActions.findIndex(
            (suggestedAction) => suggestedAction.id === action.payload.actionId
          );
          if (actionIndex !== -1) {
            message.message.suggestedActions[actionIndex].complete = true;
          }
        }
      }
    },
    setAiIsWorking: (state, action: PayloadAction<boolean>) => {
      state.aiIsWorking = action.payload;
    },
    updateChat: (state, action: PayloadAction<Partial<Chat>>) => {
      if (state.currentChat) {
        state.currentChat = { ...state.currentChat, ...action.payload };
      }
      // Also update aiIsWorking state if it's provided
      if (action.payload.aiIsWorking !== undefined) {
        state.aiIsWorking = action.payload.aiIsWorking;
      }
    },
    setStreamId: (state, action: PayloadAction<string | null>) => {
      state.streamId = action.payload;
    },
    updateMessageDelta: (
      state,
      action: PayloadAction<{ messageId: string; delta: string }>
    ) => {
      const messageIndex = state.messages.findIndex(
        (msg) => msg.id === action.payload.messageId
      );
      if (messageIndex !== -1) {
        const currentContent =
          state.messages[messageIndex].message.content[0]?.body || "";
        state.messages[messageIndex].message.content[0] = {
          body: currentContent + action.payload.delta,
          type: "text/plain",
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Chat
      .addCase(createChatAsync.pending, (state) => {
        state.isCreatingChat = true;
        state.error = null;
      })
      .addCase(createChatAsync.fulfilled, (state, action) => {
        state.isCreatingChat = false;
        state.currentChat = action.payload;
        state.currentChatId = action.payload.id;
        state.messages = [];
        state.error = null;
      })
      .addCase(createChatAsync.rejected, (state, action) => {
        state.isCreatingChat = false;
        state.error = action.payload || "Failed to create chat";
      })
      // Fetch Chat
      .addCase(fetchChatAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChatAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentChat = action.payload;
        state.currentChatId = action.payload.id;
        state.error = null;
      })
      .addCase(fetchChatAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch chat";
      })
      // Fetch Latest Chat
      .addCase(fetchLatestChatAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLatestChatAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.currentChat = action.payload;
          state.currentChatId = action.payload.id;
        } else {
          // No latest chat found, will need to create one
          state.currentChat = null;
          state.currentChatId = null;
        }
        state.error = null;
      })
      .addCase(fetchLatestChatAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || "Failed to fetch latest chat";
      })
      // Fetch Messages
      .addCase(fetchMessagesAsync.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessagesAsync.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        state.messages = action.payload.reverse(); // Reverse to show newest at bottom
        state.error = null;
      })
      .addCase(fetchMessagesAsync.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.payload || "Failed to fetch messages";
      })
      // Send Message
      .addCase(sendMessageAsync.pending, (state) => {
        state.isSendingMessage = true;
        state.error = null;
      })
      .addCase(sendMessageAsync.fulfilled, (state, action) => {
        state.isSendingMessage = false;
        state.messages.push(action.payload);
        state.error = null;
      })
      .addCase(sendMessageAsync.rejected, (state, action) => {
        state.isSendingMessage = false;
        state.error = action.payload || "Failed to send message";
      });
  },
});

export const {
  clearError,
  clearCurrentChat,
  setCurrentChatId,
  addMessage,
  updateMessage,
  completeSuggestedAction,
  setAiIsWorking,
  updateChat,
  setStreamId,
  updateMessageDelta,
} = chatSlice.actions;

export default chatSlice.reducer;
