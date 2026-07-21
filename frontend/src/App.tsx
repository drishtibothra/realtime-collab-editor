import { useState, useEffect } from "react";
import AuthPage from "./components/AuthPage";
import CollabEditor from "./components/CollabEditor";

const TOKEN_STORAGE_KEY = "collab_editor_token";

function getOrCreateDocumentId(): string {
  const params = new URLSearchParams(window.location.search);
  const existing = params.get("doc");
  if (existing) return existing;

  const fresh = crypto.randomUUID().slice(0, 8);
  const url = new URL(window.location.href);
  url.searchParams.set("doc", fresh);
  window.history.replaceState({}, "", url.toString());
  return fresh;
}

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [documentId, setDocumentId] = useState<string>(getOrCreateDocumentId);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) setToken(stored);
    setIsBootstrapping(false);
  }, []);

  const handleLogin = (newToken: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  };

  const handleNewDocument = () => {
    const fresh = crypto.randomUUID().slice(0, 8);
    const url = new URL(window.location.href);
    url.searchParams.set("doc", fresh);
    window.history.replaceState({}, "", url.toString());
    setDocumentId(fresh);
  };

  if (isBootstrapping) {
    return <div className="h-screen w-screen flex items-center justify-center text-slate-400 text-sm">Loading…</div>;
  }

  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <CollabEditor
      documentId={documentId}
      token={token}
      onLogout={handleLogout}
      onUnauthorized={handleLogout}
      onNewDocument={handleNewDocument}
    />
  );
}