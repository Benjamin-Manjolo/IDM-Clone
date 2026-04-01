/**
 * messaging/bridge.ts
 *
 * Hybrid bridge:
 * 1) Preferred: Chrome Native Messaging host (desktop-native integration)
 * 2) Fallback: local WebSocket bridge (dev / legacy mode)
 */

const DESKTOP_WS_PORT = 9182;
const NATIVE_HOST_NAME = 'com.idm.clone.host';
const RECONNECT_DELAY_BASE = 2000;
const RECONNECT_DELAY_MAX = 30_000;
const PING_INTERVAL = 15_000;

type BridgeListener = (data: unknown) => void;

export class DesktopBridge {
  private nativePort: chrome.runtime.Port | null = null;
  private ws: WebSocket | null = null;
  private listeners = new Map<string, BridgeListener[]>();
  private queue: string[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;

  connect(): void {
    if (this.destroyed) return;
    // Try Native Messaging first (IDM-like architecture).
    this.connectNative();
    // Keep WS bridge as compatibility transport for desktop event streaming.
    this.connectWebSocket();
  }

  private connectNative(): boolean {
    try {
      this.nativePort = chrome.runtime.connectNative(NATIVE_HOST_NAME);
      this.nativePort.onMessage.addListener((msg: any) => {
        const { type, data } = msg ?? {};
        if (typeof type === 'string') this.emit(type, data);
      });
      this.nativePort.onDisconnect.addListener(() => {
        this.nativePort = null;
        this.emit('disconnected', null);
        if (!this.destroyed) this.scheduleReconnect();
      });

      this.reconnectAttempts = 0;
      this.flushQueue((payload) => this.nativePort?.postMessage(payload));
      this.emit('connected', { transport: 'native' });
      return true;
    } catch {
      this.nativePort = null;
      return false;
    }
  }

  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(`ws://localhost:${DESKTOP_WS_PORT}`);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        console.log('[IDM Bridge] Connected to desktop app');

        this.flushQueue((payload) => this.ws?.send(JSON.stringify(payload)));

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
    const payload = { type, data };
    let sent = false;
    if (this.nativePort) {
      try {
        this.nativePort.postMessage(payload);
        sent = true;
      } catch {
        this.nativePort = null;
      }
    }
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      sent = true;
    } else {
      // Queue up to 100 messages to avoid memory leak
      if (!sent && this.queue.length < 100) {
        this.queue.push(JSON.stringify(payload));
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
    this.nativePort?.disconnect();
    this.nativePort = null;
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

  private flushQueue(sender: (payload: any) => void): void {
    const pending = this.queue.splice(0);
    for (const raw of pending) {
      try { sender(JSON.parse(raw)); } catch {}
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
