import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  useWindowDimensions,
} from "react-native";
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
import { regenerateTextService } from "@/services/regenerateTextService";
import { useContacts } from "@/hooks/useContacts";

// Import our new components
import { EmailField, EmailRecipient } from "../emails/EmailField";
import { EmailActionBar } from "../emails/EmailActionBar";
import { EmailBody } from "../emails/EmailBody";
import { FollowUpIndicator } from "../emails/FollowUpIndicator";
import { AutoSaveIndicator } from "../emails/AutoSaveIndicator";
import { AIModal, FollowUpModal } from "../emails/EmailModals";

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
  const { contacts } = useContacts();

  const { width, height } = useWindowDimensions();

  // State management
  const [emailData, setEmailData] = useState<EmailDraftData>({
    to: [],
    cc: [],
    bcc: [],
    subject: "",
    body: "",
    attachments: [],
    followUpSettings: {
      followUpRequired: false,
    },
  });

  const [isSending, setIsSending] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiQuestion, setAiQuestion] = useState("");
  const [showAiModal, setShowAiModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Email input states
  const [toInputValue, setToInputValue] = useState("");
  const [ccInputValue, setCcInputValue] = useState("");
  const [bccInputValue, setBccInputValue] = useState("");

  const { isUpdating, isExecuting } = useSelector(
    (state: RootState) => state.toolExecutions
  );

  const styles = createStyles(colors);

  // Load existing data
  useEffect(() => {
    const parsedData = parseEmailDraftFromToolExecution(toolExecution);
    if (parsedData) {
      setEmailData(parsedData);
    }
  }, [toolExecution.id]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (!emailData.to.length && !emailData.subject && !emailData.body) return;

      try {
        const parameters = createEmailDraftParameters(emailData);
        console.log("parameters", parameters);
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

    const timeoutId = setTimeout(autoSave, 500);
    return () => clearTimeout(timeoutId);
  }, [emailData, toolExecution.id]);

  const updateEmailData = (updates: Partial<EmailDraftData>) => {
    setEmailData((prev) => ({ ...prev, ...updates }));
  };

  const addEmail = (
    field: "to" | "cc" | "bcc",
    email: { id: string; email: string }
  ) => {
    if (!email.email.trim()) return;

    const newEmail = { id: email.id, email: email.email };
    const currentEmails = emailData[field];
    const exists = currentEmails.some(
      (e) => e.email.toLowerCase() === email.email.toLowerCase()
    );

    if (!exists) {
      updateEmailData({
        [field]: [...currentEmails, newEmail],
      });
    }
  };

  const removeEmail = (field: "to" | "cc" | "bcc", contactId: string) => {
    updateEmailData({
      [field]: emailData[field].filter((e) => e.id !== contactId),
    });
  };

  const handleSelectContact = (field: "to" | "cc" | "bcc") => {
    // Contact selection is now handled by the dropdown in EmailField
    console.log(`Contact selection for ${field} is handled by dropdown`);
  };

  // Check if send button should be disabled
  const isSendDisabled =
    !emailData.to.length || !emailData.subject.trim() || !emailData.body.trim();

  const handleSendEmail = async () => {
    if (!emailData.to.length) {
      Alert.alert("Error", "Please enter at least one recipient email address");
      return;
    }

    if (!emailData.subject.trim()) {
      Alert.alert("Error", "Please enter email subject");
      return;
    }

    setIsSending(true);
    try {
      const parameters = createEmailDraftParameters(emailData);
      await dispatch(
        executeToolExecutionAsync({
          toolExecutionId: toolExecution.id,
          data: { input: parameters },
        })
      ).unwrap();

      onSend?.();
    } catch (error) {
      Alert.alert("Error", "Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendClick = () => {
    handleSendEmail();
  };

  const handleAskAI = async () => {
    if (!aiQuestion.trim()) return;

    setIsAskingAI(true);
    try {
      const response = await regenerateTextService.regenerateText({
        originalText: emailData.body,
        sectionToReplace: emailData.body, // Replace entire body for ask AI
        modificationInstructions: aiQuestion,
        formerVersions: [],
      });

      // Format the response text for HTML display
      const formattedText = response.replacement
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");

      updateEmailData({ body: formattedText });
      setAiQuestion("");
      setShowAiModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to get AI assistance. Please try again.");
    } finally {
      setAiQuestion("");
      setIsAskingAI(false);
    }
  };

  const handleRefreshContent = async () => {
    setIsAskingAI(true);
    try {
      const response = await regenerateTextService.regenerateText({
        originalText: emailData.body,
        sectionToReplace: emailData.body, // Replace entire body for regenerate
        modificationInstructions: "Improve this email",
        formerVersions: [],
      });

      // Format the response text for HTML display
      const formattedText = response.replacement
        .split("\n")
        .map((line) => `<p>${line}</p>`)
        .join("");

      updateEmailData({ body: formattedText });
    } catch (error) {
      Alert.alert("Error", "Failed to refresh content. Please try again.");
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleFollowUpSchedule = (followUpIn?: number) => {
    updateEmailData({
      followUpSettings: {
        followUpRequired: true,
        followUpAt: followUpIn ? new Date(Date.now() + followUpIn) : undefined,
        followUpIn,
      },
    });
    setShowFollowUpModal(false);
  };

  const handleRemoveFollowUp = () => {
    updateEmailData({
      followUpSettings: {
        followUpRequired: false,
        followUpAt: undefined,
        followUpIn: undefined,
      },
    });
  };

  const handleAttach = () => {
    // TODO: Implement file attachment
    console.log("Attach file");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={[
          styles.content,
          { minHeight: height - 260, maxHeight: height - 260 },
        ]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Email Recipients */}
        <EmailField
          label="To"
          recipients={emailData.to}
          inputValue={toInputValue}
          onInputChange={setToInputValue}
          onAddRecipient={(recipient) => addEmail("to", recipient)}
          onRemoveRecipient={(id) => removeEmail("to", id)}
          onSelectContact={() => handleSelectContact("to")}
          placeholder="Type..."
          showCcBcc={true}
          isDropdownOpen={isDropdownOpen}
          ccRecipients={emailData.cc}
          bccRecipients={emailData.bcc}
          ccInputValue={ccInputValue}
          bccInputValue={bccInputValue}
          onCcInputChange={setCcInputValue}
          onBccInputChange={setBccInputValue}
          onAddCcRecipient={(recipient) => addEmail("cc", recipient)}
          onAddBccRecipient={(recipient) => addEmail("bcc", recipient)}
          onRemoveCcRecipient={(id) => removeEmail("cc", id)}
          onRemoveBccRecipient={(id) => removeEmail("bcc", id)}
          onDropdownOpen={setIsDropdownOpen}
        />

        {/* Email Body */}
        <EmailBody
          subject={emailData.subject}
          body={emailData.body}
          onSubjectChange={(text) => updateEmailData({ subject: text })}
          onBodyChange={(text) => updateEmailData({ body: text })}
        />

        {/* Follow-up Settings */}
        {emailData.followUpSettings?.followUpRequired && (
          <FollowUpIndicator
            followUpAt={emailData.followUpSettings.followUpAt}
            onRemove={handleRemoveFollowUp}
          />
        )}
        <View style={{ height: 150, backgroundColor: colors.background }} />
      </ScrollView>

      {/* Auto-save indicator - positioned at bottom */}
      <AutoSaveIndicator lastSaved={lastSaved} />

      {/* Action Bar */}
      <EmailActionBar
        onAskAI={() => setShowAiModal(true)}
        onRefresh={handleRefreshContent}
        onFollowUp={() => setShowFollowUpModal(true)}
        onAttach={handleAttach}
        onSend={handleSendClick}
        isAskingAI={isAskingAI}
        isSending={isSending}
        isExecuting={isExecuting}
        hasFollowUp={!!emailData.followUpSettings?.followUpRequired}
        disabled={isSendDisabled}
      />

      {/* Modals */}
      <AIModal
        visible={showAiModal}
        onClose={() => setShowAiModal(false)}
        question={aiQuestion}
        onQuestionChange={setAiQuestion}
        onAskAI={handleAskAI}
        isAskingAI={isAskingAI}
      />

      <FollowUpModal
        visible={showFollowUpModal}
        onClose={() => setShowFollowUpModal(false)}
        onSelectTime={handleFollowUpSchedule}
      />
    </KeyboardAvoidingView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
  });
