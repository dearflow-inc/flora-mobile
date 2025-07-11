import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ContactDropdown } from "./ContactDropdown";
import { Contact, ContactEmailAddress } from "@/types/contact";

export interface EmailRecipient {
  id: string;
  email: string;
  name?: string;
  isContact?: boolean;
}

interface EmailFieldProps {
  label: string;
  recipients: EmailRecipient[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onAddRecipient: (recipient: { id: string; email: string }) => void;
  onRemoveRecipient: (recipientId: string) => void;
  onSelectContact?: () => void;
  placeholder?: string;
  disabled?: boolean;
  isDropdownOpen?: boolean;
  showCcBcc?: boolean;
  ccRecipients?: EmailRecipient[];
  bccRecipients?: EmailRecipient[];
  ccInputValue?: string;
  bccInputValue?: string;
  onCcInputChange?: (value: string) => void;
  onBccInputChange?: (value: string) => void;
  onAddCcRecipient?: (recipient: { id: string; email: string }) => void;
  onAddBccRecipient?: (recipient: { id: string; email: string }) => void;
  onRemoveCcRecipient?: (recipientId: string) => void;
  onRemoveBccRecipient?: (recipientId: string) => void;
  onDropdownOpen?: (isOpen: boolean) => void;
}

export const EmailField: React.FC<EmailFieldProps> = ({
  label,
  recipients,
  inputValue,
  onInputChange,
  onAddRecipient,
  onRemoveRecipient,
  onSelectContact,
  placeholder = "Add email...",
  disabled = false,
  showCcBcc = false,
  isDropdownOpen = false,
  ccRecipients = [],
  bccRecipients = [],
  ccInputValue = "",
  bccInputValue = "",
  onCcInputChange,
  onBccInputChange,
  onAddCcRecipient,
  onAddBccRecipient,
  onRemoveCcRecipient,
  onRemoveBccRecipient,
  onDropdownOpen,
}) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [showDropdown, setShowDropdown] = useState<
    null | "main" | "cc" | "bcc"
  >("main");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDropdownInteracting, setIsDropdownInteracting] = useState(false);
  const dropdownRef = useRef<View>(null);

  // State to track first contact for each field
  const [firstMainContact, setFirstMainContact] = useState<Contact | null>(
    null
  );
  const [firstMainEmail, setFirstMainEmail] =
    useState<ContactEmailAddress | null>(null);
  const [firstCcContact, setFirstCcContact] = useState<Contact | null>(null);
  const [firstCcEmail, setFirstCcEmail] = useState<ContactEmailAddress | null>(
    null
  );
  const [firstBccContact, setFirstBccContact] = useState<Contact | null>(null);
  const [firstBccEmail, setFirstBccEmail] =
    useState<ContactEmailAddress | null>(null);

  // Refs for ScrollViews to auto-scroll to end
  const mainRecipientsScrollRef = useRef<ScrollView>(null);
  const ccRecipientsScrollRef = useRef<ScrollView>(null);
  const bccRecipientsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!isDropdownOpen) {
      setShowDropdown(null);
    }
  }, [isDropdownOpen]);

  // Auto-scroll to end when recipients change
  useEffect(() => {
    if (recipients.length > 0) {
      setTimeout(() => {
        mainRecipientsScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [recipients]);

  useEffect(() => {
    if (ccRecipients.length > 0) {
      setTimeout(() => {
        ccRecipientsScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [ccRecipients]);

  useEffect(() => {
    if (bccRecipients.length > 0) {
      setTimeout(() => {
        bccRecipientsScrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [bccRecipients]);

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onAddRecipient({ id: "", email: inputValue.trim() });
      onInputChange("");
      setShowDropdown(null);
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === "Enter") {
      e.preventDefault();
      // If dropdown is open and we have a first contact, select it
      if (showDropdown === "main" && firstMainContact && firstMainEmail) {
        handleSelectContact(
          firstMainEmail.address,
          firstMainEmail.name,
          firstMainContact.id
        );
      } else if (showDropdown === "cc" && firstCcContact && firstCcEmail) {
        handleSelectCcContact(
          firstCcEmail.address,
          firstCcEmail.name,
          firstCcContact.id
        );
      } else if (showDropdown === "bcc" && firstBccContact && firstBccEmail) {
        handleSelectBccContact(
          firstBccEmail.address,
          firstBccEmail.name,
          firstBccContact.id
        );
      }
    }
  };

  const handleInputChange = (text: string) => {
    onInputChange(text);
    const shouldShow = text.length >= 2;
    setShowDropdown(shouldShow ? "main" : null);
    onDropdownOpen?.(shouldShow);
  };

  const handleSelectContact = (
    email: string,
    name?: string,
    contactId?: string
  ) => {
    onAddRecipient({ id: contactId || "", email });
    onInputChange("");
    setShowDropdown(null);
    onDropdownOpen?.(false);
  };

  const handleSelectCcContact = (
    email: string,
    name?: string,
    contactId?: string
  ) => {
    onAddCcRecipient?.({ id: contactId || "", email });
    onCcInputChange?.("");
    onDropdownOpen?.(false);
  };

  const handleSelectBccContact = (
    email: string,
    name?: string,
    contactId?: string
  ) => {
    onAddBccRecipient?.({ id: contactId || "", email });
    onBccInputChange?.("");
    onDropdownOpen?.(false);
  };

  const handleCloseDropdown = () => {
    setShowDropdown(null);
    setIsDropdownInteracting(false);
    onDropdownOpen?.(false);
  };

  const handleCcBccPress = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      {/* Main Input Field */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.inputWrapper}>
          {/* Selected Recipients */}
          {recipients.length > 0 && (
            <ScrollView
              ref={mainRecipientsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.recipientsScroll]}
              contentContainerStyle={styles.recipientsScrollContent}
            >
              {recipients.map((recipient) => (
                <View key={recipient.id} style={styles.recipientChip}>
                  <Text style={styles.recipientChipText}>
                    {recipient.name || recipient.email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onRemoveRecipient(recipient.id)}
                    style={styles.recipientChipRemove}
                    disabled={disabled}
                  >
                    <MaterialIcons
                      name="close"
                      size={12}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Input Row */}
          <View style={styles.inputRow}>
            {/* Text Input - Only show when focused or no recipients */}
            <TextInput
              style={[styles.input, disabled && styles.inputDisabled]}
              value={inputValue}
              onChangeText={handleInputChange}
              placeholder={placeholder}
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onKeyPress={handleKeyPress}
              returnKeyType="done"
              editable={!disabled}
            />

            {/* CC/BCC Button or Focus Trigger */}
            <TouchableOpacity
              style={styles.ccBccButton}
              onPress={handleCcBccPress}
              activeOpacity={0.7}
            >
              <Text style={styles.ccBccButtonText}>CC/BCC</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CC/BCC Fields - Only show when expanded */}
      {isExpanded && showCcBcc && (
        <>
          {/* CC Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Cc</Text>
            <View style={styles.inputWrapper}>
              {ccRecipients.length > 0 && (
                <ScrollView
                  ref={ccRecipientsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.recipientsScroll}
                  contentContainerStyle={styles.recipientsScrollContent}
                >
                  {ccRecipients.map((recipient) => (
                    <View key={recipient.id} style={styles.recipientChip}>
                      <Text style={styles.recipientChipText}>
                        {recipient.name || recipient.email}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onRemoveCcRecipient?.(recipient.id)}
                        style={styles.recipientChipRemove}
                        disabled={disabled}
                      >
                        <MaterialIcons
                          name="close"
                          size={12}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, disabled && styles.inputDisabled]}
                  value={ccInputValue}
                  onChangeText={(text) => {
                    onCcInputChange?.(text);
                    const shouldShow = text.length >= 2;
                    setShowDropdown(shouldShow ? "cc" : null);
                    onDropdownOpen?.(shouldShow);
                  }}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === "Enter") {
                      e.preventDefault();
                      if (
                        showDropdown === "cc" &&
                        firstCcContact &&
                        firstCcEmail
                      ) {
                        handleSelectCcContact(
                          firstCcEmail.address,
                          firstCcEmail.name,
                          firstCcContact.id
                        );
                      }
                    }
                  }}
                  placeholder="Type..."
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!disabled}
                />
              </View>
            </View>
          </View>

          {/* BCC Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Bcc</Text>
            <View style={styles.inputWrapper}>
              {bccRecipients.length > 0 && (
                <ScrollView
                  ref={bccRecipientsScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.recipientsScroll}
                  contentContainerStyle={styles.recipientsScrollContent}
                >
                  {bccRecipients.map((recipient) => (
                    <View key={recipient.id} style={styles.recipientChip}>
                      <Text style={styles.recipientChipText}>
                        {recipient.name || recipient.email}
                      </Text>
                      <TouchableOpacity
                        onPress={() => onRemoveBccRecipient?.(recipient.id)}
                        style={styles.recipientChipRemove}
                        disabled={disabled}
                      >
                        <MaterialIcons
                          name="close"
                          size={12}
                          color={colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, disabled && styles.inputDisabled]}
                  value={bccInputValue}
                  onChangeText={(text) => {
                    onBccInputChange?.(text);
                    const shouldShow = text.length >= 2;
                    setShowDropdown(shouldShow ? "bcc" : null);
                    onDropdownOpen?.(shouldShow);
                  }}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === "Enter") {
                      e.preventDefault();
                      if (
                        showDropdown === "bcc" &&
                        firstBccContact &&
                        firstBccEmail
                      ) {
                        handleSelectBccContact(
                          firstBccEmail.address,
                          firstBccEmail.name,
                          firstBccContact.id
                        );
                      }
                    }
                  }}
                  placeholder="Type..."
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!disabled}
                />
              </View>
            </View>
          </View>
        </>
      )}

      {/* Contact Dropdown for main field */}
      <ContactDropdown
        visible={showDropdown === "main"}
        searchTerm={inputValue}
        onSelectContact={handleSelectContact}
        onClose={handleCloseDropdown}
        onInteractionStart={() => setIsDropdownInteracting(true)}
        onFirstContactChange={(contact, emailAddress) => {
          setFirstMainContact(contact);
          setFirstMainEmail(emailAddress);
        }}
      />

      {/* Contact Dropdown for CC field */}
      <ContactDropdown
        visible={
          showDropdown === "cc" &&
          isExpanded &&
          !!ccInputValue &&
          ccInputValue.length >= 2
        }
        searchTerm={ccInputValue || ""}
        onSelectContact={handleSelectCcContact}
        onClose={handleCloseDropdown}
        onInteractionStart={() => setIsDropdownInteracting(true)}
        onFirstContactChange={(contact, emailAddress) => {
          setFirstCcContact(contact);
          setFirstCcEmail(emailAddress);
        }}
      />

      {/* Contact Dropdown for BCC field */}
      <ContactDropdown
        visible={
          showDropdown === "bcc" &&
          isExpanded &&
          !!bccInputValue &&
          bccInputValue.length >= 2
        }
        searchTerm={bccInputValue || ""}
        onSelectContact={handleSelectBccContact}
        onClose={handleCloseDropdown}
        onInteractionStart={() => setIsDropdownInteracting(true)}
        onFirstContactChange={(contact, emailAddress) => {
          setFirstBccContact(contact);
          setFirstBccEmail(emailAddress);
        }}
      />

      {/* Full screen overlay to close dropdown when clicking outside */}
      {(showDropdown === "main" ||
        (showDropdown === "cc" &&
          isExpanded &&
          !!ccInputValue &&
          ccInputValue.length >= 2) ||
        (showDropdown === "bcc" &&
          isExpanded &&
          !!bccInputValue &&
          bccInputValue.length >= 2)) && (
        <View style={styles.dropdownOverlay} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.dropdownOverlayTouchable}
            activeOpacity={1}
            onPress={handleCloseDropdown}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      position: "relative",
      zIndex: 1,
    },
    inputContainer: {
      display: "flex",
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 16,
      paddingVertical: 8, // Reduced from 12 to 8
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.textSecondary,
      width: 40,
      marginRight: 8,
      marginTop: 8,
    },
    inputWrapper: {
      flex: 1,
      flexDirection: "column",
      minHeight: 32,
      paddingTop: 4,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    recipientChip: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primary + "20",
      borderRadius: 16,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginRight: 6,
      marginVertical: 2,
    },
    recipientChipText: {
      fontSize: 12,
      color: colors.primary,
      marginRight: 4,
    },
    recipientChipRemove: {
      padding: 2,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      minWidth: 120,
      paddingVertical: 4,
    },
    inputDisabled: {
      opacity: 0.6,
    },
    actionButtons: {
      flexDirection: "row",
      marginLeft: 8,
      marginTop: 4, // Reduced from 8 to 4
    },
    actionButton: {
      padding: 8,
      marginLeft: 4,
    },
    actionButtonDisabled: {
      opacity: 0.6,
    },
    recipientsScroll: {
      maxHeight: 80,
      marginBottom: 4,
    },
    recipientsScrollFullWidth: {
      maxWidth: "100%",
      marginRight: 0,
    },
    recipientsScrollContent: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      paddingRight: 8,
    },
    focusTrigger: {
      flex: 1,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: colors.background,
      borderRadius: 8,
      marginLeft: 8,
      minWidth: 120,
      justifyContent: "center",
    },
    focusTriggerText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    ccBccButton: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 8,
      marginLeft: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    ccBccButtonText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    dropdownOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
      zIndex: 10,
    },
    dropdownOverlayTouchable: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "transparent",
    },
  });
