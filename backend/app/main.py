import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.connection_manager import manager
from app.document_manager import document_manager
from app.presence_manager import presence_manager

app = FastAPI(title="Real-Time Collaborative Editor")


@app.get("/")
def root():
    return {"message": "Collab editor relay is running"}


@app.websocket("/ws/{document_id}")
async def document_websocket(websocket: WebSocket, document_id: str):
    await manager.connect(document_id, websocket)
    client_id: str | None = None

    full_state = document_manager.get_full_state(document_id)
    if full_state:
        await websocket.send_bytes(full_state)

    existing_peers = await presence_manager.get_all(document_id)
    if existing_peers:
        await websocket.send_text(json.dumps({"type": "presence_snapshot", "peers": existing_peers}))

    try:
        while True:
            message = await websocket.receive()

            if message.get("bytes") is not None:
                update = message["bytes"]
                document_manager.apply_update(document_id, update)
                await manager.broadcast_bytes(document_id, update, sender=websocket)

            elif message.get("text") is not None:
                payload = json.loads(message["text"])
                if payload.get("type") == "presence":
                    client_id = payload["clientId"]
                    await presence_manager.upsert(document_id, client_id, payload)
                    await manager.broadcast_text(document_id, message["text"], sender=websocket)

    except WebSocketDisconnect:
        manager.disconnect(document_id, websocket)
        if client_id:
            await presence_manager.remove(document_id, client_id)
            await manager.broadcast_text(document_id, json.dumps({"type": "presence_leave", "clientId": client_id}))
        print(f"Client left '{document_id}'. Remaining: {manager.connection_count(document_id)}")