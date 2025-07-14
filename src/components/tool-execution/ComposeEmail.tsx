import { useContacts } from "@/hooks/useContacts";
import { useTheme } from "@/hooks/useTheme";
import { regenerateTextService } from "@/services/regenerateTextService";
import { AppDispatch, RootState } from "@/store";
import {
  executeToolExecutionAsync,
  updateToolExecutionAsync,
} from "@/store/slices/toolExecutionSlice";
import {
  createEmailDraftParameters,
  EmailDraftData,
  parseEmailDraftFromToolExecution,
  ToolExecution,
} from "@/types/toolExecution";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";

// Import our new components
import { AutoSaveIndicator } from "../emails/AutoSaveIndicator";
import { EmailActionBar } from "../emails/EmailActionBar";
import { EmailBody } from "../emails/EmailBody";
import { EmailField } from "../emails/EmailField";
import { AIModal, FollowUpModal } from "../emails/EmailModals";
import { FollowUpIndicator } from "../emails/FollowUpIndicator";

interface ComposeEmailProps {
  toolExecution: ToolExecution;
  onSend?: () => void;
  onDidChange?: () => void;
}

export const ComposeEmail: React.FC<ComposeEmailProps> = ({
  toolExecution,
  onSend,
  onDidChange,
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
  const [showAiModal, setShowAiModal] = useState(true);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Email input states
  const [toInputValue, setToInputValue] = useState("");
  const [ccInputValue, setCcInputValue] = useState("");
  const [bccInputValue, setBccInputValue] = useState("");

  // Helper function to notify changes
  const notifyChange = () => {
    if (onDidChange) {
      onDidChange();
    }
  };

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
    // Notify parent component that changes were made
    if (onDidChange) {
      onDidChange();
    }
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
        modificationInstructions:
          "Imrpove or write the email that the user has described, if there is no email yet then make sure to include beginning middle part and signature: " +
          aiQuestion,
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
        style={styles.content}
        contentContainerStyle={{ flexGrow: 1 }}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Email Recipients */}
        <EmailField
          label="To"
          recipients={emailData.to}
          inputValue={toInputValue}
          onInputChange={(value) => {
            setToInputValue(value);
            notifyChange();
          }}
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
          onCcInputChange={(value) => {
            setCcInputValue(value);
            notifyChange();
          }}
          onBccInputChange={(value) => {
            setBccInputValue(value);
            notifyChange();
          }}
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

      {Platform.OS === "ios" ? (
        <SafeAreaView
          edges={["bottom"]}
          style={{ backgroundColor: colors.background }}
        >
          <AutoSaveIndicator lastSaved={lastSaved} />
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
        </SafeAreaView>
      ) : (
        <View style={{ backgroundColor: colors.background, paddingBottom: 20 }}>
          <AutoSaveIndicator lastSaved={lastSaved} />
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
        </View>
      )}

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
