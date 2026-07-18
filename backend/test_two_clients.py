import asyncio
import websockets
from pycrdt import Doc, Text


async def run_client(name: str, document_id: str, text_to_type: str, delay: float):
    uri = f"ws://127.0.0.1:8000/ws/{document_id}"
    doc = Doc()
    doc["content"] = text = Text()

    async with websockets.connect(uri) as ws:
        initial_state = await ws.recv()
        if initial_state:
            doc.apply_update(initial_state)

        await asyncio.sleep(delay)

        text += text_to_type
        await ws.send(doc.get_update())

        try:
            while True:
                incoming = await asyncio.wait_for(ws.recv(), timeout=2)
                doc.apply_update(incoming)
        except asyncio.TimeoutError:
            pass

        print(f"{name} final content: {str(doc['content'])!r}")


async def main():
    document_id = "test-doc-sync"
    await asyncio.gather(
        run_client("Client A", document_id, "Hello", delay=0),
        run_client("Client B", document_id, " World", delay=0.5),
    )


asyncio.run(main())