import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { CustomYjsProvider } from "../lib/CustomYjsProvider";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";
const COLORS = ["#F87171", "#34D399", "#60A5FA", "#FBBF24", "#A78BFA"];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

interface Peer {
  clientId: string;
  name: string;
  color: string;
}

export default function CollabEditor({ documentId }: { documentId: string }) {
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);

  const clientId = useMemo(() => randomId(), []);
  const myColor = useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], []);
  const myName = useMemo(() => `User-${clientId.slice(0, 4)}`, [clientId]);

  useEffect(() => {
    const provider = new CustomYjsProvider(documentId, ydoc, WS_BASE_URL, clientId);
    setIsConnected(true);
    provider.subscribePresence(setPeers);

    const announce = () => provider.sendPresence(myName, myColor);
    const timeout = setTimeout(announce, 300);
    const interval = setInterval(announce, 5000); // keeps Redis TTL alive

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      provider.destroy();
      setIsConnected(false);
    };
  }, [documentId, ydoc]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ history: false }),
      Collaboration.configure({
        document: ydoc,
        field: "content",  
      }),
    ],
  }, [ydoc]);

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 12, color: isConnected ? "green" : "gray", margin: 0 }}>
          {isConnected ? "● Connected" : "○ Connecting..."} — Document: {documentId}
        </p>
        <div style={{ display: "flex", gap: 4 }}>
          {peers.map((p) => (
            <span key={p.clientId} title={p.name}
              style={{
                width: 20, height: 20, borderRadius: "50%", backgroundColor: p.color,
                color: "white", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center"
              }}>
              {p.name.slice(-2)}
            </span>
          ))}
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}