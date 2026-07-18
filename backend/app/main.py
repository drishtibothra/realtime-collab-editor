from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.connection_manager import manager

app = FastAPI(title="Real-Time Collaborative Editor")


@app.get("/")
def root():
    return {"message": "Collab editor relay is running"}


@app.websocket("/ws/{document_id}")
async def document_websocket(websocket: WebSocket, document_id: str):
    await manager.connect(document_id, websocket)
    print(f"Client connected to document '{document_id}'. Total: {manager.connection_count(document_id)}")

    try:
        while True:
            message = await websocket.receive_text()
            await manager.broadcast(document_id, message, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(document_id, websocket)
        print(f"Client disconnected from document '{document_id}'. Remaining: {manager.connection_count(document_id)}")