import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import {
  updateToolExecutionAsync,
  executeToolExecutionAsync,
} from "@/store/slices/toolExecutionSlice";
import {
  ToolExecution,
  parseEmailDraftFromToolExecution,
  createEmailDraftParameters,
  EmailDraftData,
} from "@/types/toolExecution";

interface ComposeEmailProps {
  toolExecution: ToolExecution;
  onSend?: () => void;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({
  toolExecution,
  onSend,
}) => {
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { isUpdating, isExecuting } = useSelector(
    (state: RootState) => state.toolExecutions
  );

  const styles = createStyles(colors);

  // Load existing data
  useEffect(() => {
    const emailData = parseEmailDraftFromToolExecution(toolExecution);
    if (emailData) {
      setTo(
        Array.isArray(emailData.to)
          ? emailData.to.map((t) => t.email).join(", ")
          : ""
      );
      setSubject(emailData.subject || "");
      setBody(emailData.body || "");
    }
  }, [toolExecution]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (!to && !subject && !body) return; // Don't save empty drafts

      try {
        const emailData: EmailDraftData = {
          to: to
            .split(",")
            .map((email) => ({ id: email.trim(), email: email.trim() })),
          cc: [],
          bcc: [],
          subject,
          body,
          attachments: [],
        };

        const parameters = createEmailDraftParameters(emailData);

        await dispatch(
          updateToolExecutionAsync({
            toolExecutionId: toolExecution.id,
            data: { input: parameters },
          })
        ).unwrap();

        setLastSaved(new Date());
      } catch (error) {
        console.error("Auto-save failed:", error);
      }
    };

    const timeoutId = setTimeout(autoSave, 400); // Auto-save after 400ms of inactivity
    return () => clearTimeout(timeoutId);
  }, [to, subject, body, dispatch, toolExecution.id]);

  const handleSendEmail = async () => {
    if (!to.trim()) {
      Alert.alert("Error", "Please enter recipient email address");
      return;
    }

    if (!subject.trim()) {
      Alert.alert("Error", "Please enter email subject");
      return;
    }

    setIsSending(true);
    try {
      const emailData: EmailDraftData = {
        to: to
          .split(",")
          .map((email) => ({ id: email.trim(), email: email.trim() })),
        cc: [],
        bcc: [],
        subject,
        body,
        attachments: [],
      };

      const parameters = createEmailDraftParameters(emailData);

      await dispatch(
        executeToolExecutionAsync({
          toolExecutionId: toolExecution.id,
          data: { input: parameters },
        })
      ).unwrap();

      Alert.alert("Success", "Email sent successfully!");
      onSend?.();
    } catch (error) {
      Alert.alert("Error", "Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const formatLastSaved = () => {
    if (!lastSaved) return "";
    const now = new Date();
    const diff = now.getTime() - lastSaved.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Saved just now";
    if (minutes === 1) return "Saved 1 minute ago";
    return `Saved ${minutes} minutes ago`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>To</Text>
          <TextInput
            style={styles.input}
            value={to}
            onChangeText={setTo}
            placeholder="Enter recipient email addresses (comma separated)"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Subject</Text>
          <TextInput
            style={styles.input}
            value={subject}
            onChangeText={setSubject}
            placeholder="Enter email subject"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Message</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={body}
            onChangeText={setBody}
            placeholder="Enter your message here..."
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>

        {lastSaved && (
          <View style={styles.autoSaveContainer}>
            <MaterialIcons name="cloud-done" size={16} color={colors.primary} />
            <Text style={styles.autoSaveText}>{formatLastSaved()}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, styles.sendButton]}
          onPress={handleSendEmail}
          disabled={isSending || isExecuting}
        >
          {isSending || isExecuting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialIcons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.buttonText}>Send Email</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    bodyInput: {
      minHeight: 200,
      textAlignVertical: "top",
    },
    autoSaveContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginTop: 10,
      padding: 8,
    },
    autoSaveText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    footer: {
      padding: 16,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
    },
    sendButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "600",
      marginLeft: 8,
    },
  });
