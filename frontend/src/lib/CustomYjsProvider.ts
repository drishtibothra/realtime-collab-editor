import * as Y from "yjs";

interface PresenceData {
  clientId: string;
  name: string;
  color: string;
}

type PresenceHandler = (peers: PresenceData[]) => void;

export class CustomYjsProvider {
  private ws: WebSocket;
  private ydoc: Y.Doc;
  public clientId: string;
  private peers: Map<string, PresenceData> = new Map();
  private onPresenceChange: PresenceHandler | null = null;

  constructor(documentId: string, ydoc: Y.Doc, baseWsUrl: string, clientId: string) {
    this.ydoc = ydoc;
    this.clientId = clientId;
    this.ws = new WebSocket(`${baseWsUrl}/ws/${documentId}`);
    this.ws.binaryType = "arraybuffer";

    this.ws.onmessage = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        this.handlePresenceMessage(JSON.parse(event.data));
      } else {
        const update = new Uint8Array(event.data as ArrayBuffer);
        Y.applyUpdate(this.ydoc, update, this);
      }
    };

    this.ws.onclose = () => console.log("Disconnected from document");

    this.ydoc.on("update", (update: Uint8Array, origin: unknown) => {
      if (origin !== this && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(update);
      }
    });
  }

  private handlePresenceMessage(payload: any) {
    if (payload.type === "presence_snapshot") {
      payload.peers.forEach((p: PresenceData) => this.peers.set(p.clientId, p));
    } else if (payload.type === "presence") {
      this.peers.set(payload.clientId, payload);
    } else if (payload.type === "presence_leave") {
      this.peers.delete(payload.clientId);
    }
    this.onPresenceChange?.(
      Array.from(this.peers.values()).filter((p) => p.clientId !== this.clientId)
    );
  }

  subscribePresence(handler: PresenceHandler) {
    this.onPresenceChange = handler;
  }

  sendPresence(name: string, color: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "presence", clientId: this.clientId, name, color }));
    }
  }

  destroy() {
    this.ws.close();
  }
}