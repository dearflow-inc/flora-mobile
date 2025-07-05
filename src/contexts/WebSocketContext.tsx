import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
  ReactNode,
} from "react";
import { Socket, io } from "socket.io-client";
import { AppState, AppStateStatus } from "react-native";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { API_CONFIG } from "@/config/api";
import {
  addMessage,
  updateMessage,
  setAiIsWorking,
  setCurrentChatId,
  updateChat,
  ChatMessage,
  Chat,
} from "@/store/slices/chatSlice";
import { updateTodoFromWebSocket } from "@/store/slices/todoSlice";
import { updateEmailFromWebSocket } from "@/store/slices/emailSlice";
import { updateToolExecutionFromWebSocket } from "@/store/slices/toolExecutionSlice";
import { Todo } from "@/types/todo";
import { Email } from "@/types/email";
import { ToolExecution } from "@/types/toolExecution";
import { secureStorage } from "@/services/secureStorage";

interface SocketEvent {
  event: string;
  data: any;
}

enum SocketEvents {
  CHAT_MESSAGE = "chat_message",
  CHAT = "chat",
  TODO = "todo",
  EMAIL = "email",
  TOOL_EXECUTION = "tool_execution",
}

interface WebSocketState {
  connection?: Socket;
  connected: boolean;
}

interface WebSocketContextValue extends WebSocketState {
  emitMessage: (event: string, data?: any) => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

type SetConnectionAction = {
  type: "SET_CONNECTION";
  payload: {
    connection?: Socket;
    connected: boolean;
  };
};

type Action = SetConnectionAction;

const initialState: WebSocketState = {
  connected: false,
};

const reducer = (state: WebSocketState, action: Action): WebSocketState => {
  switch (action.type) {
    case "SET_CONNECTION":
      return {
        ...state,
        connection: action.payload.connection,
        connected: action.payload.connected,
      };
    default:
      return state;
  }
};

const WebSocketContext = createContext<WebSocketContextValue>({
  ...initialState,
  emitMessage: () => {},
});

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, authToken, refreshToken } = useAppSelector(
    (state) => state.auth
  );
  const [state, localDispatch] = useReducer(reducer, initialState);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !authToken || !refreshToken || state.connected) {
      return;
    }

    console.log("Connecting to WebSocket...");

    const connection = io(`${API_CONFIG.API_BASE_URL}/primary-gateway`, {
      withCredentials: true,
      extraHeaders: {
        Authorization: `JWT ${authToken};;;;;${refreshToken}`,
      },
      transports: ["websocket"],
    });

    connection.on("connect", () => {
      console.log("Connected to WebSocket");
      connection.emit("heyo-fucker");
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection,
          connected: true,
        },
      });
    });

    connection.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection: undefined,
          connected: false,
        },
      });
    });

    connection.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection: undefined,
          connected: false,
        },
      });
    });

    return () => {
      /* console.log("Cleaning up WebSocket connection");
      connection.disconnect(); */
    };
  }, [isAuthenticated, authToken, refreshToken, state.connection]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && !state.connected && isAuthenticated) {
        console.log("App became active, attempting to reconnect WebSocket");
        if (state.connection) {
          state.connection.connect();
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [state.connected, state.connection, isAuthenticated]);

  // Set up event listeners
  useEffect(() => {
    if (!state.connection) return;

    console.log("Setting up WebSocket event listeners");

    const handleServerToClient = (socketEvent: SocketEvent) => {
      console.log("Received WebSocket event:", socketEvent.event);

      switch (socketEvent.event) {
        case SocketEvents.CHAT_MESSAGE:
          const chatMessage: ChatMessage = socketEvent.data.chatMessage;
          dispatch(addMessage(chatMessage));
          break;

        case SocketEvents.CHAT:
          const chat: Chat = socketEvent.data.chat;
          dispatch(setCurrentChatId(chat.id));
          // Update the chat with all received data
          dispatch(updateChat(chat));
          break;

        case SocketEvents.TODO:
          const todo: Todo = socketEvent.data.todo;
          dispatch(updateTodoFromWebSocket(todo));
          break;

        case SocketEvents.EMAIL:
          const email: Email = socketEvent.data.email;
          dispatch(updateEmailFromWebSocket(email));
          break;

        case SocketEvents.TOOL_EXECUTION:
          const toolExecution: ToolExecution = socketEvent.data.toolExecution;
          dispatch(updateToolExecutionFromWebSocket(toolExecution));
          break;

        default:
          console.log("Unhandled WebSocket event:", socketEvent.event);
      }
    };

    state.connection.on("ServerToClient", handleServerToClient);

    return () => {
      state.connection?.off("ServerToClient", handleServerToClient);
    };
  }, [state.connection, dispatch]);

  // Emit message function
  const emitMessage = (event: string, data?: any) => {
    if (!state.connection || !state.connected) {
      console.warn("WebSocket not connected, cannot emit message");
      return;
    }

    console.log("Emitting WebSocket message:", event, data);
    state.connection.emit(event, data);
  };

  return (
    <WebSocketContext.Provider
      value={{
        ...state,
        emitMessage,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
