from pycrdt import Doc, Text


class DocumentManager:
    def __init__(self):
        # Maps document_id -> the authoritative, server-side merged Doc
        self.documents: dict[str, Doc] = {}

    def _get_or_create(self, document_id: str) -> Doc:
        if document_id not in self.documents:
            doc = Doc()
            doc["content"] = Text()
            self.documents[document_id] = doc
        return self.documents[document_id]

    def get_full_state(self, document_id: str) -> bytes:
        doc = self._get_or_create(document_id)
        return doc.get_update()

    def apply_update(self, document_id: str, update: bytes):
        doc = self._get_or_create(document_id)
        doc.apply_update(update)

    def get_text_snapshot(self, document_id: str) -> str:
        doc = self._get_or_create(document_id)
        return str(doc["content"])


document_manager = DocumentManager()