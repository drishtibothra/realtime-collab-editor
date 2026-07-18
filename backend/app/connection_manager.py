from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, document_id: str, websocket: WebSocket):
        await websocket.accept()
        if document_id not in self.active_connections:
            self.active_connections[document_id] = []
        self.active_connections[document_id].append(websocket)

    def disconnect(self, document_id: str, websocket: WebSocket):
        if document_id in self.active_connections:
            self.active_connections[document_id].remove(websocket)
            if not self.active_connections[document_id]:
                del self.active_connections[document_id]

    async def broadcast_bytes(self, document_id: str, data: bytes, sender: WebSocket):
        for connection in self.active_connections.get(document_id, []):
            if connection != sender:
                await connection.send_bytes(data)

    async def broadcast_text(self, document_id: str, text: str, sender: WebSocket | None = None):
        for connection in self.active_connections.get(document_id, []):
            if sender is None or connection != sender:
                await connection.send_text(text)

    def connection_count(self, document_id: str) -> int:
        return len(self.active_connections.get(document_id, []))


manager = ConnectionManager()