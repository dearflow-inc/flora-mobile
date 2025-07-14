import { useTheme } from "@/hooks/useTheme";
import { regenerateTextService } from "@/services/regenerateTextService";
import { AppDispatch } from "@/store";
import { updateToolExecutionAsync } from "@/store/slices/toolExecutionSlice";
import { updateUserTaskActionDataAsync } from "@/store/slices/userTaskSlice";
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
import { useDispatch } from "react-redux";
// Import our new components
import { AutoSaveIndicator } from "../emails/AutoSaveIndicator";
import { EmailActionBar } from "../emails/EmailActionBar";
import { EmailBody } from "../emails/EmailBody";
import { EmailField } from "../emails/EmailField";
import { AIModal, FollowUpModal } from "../emails/EmailModals";
import { FollowUpIndicator } from "../emails/FollowUpIndicator";

interface EditReplyEmailProps {
  toolExecution: ToolExecution;
  actionId: string;
  userTaskId: string;
  onFinishEditing?: () => void;
  onDidChange?: () => void;
}

export const EditReplyEmail: React.FC<EditReplyEmailProps> = ({
  toolExecution,
  actionId,
  userTaskId,
  onFinishEditing,
  onDidChange,
}) => {
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();

  const { height } = useWindowDimensions();

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

  // Helper function to notify changes
  const notifyChange = () => {
    if (onDidChange) {
      onDidChange();
    }
  };

  const styles = createStyles(colors);

  // Load existing data
  useEffect(() => {
    const parsedData = parseEmailDraftFromToolExecution(toolExecution);
    if (parsedData) {
      setEmailData(parsedData);
    }
  }, [toolExecution?.id]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      if (!emailData.body) return;

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

  const handleFinishEditing = async () => {
    try {
      // Update the action data with the new reply content
      await dispatch(
        updateUserTaskActionDataAsync({
          userTaskId: userTaskId,
          request: {
            actionId: actionId,
            actionData: {
              reply: emailData.body,
            },
          },
        })
      ).unwrap();

      onFinishEditing?.();
    } catch (error) {
      Alert.alert("Error", "Failed to save reply. Please try again.");
    }
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
        modificationInstructions: "Improve this reply",
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
          onSelectContact={() => {}}
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

        {/* Email Body - No subject field for reply editing */}
        <EmailBody
          subject={emailData.subject}
          body={emailData.body}
          onSubjectChange={() => {}} // No-op for reply editing
          onBodyChange={(text) => updateEmailData({ body: text })}
          hideSubject={true}
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
            onSend={handleFinishEditing}
            isAskingAI={isAskingAI}
            isSending={false}
            isExecuting={false}
            hasFollowUp={!!emailData.followUpSettings?.followUpRequired}
            disabled={!emailData.body.trim()}
            hideSendIcon
            sendButtonText="Finish Editing"
          />
        </SafeAreaView>
      ) : (
        <View style={{ backgroundColor: colors.background }}>
          <AutoSaveIndicator lastSaved={lastSaved} />
          <EmailActionBar
            onAskAI={() => setShowAiModal(true)}
            onRefresh={handleRefreshContent}
            onFollowUp={() => setShowFollowUpModal(true)}
            onAttach={handleAttach}
            onSend={handleFinishEditing}
            isAskingAI={isAskingAI}
            isSending={false}
            isExecuting={false}
            hasFollowUp={!!emailData.followUpSettings?.followUpRequired}
            disabled={!emailData.body.trim()}
            hideSendIcon
            sendButtonText="Finish Editing"
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
