import { API_CONFIG } from "@/config/api";
import { secureStorage } from "./secureStorage";
import { Chat, ChatMessage, Author } from "@/store/slices/chatSlice";

class ChatService {
  private baseURL = `${API_CONFIG.API_BASE_URL}/chats`;

  private async getAuthHeaders() {
    const authToken = await secureStorage.getItem("auth_token");
    const refreshToken = await secureStorage.getItem("refresh_token");

    if (!authToken || !refreshToken) {
      throw new Error("No authentication tokens found");
    }

    return {
      "Content-Type": "application/json",
      Authorization: `JWT ${authToken};;;;;${refreshToken}`,
    };
  }

  async createChat(
    participants: Author[],
    aiInitConversation = true
  ): Promise<Chat> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(this.baseURL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        participants,
        aiInitConversation,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create chat");
    }

    const data = await response.json();
    return data.chat;
  }

  async fetchChat(chatId: string): Promise<Chat> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseURL}/${chatId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch chat");
    }

    const data = await response.json();
    return data.chat;
  }

  async fetchLatestChat(): Promise<Chat | null> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await fetch(`${this.baseURL}/latest`, {
        method: "GET",
        headers,
      });

      if (response.status === 404) {
        // No latest chat exists, return null
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch latest chat");
      }

      const data = await response.json();
      return data.chat;
    } catch (error: any) {
      // Only return null for 404 errors, throw all other errors
      if (
        error.message?.includes("404") ||
        error.message?.includes("Not Found")
      ) {
        return null;
      }
      throw error;
    }
  }

  async fetchMessages(
    chatId: string,
    skip = 0,
    limit = 50
  ): Promise<ChatMessage[]> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(
      `${this.baseURL}/${chatId}/messages?skip=${skip}&limit=${limit}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch messages");
    }

    const data = await response.json();
    return data.messages;
  }

  async sendMessage(
    chatId: string,
    message: string,
    attachmentIds: string[] = [],
    refers?: string
  ): Promise<ChatMessage> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseURL}/${chatId}/messages`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        attachmentIds,
        refers,
        metadata: {},
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send message");
    }

    const data = await response.json();
    return data.message;
  }

  // Server-Sent Events for real-time updates
  async createMessageStream(
    chatId: string,
    streamId: string
  ): Promise<EventSource> {
    const authToken = await secureStorage.getItem("auth_token");
    const refreshToken = await secureStorage.getItem("refresh_token");

    if (!authToken || !refreshToken) {
      throw new Error("No authentication tokens found");
    }

    // For SSE, pass JWT token as query parameter since EventSource doesn't support custom headers
    const jwtToken = encodeURIComponent(`JWT ${authToken};;;;;${refreshToken}`);
    const url = `${this.baseURL}/${chatId}/messages/stream/${streamId}?authorization=${jwtToken}`;

    return new EventSource(url);
  }

  generateStreamId(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}

export const chatService = new ChatService();
