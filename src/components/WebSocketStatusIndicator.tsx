import { useWebSocket } from "@/contexts/WebSocketContext";
import { useTheme } from "@/hooks/useTheme";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface WebSocketStatusIndicatorProps {
  showDetails?: boolean;
}

export const WebSocketStatusIndicator: React.FC<
  WebSocketStatusIndicatorProps
> = ({ showDetails = false }) => {
  const { connected, isConnecting, connectionAttempts } = useWebSocket();
  const { colors } = useTheme();

  const getStatusInfo = () => {
    if (connected) {
      return {
        icon: "wifi" as const,
        color: colors.success || "#4CAF50",
        text: "Connected",
        details: "WebSocket connection active",
      };
    } else if (isConnecting) {
      return {
        icon: "wifi-off" as const,
        color: colors.warning || "#FF9800",
        text: "Connecting...",
        details: `Attempt ${connectionAttempts + 1}`,
      };
    } else {
      return {
        icon: "wifi-off" as const,
        color: colors.danger || "#F44336",
        text: "Disconnected",
        details:
          connectionAttempts > 0
            ? `Failed after ${connectionAttempts} attempts`
            : "Not connected",
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.statusRow}>
        <MaterialIcons
          name={statusInfo.icon}
          size={16}
          color={statusInfo.color}
        />
        <Text style={[styles.statusText, { color: statusInfo.color }]}>
          {statusInfo.text}
        </Text>
      </View>
      {showDetails && (
        <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
          {statusInfo.details}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    marginVertical: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailsText: {
    fontSize: 10,
    marginTop: 2,
    marginLeft: 22,
  },
});
