const DESKTOP_WS_PORT = 9182;
const RECONNECT_DELAY = 3000;

type BridgeListener = (data: unknown) => void;

export class DesktopBridge {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, BridgeListener[]>();
  private queue: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    try {
      this.ws = new WebSocket(`ws://localhost:${DESKTOP_WS_PORT}`);

      this.ws.onopen = () => {
        console.log('[IDM Bridge] Connected to desktop app');
        // Flush queued messages
        this.queue.forEach(msg => this.ws?.send(msg));
        this.queue = [];
        this.emit('connected', null);
      };

      this.ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data as string);
          this.emit(type, data);
        } catch {}
      };

      this.ws.onclose = () => {
        console.log('[IDM Bridge] Disconnected, reconnecting…');
        this.emit('disconnected', null);
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  send(type: string, data: unknown): void {
    const msg = JSON.stringify({ type, data });
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(msg);
    } else {
      this.queue.push(msg);
    }
  }

  on(type: string, listener: BridgeListener): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type)!.push(listener);
    return () => {
      const arr = this.listeners.get(type) ?? [];
      this.listeners.set(type, arr.filter(l => l !== listener));
    };
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private emit(type: string, data: unknown): void {
    (this.listeners.get(type) ?? []).forEach(l => l(data));
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY);
  }
}

export const bridge = new DesktopBridge();
