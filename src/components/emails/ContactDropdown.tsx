import { useContacts } from "@/hooks/useContacts";
import { useTheme } from "@/hooks/useTheme";
import { Contact, ContactEmailAddress } from "@/types/contact";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface ContactDropdownProps {
  visible: boolean;
  searchTerm: string;
  onSelectContact: (email: string, name?: string, contactId?: string) => void;
  onClose: () => void;
  onInteractionStart?: () => void;
  onFirstContactChange?: (
    contact: Contact | null,
    emailAddress: ContactEmailAddress | null
  ) => void;
}

export const ContactDropdown: React.FC<ContactDropdownProps> = ({
  visible,
  searchTerm,
  onSelectContact,
  onClose,
  onInteractionStart,
  onFirstContactChange,
}) => {
  const { colors } = useTheme();
  const { searchResults, isSearching, searchContacts, createContact } =
    useContacts();
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [isCreatingContact, setIsCreatingContact] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (visible && searchTerm.length >= 2) {
      timeout = setTimeout(() => {
        searchContacts(searchTerm);
      }, 1000);
    }

    return () => clearTimeout(timeout);
  }, [visible, searchTerm]);

  useEffect(() => {
    // Check if we have a complete email address but no matching contacts
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isCompleteEmail = emailRegex.test(searchTerm);
    const hasMatchingContacts = searchResults.some(
      (contact) =>
        contact.emailAddresses.some(
          (email) =>
            email.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.name?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        `${contact.firstName} ${contact.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    setShowCreateContact(
      isCompleteEmail && !hasMatchingContacts && searchTerm.length > 0
    );

    // Find and notify about the first contact
    if (searchResults.length > 0 && onFirstContactChange) {
      const firstContact = searchResults[0];
      const firstEmail = firstContact.emailAddresses.find(
        (email) =>
          email.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          email.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${firstContact.firstName} ${firstContact.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );

      if (firstEmail) {
        onFirstContactChange(firstContact, firstEmail);
      } else {
        onFirstContactChange(null, null);
      }
    } else if (onFirstContactChange) {
      onFirstContactChange(null, null);
    }
  }, [searchTerm, searchResults, onFirstContactChange]);

  const handleSelectContact = (
    contact: Contact,
    emailAddress: ContactEmailAddress
  ) => {
    onSelectContact(emailAddress.address, emailAddress.name, contact.id);
    onClose();
  };

  const handleCreateContact = async () => {
    if (!searchTerm.trim()) return;

    setIsCreatingContact(true);
    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(searchTerm)) {
        Alert.alert("Error", "Please enter a valid email address");
        return;
      }

      const firstName =
        newContactName.trim().split(" ")[0]?.replace("undefined", "") ||
        undefined;
      const lastName =
        newContactName
          .trim()
          .split(" ")
          ?.slice(1)
          ?.join(" ")
          ?.replace("undefined", "") || undefined;

      const contactData = {
        firstName: firstName,
        lastName: lastName,
        emailAddresses: [
          {
            name:
              firstName || lastName
                ? `${firstName || ""} ${lastName || ""}`.trim()
                : searchTerm.split("@")[0],
            address: searchTerm.trim(),
            primary: true,
          },
        ],
        phoneNumbers: [],
      };

      const newContact = await createContact(contactData).unwrap();
      onSelectContact(
        searchTerm.trim(),
        newContactName.trim() || searchTerm.split("@")[0],
        newContact.id
      );
      onClose();
      setNewContactName("");
    } catch (error: any) {
      console.log(error);
      Alert.alert("Error", error.message || "Failed to create contact");
    } finally {
      setIsCreatingContact(false);
    }
  };

  const getDisplayName = (
    contact: Contact,
    emailAddress: ContactEmailAddress
  ) => {
    if (
      emailAddress.name &&
      emailAddress.name.trim() !== "undefined" &&
      emailAddress.name !== emailAddress.address
    ) {
      return `${emailAddress.name} (${emailAddress.address})`;
    }
    if (contact.firstName || contact.lastName) {
      const fullName = `${contact.firstName || ""} ${
        contact.lastName || ""
      }`.trim();
      return `${fullName} (${emailAddress.address})`;
    }
    return emailAddress.address;
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {isSearching && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Searching contacts...</Text>
          </View>
        )}

        {!isSearching &&
          searchResults.length === 0 &&
          searchTerm.length >= 2 &&
          !showCreateContact && (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsText}>No contacts found</Text>
            </View>
          )}

        {searchResults.map((contact) =>
          contact.emailAddresses
            .filter(
              (email) =>
                email.address
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                email.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${contact.firstName} ${contact.lastName}`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
            )
            .map((emailAddress, index) => (
              <TouchableOpacity
                key={`${contact.id}-${emailAddress.address}-${index}`}
                style={styles.contactItem}
                onPress={() => handleSelectContact(contact, emailAddress)}
                onPressIn={onInteractionStart}
              >
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>
                    {getDisplayName(contact, emailAddress)}
                  </Text>
                  {contact.companyName && (
                    <Text style={styles.companyName}>
                      {contact.companyName}
                    </Text>
                  )}
                </View>
                <MaterialIcons
                  name="person"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))
        )}

        {showCreateContact && (
          <View style={styles.createContactContainer}>
            <Text style={styles.createContactTitle}>Create new contact</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="Name (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newContactName}
              onChangeText={setNewContactName}
              autoCapitalize="words"
              onSubmitEditing={handleCreateContact}
            />
            <TouchableOpacity
              style={[
                styles.createButton,
                isCreatingContact && styles.createButtonDisabled,
              ]}
              onPress={handleCreateContact}
              onPressIn={onInteractionStart}
              disabled={isCreatingContact}
            >
              <Text style={styles.createButtonText}>
                {isCreatingContact ? "Creating..." : `Create "${searchTerm}"`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      maxHeight: 300,
      zIndex: 9999,
      elevation: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    scrollView: {
      flex: 1,
    },
    loadingContainer: {
      padding: 16,
      alignItems: "center",
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    noResultsContainer: {
      padding: 16,
      alignItems: "center",
    },
    noResultsText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    contactItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    contactInfo: {
      flex: 1,
      marginRight: 8,
    },
    contactName: {
      fontSize: 14,
      color: colors.text,
      fontWeight: "500",
    },
    companyName: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    createContactContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createContactTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    nameInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      padding: 8,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.background,
      marginBottom: 8,
    },
    createButton: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 4,
      alignItems: "center",
    },
    createButtonDisabled: {
      opacity: 0.6,
    },
    createButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: "500",
    },
  });
