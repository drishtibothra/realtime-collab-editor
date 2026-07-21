from dotenv import load_dotenv
load_dotenv()

import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from app.connection_manager import manager
from app.document_manager import document_manager
from app.presence_manager import presence_manager
from app.routers import auth

AUTOSAVE_INTERVAL_SECONDS = 15


async def autosave_loop():
    while True:
        await asyncio.sleep(AUTOSAVE_INTERVAL_SECONDS)
        for document_id in list(document_manager.documents.keys()):
            await document_manager.persist(document_id)


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(autosave_loop())
    yield
    task.cancel()


app = FastAPI(title="Real-Time Collaborative Editor", lifespan=lifespan)
app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Collab editor relay is running"}

@app.websocket("/ws/{document_id}")
async def document_websocket(websocket: WebSocket, document_id: str):
    await manager.connect(document_id, websocket)
    client_id: str | None = None

    await document_manager.get_or_load(document_id)
    full_state = document_manager.get_full_state(document_id)
    if full_state:
        await websocket.send_bytes(full_state)

    existing_peers = await presence_manager.get_all(document_id)
    if existing_peers:
        await websocket.send_text(json.dumps({"type": "presence_snapshot", "peers": existing_peers}))

    try:
        while True:
            message = await websocket.receive()

            # The client disconnected — raw .receive() reports this as a
            # message, NOT an exception, unlike receive_text()/receive_bytes().
            if message["type"] == "websocket.disconnect":
                break

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

    finally:
        manager.disconnect(document_id, websocket)
        if client_id:
            await presence_manager.remove(document_id, client_id)
            await manager.broadcast_text(document_id, json.dumps({"type": "presence_leave", "clientId": client_id}))

        if manager.connection_count(document_id) == 0:
            await document_manager.persist(document_id)
            document_manager.evict(document_id)
            print(f"Document '{document_id}' persisted and evicted (no clients remaining).")