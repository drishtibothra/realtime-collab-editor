import asyncio
from pycrdt import Doc, Text
from app.persistence_service import load_snapshot_sync, save_snapshot_sync


class DocumentManager:
    def __init__(self):
        self.documents: dict[str, Doc] = {}

    async def get_or_load(self, document_id: str) -> Doc:
        if document_id in self.documents:
            return self.documents[document_id]

        doc = Doc()
        doc["content"] = Text()

        persisted_state = await asyncio.to_thread(load_snapshot_sync, document_id)
        if persisted_state:
            doc.apply_update(persisted_state)

        self.documents[document_id] = doc
        return doc

    def get_full_state(self, document_id: str) -> bytes:
        doc = self.documents.get(document_id)
        return doc.get_update() if doc else b""

    def apply_update(self, document_id: str, update: bytes):
        doc = self.documents.get(document_id)
        if doc:
            doc.apply_update(update)

    def get_text_snapshot(self, document_id: str) -> str:
        doc = self.documents.get(document_id)
        return str(doc["content"]) if doc else ""

    async def persist(self, document_id: str):
        doc = self.documents.get(document_id)
        if not doc:
            print(f"[PERSIST] No in-memory doc found for '{document_id}' — nothing to save.")
            return
        print(f"[DEBUG] Doc keys: {list(doc.keys())}")  
        state = doc.get_update()
        preview = str(doc["content"])
        print(f"[PERSIST] Saving '{document_id}' — content preview: {preview!r}, state size: {len(state)} bytes")
        await asyncio.to_thread(save_snapshot_sync, document_id, state, preview)
        print(f"[PERSIST] Save call completed for '{document_id}'")

    def evict(self, document_id: str):
        self.documents.pop(document_id, None)


document_manager = DocumentManager()