import { API_CONFIG } from "@/config/api";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { secureStorage } from "@/services/secureStorage";
import {
  Chat,
  ChatMessage,
  addMessage,
  setCurrentChatId,
  updateChat,
} from "@/store/slices/chatSlice";
import { updateEmailFromWebSocket } from "@/store/slices/emailSlice";
import { updateTodoFromWebSocket } from "@/store/slices/todoSlice";
import { updateToolExecutionFromWebSocket } from "@/store/slices/toolExecutionSlice";
import { updateUserTaskFromWebSocket } from "@/store/slices/userTaskSlice";
import { Email } from "@/types/email";
import { Todo } from "@/types/todo";
import { ToolExecution } from "@/types/toolExecution";
import { UserTask } from "@/types/userTask";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";
import { AppState, AppStateStatus } from "react-native";
import { Socket, io } from "socket.io-client";

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
  USER_TASK = "user_task",
}

interface WebSocketState {
  connection?: Socket;
  connected: boolean;
  isConnecting: boolean;
  connectionAttempts: number;
}

interface WebSocketContextValue extends WebSocketState {
  emitMessage: (event: string, data?: any) => void;
  reconnect: () => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
}

type SetConnectionAction = {
  type: "SET_CONNECTION";
  payload: {
    connection?: Socket;
    connected: boolean;
    isConnecting?: boolean;
  };
};

type SetConnectingAction = {
  type: "SET_CONNECTING";
  payload: boolean;
};

type IncrementAttemptsAction = {
  type: "INCREMENT_ATTEMPTS";
};

type ResetAttemptsAction = {
  type: "RESET_ATTEMPTS";
};

type Action =
  | SetConnectionAction
  | SetConnectingAction
  | IncrementAttemptsAction
  | ResetAttemptsAction;

const initialState: WebSocketState = {
  connected: false,
  isConnecting: false,
  connectionAttempts: 0,
};

const reducer = (state: WebSocketState, action: Action): WebSocketState => {
  switch (action.type) {
    case "SET_CONNECTION":
      return {
        ...state,
        connection: action.payload.connection,
        connected: action.payload.connected,
        isConnecting: action.payload.isConnecting ?? false,
      };
    case "SET_CONNECTING":
      return {
        ...state,
        isConnecting: action.payload,
      };
    case "INCREMENT_ATTEMPTS":
      return {
        ...state,
        connectionAttempts: state.connectionAttempts + 1,
      };
    case "RESET_ATTEMPTS":
      return {
        ...state,
        connectionAttempts: 0,
      };
    default:
      return state;
  }
};

const WebSocketContext = createContext<WebSocketContextValue>({
  ...initialState,
  emitMessage: () => {},
  reconnect: () => {},
});

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { isAuthenticated, authToken, refreshToken } = useAppSelector(
    (state) => state.auth
  );
  const { currentProfile, hasProfileBeenFetched } = useAppSelector(
    (state) => state.profile
  );
  const [state, localDispatch] = useReducer(reducer, initialState);
  const connectionRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function for WebSocket connection
  const cleanupConnection = () => {
    if (connectionRef.current) {
      console.log("Cleaning up WebSocket connection");
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (!isAuthenticated || !authToken || !refreshToken) {
      console.log("WebSocket: Not authenticated or missing tokens");
      cleanupConnection();
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection: undefined,
          connected: false,
          isConnecting: false,
        },
      });
      return;
    }

    // During onboarding, wait for profile to be fetched before establishing WebSocket
    if (
      currentProfile?.onboarding !== undefined &&
      currentProfile.onboarding < 3 &&
      !hasProfileBeenFetched
    ) {
      console.log(
        "WebSocket: Waiting for profile to be fetched during onboarding",
        { onboarding: currentProfile.onboarding, hasProfileBeenFetched }
      );
      return;
    }

    if (state.connected || state.isConnecting) {
      console.log("WebSocket: Already connected or connecting");
      return;
    }

    console.log("WebSocket: Starting connection...");
    localDispatch({ type: "SET_CONNECTING", payload: true });

    const connection = io(`${API_CONFIG.API_BASE_URL}/primary-gateway`, {
      withCredentials: true,
      extraHeaders: {
        Authorization: `JWT ${authToken};;;;;${refreshToken}`,
      },
      transports: ["websocket"],
      timeout: 10000, // 10 second timeout
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    connectionRef.current = connection;

    connection.on("connect", async () => {
      console.log("WebSocket: Successfully connected");
      connection.emit("heyo-fucker", {
        deviceId: await secureStorage.getItem("device_id"),
      });
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection,
          connected: true,
          isConnecting: false,
        },
      });
      localDispatch({ type: "RESET_ATTEMPTS" });
    });

    connection.on("disconnect", (reason) => {
      console.log("WebSocket: Disconnected", { reason });
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection: undefined,
          connected: false,
          isConnecting: false,
        },
      });

      // Auto-reconnect if it wasn't a manual disconnect
      if (reason !== "io client disconnect" && isAuthenticated) {
        console.log("WebSocket: Attempting to reconnect...");
        localDispatch({ type: "INCREMENT_ATTEMPTS" });

        // Exponential backoff for reconnection
        const delay = Math.min(
          1000 * Math.pow(2, state.connectionAttempts),
          30000
        );
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated && authToken && refreshToken) {
            console.log("WebSocket: Retrying connection after delay");
            localDispatch({ type: "SET_CONNECTING", payload: true });
            connection.connect();
          }
        }, delay);
      }
    });

    connection.on("connect_error", (error) => {
      console.error("WebSocket: Connection error", error);
      localDispatch({
        type: "SET_CONNECTION",
        payload: {
          connection: undefined,
          connected: false,
          isConnecting: false,
        },
      });
      localDispatch({ type: "INCREMENT_ATTEMPTS" });
    });

    return () => {
      cleanupConnection();
    };
  }, [
    isAuthenticated,
    authToken,
    refreshToken,
    currentProfile,
    hasProfileBeenFetched,
  ]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && !state.connected && isAuthenticated) {
        console.log("App became active, attempting to reconnect WebSocket");
        if (connectionRef.current) {
          connectionRef.current.connect();
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
  }, [state.connected, isAuthenticated]);

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

        case SocketEvents.USER_TASK:
          const userTask: UserTask = socketEvent.data.userTask;
          dispatch(updateUserTaskFromWebSocket(userTask));
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

  // Manual reconnect function
  const reconnect = () => {
    if (connectionRef.current) {
      console.log("Manual reconnect requested");
      connectionRef.current.disconnect();
      connectionRef.current.connect();
    }
  };

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
        reconnect,
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
