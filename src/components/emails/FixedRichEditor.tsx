import React from "react";
import { RichEditor as OriginalRichEditor } from "react-native-pell-rich-editor";

interface FixedRichEditorProps {
  [key: string]: any;
}

const FixedRichEditor = React.forwardRef<
  OriginalRichEditor,
  FixedRichEditorProps
>((props, ref) => {
  return (
    <OriginalRichEditor {...props} ref={ref} dataDetectorTypes={["none"]} />
  );
});

FixedRichEditor.displayName = "FixedRichEditor";

export default FixedRichEditor;
