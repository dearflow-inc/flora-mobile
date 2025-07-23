import { useTheme } from "@/hooks/useTheme";
import React, { useEffect, useRef, useState } from "react";
import { Keyboard, StyleSheet, TextInput, View } from "react-native";
import { RichEditor } from "react-native-pell-rich-editor";
import FixedRichEditor from "./FixedRichEditor";

interface EmailBodyProps {
  subject?: string;
  body: string;
  onSubjectChange: (text: string) => void;
  onBodyChange: (text: string) => void;
  disabled?: boolean;
  hideSubject?: boolean;
}

export const EmailBody: React.FC<EmailBodyProps> = ({
  subject,
  body,
  onSubjectChange,
  onBodyChange,
  disabled = false,
  hideSubject = false,
}) => {
  // Debug logging to see what's being passed
  const { colors } = useTheme();
  const [bodyHeight, setBodyHeight] = useState(100); // Start with minHeight
  const styles = createStyles(colors, bodyHeight);
  const touchStartY = useRef<number | null>(null);
  const touchStartTime = useRef<number | null>(null);
  const richTextRef = useRef<RichEditor>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [bodyHash, setBodyHash] = useState(0);

  // Update rich editor content when body prop changes
  useEffect(() => {
    if (!isEditing && richTextRef.current && body !== undefined) {
      richTextRef.current.setContentHTML(body || "");
    }
  }, [body]);

  // Create a stable hash for the body content that only changes when body actually changes
  useEffect(() => {
    if (!isEditing) {
      const bodyStr = body || "";
      setBodyHash(bodyStr.length + (bodyStr ? bodyStr.charCodeAt(0) : 0));
    }
  }, [body, isEditing]);

  const handleTouchStart = (event: any) => {
    if (event?.nativeEvent?.pageY !== undefined) {
      touchStartY.current = event.nativeEvent.pageY;
      touchStartTime.current = Date.now();
    }
  };

  const [canOpenKeyboard, setCanOpenKeyboard] = useState(true);

  const handleTouchMove = (event: any) => {
    if (touchStartY.current === null || touchStartTime.current === null) return;
    if (event?.nativeEvent?.pageY === undefined) return;

    const currentY = event.nativeEvent.pageY;
    const currentTime = Date.now();
    const deltaY = currentY - touchStartY.current;
    const deltaTime = currentTime - touchStartTime.current;

    // Calculate velocity (pixels per millisecond)
    const velocity = Math.abs(deltaY) / deltaTime;

    // If swiped up fast (high velocity) and moved more than 20px, dismiss keyboard
    if ((deltaY < -20 || deltaY > 20) && (velocity > 0.5 || velocity < -0.5)) {
      // 0.5 pixels per millisecond = fast swipe
      Keyboard.dismiss();
      setCanOpenKeyboard(false);
      setTimeout(() => {
        setCanOpenKeyboard(true);
      }, 500);
      touchStartY.current = null;
      touchStartTime.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartY.current = null;
    touchStartTime.current = null;
  };

  const handleRichTextChange = (text: any) => {
    // Ensure text is a string and handle any potential array input
    if (typeof text === "string") {
      onBodyChange(text);
    } else if (Array.isArray(text)) {
      // If it's an array, join it into a string
      onBodyChange(text.join(""));
    } else {
      // Fallback to empty string if neither string nor array
      onBodyChange("");
    }
  };

  return (
    <View style={styles.container}>
      {/* Subject */}
      {!hideSubject && (
        <TextInput
          style={[styles.subjectInput, disabled && styles.inputDisabled]}
          value={subject}
          onChangeText={onSubjectChange}
          placeholder="Subject"
          placeholderTextColor={colors.textSecondary}
          editable={!disabled}
        />
      )}

      <View
        style={[styles.richTextContainer, disabled && styles.inputDisabled]}
      >
        <FixedRichEditor
          ref={richTextRef}
          key={`rich-editor-${bodyHash || 0}`}
          style={[styles.richTextEditor, { height: bodyHeight || 100 }]}
          initialContentHTML={body || ""}
          onChange={handleRichTextChange}
          placeholder="Write your email here..."
          disabled={!!disabled || !canOpenKeyboard}
          editorStyle={{
            backgroundColor: colors.background || "#ffffff",
            color: colors.text || "#000000",
            contentCSSText: `
              p { margin: 0; padding: 0; }
              div { margin: 0; padding: 0; }
              br { margin: 0; padding: 0; }
            `,
          }}
          onFocus={() => setIsEditing(true)}
          onBlur={() => {
            setIsEditing(false);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: any, bodyHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    subjectInput: {
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    bodyInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 12,
      textAlignVertical: "top",
      height: bodyHeight,
    },
    richTextContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    richTextEditor: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 3,
      paddingVertical: 0,
    },
    richTextToolbar: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    toolbarIcon: {
      fontSize: 12,
      fontWeight: "bold",
    },
    inputDisabled: {
      opacity: 0.6,
    },
  });
