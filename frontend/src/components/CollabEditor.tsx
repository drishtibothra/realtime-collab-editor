import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { CustomYjsProvider } from "../lib/CustomYjsProvider";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";

export default function CollabEditor({ documentId }: { documentId: string }) {
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const provider = new CustomYjsProvider(documentId, ydoc, WS_BASE_URL);
    setIsConnected(true);

    return () => {
      provider.destroy();
      setIsConnected(false);
    };
  }, [documentId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }), 
      Collaboration.configure({ document: ydoc }),
    ],
  }, [ydoc]);

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
      <p style={{ fontSize: 12, color: isConnected ? "green" : "gray" }}>
        {isConnected ? "● Connected" : "○ Connecting..."} — Document: {documentId}
      </p>
      <EditorContent editor={editor} />
    </div>
  );
}