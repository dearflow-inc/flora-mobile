import { CustomAvatar } from "@/components/ui/CustomAvatar";
import { useTheme } from "@/hooks/useTheme";
import { AppDispatch } from "@/store";
import { markEmailAsReadAsync } from "@/store/slices/emailSlice";
import { createToolExecutionAsync } from "@/store/slices/toolExecutionSlice";
import { AuthorType, Email } from "@/types/email";
import { AppStackParamList } from "@/types/navigation";
import { ParameterType, ToolEndpointAction } from "@/types/toolExecution";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { useDispatch } from "react-redux";

interface EmailContextViewProps {
  emails: Email[];
  extraHeightDeduction?: number;
}

export const EmailContextView: React.FC<EmailContextViewProps> = ({
  emails,
  extraHeightDeduction = 0,
}) => {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const dispatch = useDispatch<AppDispatch>();
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const styles = createStyles(colors, height);

  // State to track which emails are expanded
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  // Initialize expanded emails - only the latest email should be expanded initially
  useEffect(() => {
    if (emails && emails.length > 0) {
      // Sort emails by date to find the latest one
      const sortedEmails = [...emails].sort(
        (a, b) => new Date(a.sent).getTime() - new Date(b.sent).getTime()
      );
      const latestEmail = sortedEmails[sortedEmails.length - 1];

      // Set only the latest email as expanded
      setExpandedEmails(new Set([latestEmail.id]));
    }
  }, [emails]);

  // Toggle email expansion
  const toggleEmailExpansion = (emailId: string) => {
    setExpandedEmails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(emailId)) {
        newSet.delete(emailId);
      } else {
        newSet.add(emailId);
      }
      return newSet;
    });
  };

  // Handle reply to email
  const handleReply = async (email: Email) => {
    try {
      // Create a new tool execution for composing a reply
      const toolExecution = await dispatch(
        createToolExecutionAsync({
          toolEndpointAction: ToolEndpointAction.GMAIL_SEND,
          input: [
            {
              parameterId: "to",
              type: ParameterType.ARRAY,
              value: JSON.stringify([
                {
                  id:
                    email.from.meta?.email ||
                    email.from.externalId ||
                    "unknown",
                  email: email.from.meta?.email || "unknown@example.com",
                },
                ...email.to
                  .filter((item) => item.type !== AuthorType.PROFILE)
                  .map((email) => ({
                    id: email.externalId,
                    email: email.meta?.email,
                  })),
              ]),
            },
            {
              parameterId: "subject",
              type: ParameterType.STRING,
              value: email.subject ? `Re: ${email.subject}` : "Re: ",
            },
            {
              parameterId: "threadId",
              type: ParameterType.STRING,
              value: email.threadId,
            },
            {
              parameterId: "referenceEmailId",
              type: ParameterType.STRING,
              value: email.emailId,
            },
            {
              parameterId: "externalEmailId",
              type: ParameterType.STRING,
              value: email.externalIdentifier.resourceId,
            },
            {
              parameterId: "referenceDfEmailId",
              type: ParameterType.STRING,
              value: email.id,
            },
            {
              parameterId: "body",
              type: ParameterType.ARRAY,
              value: JSON.stringify([
                {
                  body: "",
                  type: "text/html",
                },
              ]),
            },
            {
              parameterId: "cc",
              type: ParameterType.ARRAY,
              value: JSON.stringify(
                email.cc
                  .filter((item) => item.type !== AuthorType.PROFILE)
                  .map((email) => ({
                    id: email.externalId,
                    email: email.meta?.email,
                  }))
              ),
            },
            {
              parameterId: "bcc",
              type: ParameterType.ARRAY,
              value: "[]",
            },
            {
              parameterId: "attachments",
              type: ParameterType.ARRAY,
              value: "[]",
            },
          ],
          internalListeners: [],
        })
      ).unwrap();

      // Navigate to the tool execution screen
      navigation.navigate("ToolExecution", {
        toolExecutionId: toolExecution.id,
        isReplyEdit: true,
        canBeDeleted: true,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to create reply. Please try again.");
    }
  };

  // Mark emails as read when component renders
  useEffect(() => {
    if (emails && emails.length > 0) {
      // Get the threadId from the first email (all emails in a thread should have the same threadId)
      const threadId = emails[0]?.threadId;

      if (threadId) {
        // Mark the thread as read by passing the threadId
        dispatch(markEmailAsReadAsync(threadId)).catch((error) => {
          console.warn("Failed to mark email thread as read:", error);
        });
      }
    }
  }, [emails, dispatch]);

  // Get the available width for the WebView (account for padding)
  const getWebViewWidth = () => {
    // Account for horizontal padding from emailItem (16px on each side)
    return width - 32;
  };

  // Calculate dynamic height for WebView based on available space
  const getWebViewHeight = () => {
    // Account for email header (~60px), outgoing indicator (~20px), and some buffer
    const headerHeight = 60;
    const indicatorHeight = 20;
    const buffer = 150;

    // Use a reasonable portion of the screen height, but cap it
    const minHeight = 800; // Minimum height to ensure content is visible

    return Math.max(
      minHeight,
      height - headerHeight - indicatorHeight - buffer - extraHeightDeduction
    );
  };

  const [webViewHeight, setWebViewHeight] = useState(200);

  if (!emails || emails.length === 0) {
    return (
      <View style={styles.noEmailsContainer}>
        <MaterialIcons name="email" size={24} color={colors.textSecondary} />
        <Text style={styles.noEmailsText}>No emails found</Text>
      </View>
    );
  }

  const formatTimestamp = (dateInput: string | Date) => {
    const date = new Date(dateInput);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const itemDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    const timeString = date.toLocaleTimeString([], timeOptions);

    // If it's today, show only time
    if (itemDate.getTime() === today.getTime()) {
      return timeString;
    }

    // If it's before today, show time then date
    const dateOptions: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    };

    const dateString = date.toLocaleDateString([], dateOptions);
    return `${timeString} • ${dateString}`;
  };

  const renderEmailContent = (email: Email, isOpen: boolean) => {
    // First filter for uniqueness to avoid duplicate content
    const uniqueContent = email.message.content.filter(
      (content, index, array) =>
        array.findIndex(
          (c) => c.type === content.type && c.body === content.body
        ) === index
    );

    // Extract HTML content from the message
    const htmlContent = uniqueContent
      .filter(
        (content) => content.type === "text/html" || content.type === "html"
      )
      .map((content) => content.body)
      .join("");

    // If no HTML content, try text content
    const textContent = uniqueContent
      .filter((content) => content.type === "text")
      .map((content) => content.body)
      .join(" ");

    const contentToRender = htmlContent || textContent;

    if (!contentToRender) {
      return <Text style={styles.emailContent}>No content available</Text>;
    }

    // Basic HTML sanitization - remove only dangerous elements
    const sanitizeHtml = (html: string) => {
      return html
        .replace(/javascript:/gi, "") // Remove javascript: urls
        .replace(/<script[^>]*>.*?<\/script>/gi, ""); // Remove script tags but keep style tags
    };

    const sanitizedContent = htmlContent
      ? sanitizeHtml(contentToRender)
      : contentToRender;

    // State to track WebView height

    // Show full content for newest email, truncated for others
    if (isOpen) {
      if (htmlContent) {
        // Create HTML with proper viewport and mobile-optimized styling
        const htmlWithViewport = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  font-size: 14px;
                  line-height: 1.4;
                  word-wrap: break-word;
                  overflow-wrap: break-word;
                  max-width: 100%;
                  ${
                    isDark
                      ? `
                    background-color: ${colors.surface} !important;
                    color: ${colors.text} !important;
                  `
                      : ""
                  }
                }
                ${
                  isDark
                    ? `
                  /* Dark mode styles */
                  * {
                    color: ${colors.text} !important;
                    background-color: transparent !important;
                  }
                  
                  /* Ensure text remains readable */
                  p, div, span, td, th, li, a, strong, em, b, i {
                    color: ${colors.text} !important;
                    background-color: transparent !important;
                  }
                  
                  /* Handle links */
                  a {
                    color: ${colors.primary} !important;
                  }
                  
                  /* Handle tables and their elements */
                  table, tr, td, th {
                    background-color: transparent !important;
                    border-color: ${colors.border} !important;
                  }
                  
                  /* Handle elements with specific background colors */
                  [style*="background-color"] {
                    background-color: transparent !important;
                  }
                  
                  /* Handle elements with specific text colors */
                  [style*="color"] {
                    color: ${colors.text} !important;
                  }
                  
                  /* Special handling for white or light colored text */
                  [style*="color: white"],
                  [style*="color: #ffffff"],
                  [style*="color: #fff"] {
                    color: ${colors.textSecondary} !important;
                  }
                `
                    : ""
                }
                img {
                  max-width: 100% !important;
                  height: auto !important;
                  ${isDark ? "opacity: 0.9;" : ""}
                }
                table {
                  max-width: 100% !important;
                  table-layout: fixed;
                }
                .gmail_quote {
                  margin: 0;
                  padding: 0;
                }
              </style>
            </head>
            <body>
              ${sanitizedContent}
              <script>
                // Measure content height and send to React Native
                function measureHeight() {
                  const height = document.body.scrollHeight;
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'height',
                    height: height
                  }));
                }
                
                // Measure on load and after a short delay to handle dynamic content
                window.addEventListener('load', function() {
                  setTimeout(measureHeight, 100);
                });
                
                // Also measure when images load
                document.addEventListener('DOMContentLoaded', function() {
                  const images = document.querySelectorAll('img');
                  let loadedImages = 0;
                  
                  if (images.length === 0) {
                    measureHeight();
                  } else {
                    images.forEach(img => {
                      if (img.complete) {
                        loadedImages++;
                        if (loadedImages === images.length) {
                          measureHeight();
                        }
                      } else {
                        img.addEventListener('load', function() {
                          loadedImages++;
                          if (loadedImages === images.length) {
                            measureHeight();
                          }
                        });
                      }
                    });
                  }
                });
              </script>
            </body>
          </html>
        `;

        return (
          <View
            style={[
              styles.webViewContainer,
              {
                width: getWebViewWidth(),
                height: webViewHeight,
              },
            ]}
          >
            <WebView
              source={{ html: htmlWithViewport }}
              style={[
                styles.webView,
                { width: getWebViewWidth(), height: webViewHeight },
              ]}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              originWhitelist={["*"]}
              javaScriptEnabled={true}
              domStorageEnabled={false}
              startInLoadingState={false}
              scalesPageToFit={false}
              onMessage={(event) => {
                try {
                  const data = JSON.parse(event.nativeEvent.data);
                  if (data.type === "height") {
                    setWebViewHeight(data.height + 50);
                  }
                } catch (error) {
                  console.warn("Failed to parse WebView message:", error);
                }
              }}
              onLoadEnd={() => {
                // WebView has finished loading
              }}
            />
          </View>
        );
      } else {
        return <Text style={styles.emailContent}>{sanitizedContent}</Text>;
      }
    } else {
      // For preview, convert HTML to plain text and truncate
      const plainTextPreview = sanitizedContent
        .replace(/<[^>]*>/g, " ") // Remove HTML tags
        .replace(/\s+/g, " ") // Normalize whitespace
        .trim()
        .substring(0, 200);

      return (
        <Text style={styles.emailContent} numberOfLines={1}>
          {plainTextPreview}
        </Text>
      );
    }
  };

  // Sort emails by date (oldest first, newest at bottom)
  const sortedEmails = [...emails].sort(
    (a, b) => new Date(a.sent).getTime() - new Date(b.sent).getTime()
  );

  return (
    <View
      style={[
        styles.container,
        {
          height: getWebViewHeight(),
          maxHeight: getWebViewHeight(),
        },
      ]}
    >
      <ScrollView
        style={styles.emailsContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        // Auto-scroll to beginning of newest email
        ref={(ref) => {
          if (ref && sortedEmails.length > 1) {
            setTimeout(() => {
              // Calculate approximate position of the newest email
              // Since emails are collapsed initially, each email item has roughly 80px height
              const newestEmailPosition = (sortedEmails.length - 1) * 80;
              ref.scrollTo({ y: newestEmailPosition, animated: true });
            }, 100);
          }
        }}
      >
        {sortedEmails.map((email, index) => {
          const isExpanded = expandedEmails.has(email.id);
          return (
            <View key={email.id} style={[styles.emailItem]}>
              <TouchableOpacity
                style={styles.emailHeader}
                onPress={() => toggleEmailExpansion(email.id)}
                activeOpacity={0.7}
              >
                <View style={styles.emailHeaderLeft}>
                  <CustomAvatar
                    alt={
                      email.isOutgoing
                        ? "You"
                        : email.from.meta?.name ||
                          email.from.meta?.email ||
                          "Unknown"
                    }
                    size={40}
                  />
                  <View style={styles.emailInfo}>
                    <Text style={styles.emailSender}>
                      {email.isOutgoing
                        ? "You"
                        : email.from.meta?.name ||
                          email.from.meta?.email ||
                          "Unknown"}
                    </Text>
                    <Text style={styles.emailReceivers}>
                      to{" "}
                      {email.to.length > 0
                        ? `${email.to
                            .map((recipient) =>
                              recipient.type === "profile"
                                ? "me"
                                : recipient.meta?.name ||
                                  recipient.meta?.email ||
                                  "Unknown"
                            )
                            .join(", ")}`
                        : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.emailHeaderRight}>
                  <Text style={styles.emailTimestamp}>
                    {formatTimestamp(email.sent)}
                  </Text>
                  <MaterialIcons
                    name={isExpanded ? "expand-less" : "expand-more"}
                    size={20}
                    color={colors.textSecondary}
                  />
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleReply(email)}
                  >
                    <MaterialIcons
                      name="reply"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MaterialIcons
                      name="more-vert"
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>

              <View style={styles.emailContentWrapper}>
                {renderEmailContent(email, isExpanded)}
              </View>

              {email.isOutgoing && (
                <View style={styles.outgoingIndicator}>
                  <MaterialIcons name="send" size={14} color={colors.primary} />
                  <Text style={styles.outgoingText}>Sent</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: any, height: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      minHeight: "100%",
    },
    emailsContainer: {
      flex: 1,
    },
    scrollContentContainer: {
      flexGrow: 1,
    },
    emailItem: {
      backgroundColor: colors.surface,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    emailHeader: {
      marginTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
      paddingVertical: 4,
    },
    emailHeaderLeft: {
      flexDirection: "row",
      alignItems: "flex-start",
      flex: 1,
      gap: 12,
    },
    emailHeaderRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    emailInfo: {
      flex: 1,
      flexDirection: "column",
      justifyContent: "flex-start",
    },
    emailSender: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },
    emailReceivers: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emailTimestamp: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    actionButton: {
      padding: 4,
      borderRadius: 4,
    },
    emailSubject: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.text,
      marginBottom: 6,
    },
    newestEmailSubject: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
    },
    emailContent: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 14,
      marginBottom: 8,
    },
    readMoreText: {
      color: colors.primary,
      fontWeight: "500",
    },
    outgoingIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 4,
    },
    outgoingText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "500",
    },
    newestIndicator: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 8,
      gap: 4,
    },
    newestText: {
      fontSize: 11,
      color: colors.primary,
      fontWeight: "600",
    },
    noEmailsContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    noEmailsText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
    },
    emailContentWrapper: {
      minHeight: 0,
    },
    webViewContainer: {
      minHeight: 800,
    },
    webView: {
      backgroundColor: "transparent",
      padding: 0,
    },
    collapsedIndicator: {
      paddingVertical: 8,
      alignItems: "center",
    },
    collapsedText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: "italic",
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
  });
