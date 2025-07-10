import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { MaterialIcons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import { useTheme } from "@/hooks/useTheme";
import { Email } from "@/types/email";
import { CustomAvatar } from "@/components/ui/CustomAvatar";
import { markEmailAsReadAsync } from "@/store/slices/emailSlice";
import { AppDispatch } from "@/store";

interface EmailContextViewProps {
  emails: Email[];
}

export const EmailContextView: React.FC<EmailContextViewProps> = ({
  emails,
}) => {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const dispatch = useDispatch<AppDispatch>();
  const styles = createStyles(colors, height);

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
                  padding: 0 0 30px 0;
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
            </body>
          </html>
        `;

        return (
          <View
            style={[
              styles.webViewContainer,
              {
                height: "100%",
                width: getWebViewWidth(),
              },
            ]}
          >
            <WebView
              source={{ html: htmlWithViewport }}
              style={[styles.webView, { width: getWebViewWidth() }]}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              originWhitelist={["*"]}
              javaScriptEnabled={false}
              domStorageEnabled={false}
              startInLoadingState={false}
              scalesPageToFit={false}
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
        <Text style={styles.emailContent}>
          {plainTextPreview}
          <Text style={styles.readMoreText}> ... Read more</Text>
        </Text>
      );
    }
  };

  // Sort emails by date (oldest first, newest at bottom)
  const sortedEmails = [...emails].sort(
    (a, b) => new Date(a.sent).getTime() - new Date(b.sent).getTime()
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.emailsContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        // Auto-scroll to beginning of newest email
        ref={(ref) => {
          if (ref && sortedEmails.length > 1) {
            setTimeout(() => {
              // Calculate approximate position of the newest email
              // Each email item has roughly 120px height, scroll to show the newest email at top
              const newestEmailPosition = (sortedEmails.length - 1) * 120;
              ref.scrollTo({ y: newestEmailPosition, animated: true });
            }, 100);
          }
        }}
      >
        {sortedEmails.map((email, index) => {
          return (
            <View key={email.id} style={[styles.emailItem]}>
              <View style={styles.emailHeader}>
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
                  <TouchableOpacity style={styles.actionButton}>
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
              </View>

              <View style={styles.emailContentWrapper}>
                {renderEmailContent(email, true)}
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
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 12,
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
      color: colors.text,
      lineHeight: 20,
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
    emailContentWrapper: {},
    webViewContainer: {},
    webView: {
      backgroundColor: "transparent",
      padding: 0,
    },
  });
