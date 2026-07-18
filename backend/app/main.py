from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.connection_manager import manager
from app.document_manager import document_manager

app = FastAPI(title="Real-Time Collaborative Editor")


@app.get("/")
def root():
    return {"message": "Collab editor relay is running"}


@app.websocket("/ws/{document_id}")
async def document_websocket(websocket: WebSocket, document_id: str):
    await manager.connect(document_id, websocket)
    print(f"Client connected to '{document_id}'. Total: {manager.connection_count(document_id)}")

    # Catch the new client up on the current merged state immediately
    full_state = document_manager.get_full_state(document_id)
    if full_state:
        await manager.send_to_one(websocket, full_state)

    try:
        while True:
            update = await websocket.receive_bytes()
            document_manager.apply_update(document_id, update)
            await manager.broadcast(document_id, update, sender=websocket)
    except WebSocketDisconnect:
        manager.disconnect(document_id, websocket)
        print(f"Client disconnected from '{document_id}'. Remaining: {manager.connection_count(document_id)}")
        print(f"Current content snapshot: {document_manager.get_text_snapshot(document_id)!r}")