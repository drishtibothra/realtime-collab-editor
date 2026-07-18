import CollabEditor from "./components/CollabEditor";

export default function App() {
  const params = new URLSearchParams(window.location.search);
  const documentId = params.get("doc") || "test-doc-1";

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h2>Collaborative Editor</h2>
      <CollabEditor documentId={documentId} />
    </div>
  );
}