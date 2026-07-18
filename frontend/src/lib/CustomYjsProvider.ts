import * as Y from "yjs";

export class CustomYjsProvider {
  private ws: WebSocket;
  private ydoc: Y.Doc;

  constructor(documentId: string, ydoc: Y.Doc, baseWsUrl: string) {
    this.ydoc = ydoc;
    this.ws = new WebSocket(`${baseWsUrl}/ws/${documentId}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onopen = () => {
      console.log(`Connected to document: ${documentId}`);
    };

    this.ws.onmessage = (event: MessageEvent) => {
      const update = new Uint8Array(event.data as ArrayBuffer);
      Y.applyUpdate(this.ydoc, update, this);
    };

    this.ws.onclose = () => console.log("Disconnected from document");

    this.ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== this && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(update);
      }
    });
  }

  destroy() {
    this.ws.close();
  }
}