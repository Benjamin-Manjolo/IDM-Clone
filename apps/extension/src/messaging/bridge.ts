/**
 * messaging/bridge.ts
 *
 * WebSocket bridge between the browser extension and the IDM Clone desktop app.
 * Implements auto-reconnect with exponential backoff.
 */

const DESKTOP_WS_PORT = 9182;
const RECONNECT_DELAY_BASE = 2000;
const RECONNECT_DELAY_MAX = 30_000;
const PING_INTERVAL = 15_000;

type BridgeListener = (data: unknown) => void;

export class DesktopBridge {
  private ws: WebSocket | null = null;
  private listeners = new Map<string, BridgeListener[]>();
  private queue: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;

  connect(): void {
    if (this.destroyed) return;
    try {
      this.ws = new WebSocket(`ws://localhost:${DESKTOP_WS_PORT}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('[IDM Bridge] Connected to desktop app');

        // Flush queued messages
        const pending = this.queue.splice(0);
        for (const msg of pending) {
          this.ws?.send(msg);
        }

        // Start heartbeat
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'ping', data: null }));
          }
        }, PING_INTERVAL);

        this.emit('connected', null);
      };

      this.ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data as string);
          if (type !== 'pong') this.emit(type, data);
        } catch {}
      };

      this.ws.onclose = (event) => {
        this.clearPing();
        if (!event.wasClean) {
          console.log('[IDM Bridge] Connection lost, will reconnect…');
        }
        this.emit('disconnected', null);
        if (!this.destroyed) this.scheduleReconnect();
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
      // Queue up to 100 messages to avoid memory leak
      if (this.queue.length < 100) {
        this.queue.push(msg);
      }
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

  destroy(): void {
    this.destroyed = true;
    this.clearPing();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  private emit(type: string, data: unknown): void {
    const handlers = this.listeners.get(type) ?? [];
    for (const h of handlers) {
      try { h(data); } catch {}
    }
  }

  private clearPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.destroyed) return;
    const delay = Math.min(
      RECONNECT_DELAY_BASE * Math.pow(1.5, this.reconnectAttempts),
      RECONNECT_DELAY_MAX
    );
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

export const bridge = new DesktopBridge();
