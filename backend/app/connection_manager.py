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

    async def send_to_one(self, websocket: WebSocket, data: bytes):
        await websocket.send_bytes(data)

    async def broadcast(self, document_id: str, data: bytes, sender: WebSocket):
        if document_id not in self.active_connections:
            return
        for connection in self.active_connections[document_id]:
            if connection != sender:
                await connection.send_bytes(data)

    def connection_count(self, document_id: str) -> int:
        return len(self.active_connections.get(document_id, []))


manager = ConnectionManager()