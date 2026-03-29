import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { DetectedVideo } from '../videoDetector';

interface PopupState {
  connected: boolean;
  videos: DetectedVideo[];
  addUrl: string;
  adding: boolean;
  addedCount: number;
  enabled: boolean;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    connected: false,
    videos: [],
    addUrl: '',
    adding: false,
    addedCount: 0,
    enabled: true,
  });

  const patch = (p: Partial<PopupState>) => setState(s => ({ ...s, ...p }));

  useEffect(() => {
    // Check connection + load settings
    chrome.runtime.sendMessage({ type: 'get:connection' }, (res) => {
      patch({ connected: res?.connected ?? false });
    });
    chrome.runtime.sendMessage({ type: 'get:videos' }, (res) => {
      patch({ videos: res?.videos ?? [] });
    });
    chrome.storage.sync.get(['idmSettings'], (result) => {
      if (result['idmSettings']?.enabled !== undefined) {
        patch({ enabled: result['idmSettings'].enabled });
      }
    });

    // Listen for new video detections
    const listener = (msg: any) => {
      if (msg.type === 'video:detected') {
        setState(s => ({ ...s, videos: [msg.data, ...s.videos.filter(v => v.url !== msg.data.url)] }));
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const downloadVideo = (url: string) => {
    chrome.runtime.sendMessage({ type: 'download:video', url }, () => {
      patch({ addedCount: state.addedCount + 1 });
      setTimeout(() => setState(s => ({ ...s, addedCount: Math.max(0, s.addedCount - 1) })), 2000);
    });
  };

  const addManual = () => {
    if (!state.addUrl.trim()) return;
    patch({ adding: true });
    chrome.runtime.sendMessage({ type: 'download:video', url: state.addUrl.trim() }, () => {
      patch({ adding: false, addUrl: '', addedCount: state.addedCount + 1 });
      setTimeout(() => setState(s => ({ ...s, addedCount: Math.max(0, s.addedCount - 1) })), 2000);
    });
  };

  const toggleEnabled = () => {
    const next = !state.enabled;
    patch({ enabled: next });
    chrome.runtime.sendMessage({ type: 'settings:update', data: { enabled: next } });
  };

  return (
    <div style={{ width: 320, fontFamily: 'system-ui, sans-serif', fontSize: 13 }}>
      {/* Header */}
      <div style={{ background: '#2563eb', color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>IDM Clone</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Connection indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, opacity: 0.9 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: state.connected ? '#4ade80' : '#f87171', display: 'inline-block' }} />
            {state.connected ? 'Connected' : 'Offline'}
          </div>
          {/* Toggle */}
          <button onClick={toggleEnabled} style={{
            background: state.enabled ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
            border: 'none', color: '#fff', borderRadius: 4, padding: '3px 8px',
            fontSize: 11, cursor: 'pointer', fontWeight: 600,
          }}>
            {state.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Add URL */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Add URL</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            value={state.addUrl}
            onChange={e => patch({ addUrl: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            placeholder="https://..."
            style={{ flex: 1, padding: '6px 8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 12, outline: 'none' }}
          />
          <button onClick={addManual} disabled={state.adding || !state.addUrl.trim()} style={{
            background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6,
            padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            opacity: state.adding || !state.addUrl.trim() ? 0.5 : 1,
          }}>
            {state.adding ? '…' : 'Add'}
          </button>
        </div>
        {state.addedCount > 0 && (
          <div style={{ color: '#16a34a', fontSize: 11, marginTop: 4 }}>✓ Sent to IDM Clone</div>
        )}
      </div>

      {/* Detected videos */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
          <span>Detected Videos</span>
          {state.videos.length > 0 && <span style={{ color: '#2563eb' }}>{state.videos.length} found</span>}
        </div>

        {state.videos.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0', fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>🎬</div>
            <div>No video streams detected</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Play a video on any page to detect streams</div>
          </div>
        ) : (
          <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {state.videos.slice(0, 10).map(v => (
              <div key={v.url} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      background: v.type === 'hls' ? '#dbeafe' : v.type === 'dash' ? '#fce7f3' : '#dcfce7',
                      color: v.type === 'hls' ? '#1d4ed8' : v.type === 'dash' ? '#9d174d' : '#15803d',
                    }}>{v.type.toUpperCase()}</span>
                    {v.tabTitle && <span style={{ fontSize: 11, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.tabTitle}</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{v.url}</div>
                </div>
                <button onClick={() => downloadVideo(v.url)} style={{
                  background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6,
                  padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                }}>⬇</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '8px 14px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#d1d5db' }}>IDM Clone Extension v1.0.0</span>
        <button onClick={() => chrome.runtime.sendMessage({ type: 'download:video', url: '' })}
          style={{ fontSize: 10, color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
          Open App ↗
        </button>
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />);
