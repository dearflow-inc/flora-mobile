import React from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { WebView } from "react-native-webview";
import { useTheme } from "@/hooks/useTheme";

interface HtmlPreviewProps {
  htmlContent: string;
  height?: number;
  style?: any;
}

export const HtmlPreview: React.FC<HtmlPreviewProps> = ({
  htmlContent,
  height = 200,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const styles = createStyles(colors, height);

  // Get the available width for the WebView (account for padding)
  const getWebViewWidth = () => {
    return width - 32; // Account for horizontal padding
  };

  if (!htmlContent || htmlContent.trim() === "") {
    return (
      <View style={[styles.emptyContainer, style]}>
        <View style={styles.emptyContent}>
          {/* Empty state - could add an icon here */}
        </View>
      </View>
    );
  }

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
            padding: 16px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 16px;
            line-height: 1.5;
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
          
          /* Rich text editor specific styles */
          .rich-editor-content {
            outline: none;
            min-height: 100px;
          }
          
          /* Ensure proper spacing for common elements */
          p {
            margin: 0 0 8px 0;
          }
          
          h1, h2, h3, h4, h5, h6 {
            margin: 16px 0 8px 0;
            font-weight: 600;
          }
          
          ul, ol {
            margin: 8px 0;
            padding-left: 20px;
          }
          
          li {
            margin: 4px 0;
          }
          
          blockquote {
            margin: 8px 0;
            padding-left: 16px;
            border-left: 4px solid ${colors.primary};
            font-style: italic;
          }
          
          code {
            background-color: ${
              isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
            };
            padding: 2px 4px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 14px;
          }
          
          pre {
            background-color: ${
              isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
            };
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 8px 0;
          }
          
          pre code {
            background-color: transparent;
            padding: 0;
          }
        </style>
      </head>
      <body>
        <div class="rich-editor-content">
          ${htmlContent}
        </div>
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlWithViewport }}
        style={[styles.webView, { width: getWebViewWidth(), height }]}
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
};

const createStyles = (colors: any, height: number) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      overflow: "hidden",
    },
    webView: {
      backgroundColor: "transparent",
    },
    emptyContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      height,
      justifyContent: "center",
      alignItems: "center",
    },
    emptyContent: {
      // Empty state styling
    },
  });
