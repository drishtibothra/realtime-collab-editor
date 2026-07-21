from dotenv import load_dotenv
load_dotenv()

import os
import json
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, Query
from fastapi.middleware.cors import CORSMiddleware

from app.connection_manager import manager
from app.document_manager import document_manager
from app.presence_manager import presence_manager
from app.core.security import decode_token
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)


@app.get("/")
def root():
    return {"message": "Collab editor relay is running"}


@app.websocket("/ws/{document_id}")
async def document_websocket(websocket: WebSocket, document_id: str, token: str = Query(...)):
    payload = decode_token(token)
    if payload is None:
        await websocket.close(code=4401)  # custom code = unauthorized
        return

    user_email = payload.get("email", "unknown")

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

            if message["type"] == "websocket.disconnect":
                break

            if message.get("bytes") is not None:
                update = message["bytes"]
                document_manager.apply_update(document_id, update)
                await manager.broadcast_bytes(document_id, update, sender=websocket)

            elif message.get("text") is not None:
                payload_data = json.loads(message["text"])
                if payload_data.get("type") == "presence":
                    client_id = payload_data["clientId"]
                    await presence_manager.upsert(document_id, client_id, payload_data)
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