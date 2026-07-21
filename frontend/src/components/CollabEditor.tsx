import { useEffect, useMemo, useState } from "react";
import { useRef } from "react";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import * as Y from "yjs";
import { FileText, LogOut, Plus } from "lucide-react";
import { CustomYjsProvider } from "../lib/CustomYjsProvider";
import ConfirmDialog from "./ConfirmDialog";

const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || "ws://127.0.0.1:8000";
const AVATAR_COLORS = ["#F97316", "#8B5CF6", "#EC4899", "#3B82F6", "#F59E0B"];

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

interface Peer {
  clientId: string;
  name: string;
  color: string;
}

interface CollabEditorProps {
  documentId: string;
  token: string;
  onLogout: () => void;
  onUnauthorized: () => void;
  onNewDocument: () => void;
}

export default function CollabEditor({ documentId, token, onLogout, onUnauthorized, onNewDocument }: CollabEditorProps) {
  const ydoc = useMemo(() => new Y.Doc(), [documentId]);
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState<Peer[]>([]);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const clientId = useMemo(() => randomId(), []);
  const myColor = useMemo(() => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], []);
  const myName = useMemo(() => `User-${clientId.slice(0, 4)}`, [clientId]);

  useEffect(() => {
    const provider = new CustomYjsProvider(documentId, ydoc, WS_BASE_URL, clientId, token, () => {
      onUnauthorized();
    });
    setIsConnected(true);
    provider.subscribePresence(setPeers);

    const announce = () => provider.sendPresence(myName, myColor);
    const timeout = setTimeout(announce, 300);
    const interval = setInterval(announce, 15000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      provider.destroy();
      setIsConnected(false);
    };
  }, [documentId, ydoc, token]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),

      Collaboration.configure({
        document: ydoc,
        field: "content",
      }),

      Placeholder.configure({
        placeholder: "Enter the text here...",
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-slate-400 before:pointer-events-none before:absolute before:left-0 before:top-0",
      }),
    ],
  }, [ydoc]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-50">
      <header className="bg-gradient-to-r from-teal-500 to-teal-600 px-6 py-3.5 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
            <FileText size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{documentId}</p>
            <p className="text-xs text-teal-50 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-300" : "bg-white/40"}`} />
              {isConnected ? "Connected" : "Connecting…"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onNewDocument} title="Start a new document"
            className="flex items-center gap-1.5 text-xs font-medium text-white bg-white/15 hover:bg-white/25
              px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={14} /> New Document
          </button>

          {peers.length > 0 && (
            <div className="flex items-center -space-x-2">
              {peers.map((p) => (
                <span key={p.clientId} title={p.name}
                  className="w-8 h-8 rounded-full border-2 border-teal-500 flex items-center justify-center text-[10px] text-white font-bold shadow-sm"
                  style={{ backgroundColor: p.color }}>
                  {p.name.slice(-2).toUpperCase()}
                </span>
              ))}
            </div>
          )}
          <button onClick={() => setShowLogoutConfirm(true)} title="Log out"
            className="p-2 rounded-lg text-white/90 hover:text-white hover:bg-white/15 transition-colors">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto h-full">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full overflow-hidden flex flex-col">
            <div className="h-1.5 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 shrink-0" />
            <div
              ref={editorContainerRef}
              className="p-8 flex-1 overflow-y-auto cursor-text"
              onClick={() => editor?.commands.focus()}
            >
              <EditorContent
                editor={editor}
                className="max-w-none min-h-full"
              />
            </div>
          </div>
        </div>
      </main>

      {showLogoutConfirm && (
        <ConfirmDialog
          title="Log out?"
          message="You'll need to log in again to access your documents."
          confirmLabel="Log out"
          onConfirm={() => { setShowLogoutConfirm(false); onLogout(); }}
          onCancel={() => setShowLogoutConfirm(false)}
        />
      )}
    </div>
  );
}