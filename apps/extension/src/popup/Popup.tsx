/**
 * Popup.tsx — IDM Clone Extension Popup
 *
 * IDM-style popup with:
 * - Connection status indicator
 * - Detected videos with quality selection dropdown
 * - Manual URL entry
 * - Quick settings toggle
 */
import React, { useEffect, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import type { DetectedVideo, VideoQuality } from '../videoDetector';

interface PopupState {
  connected: boolean;
  videos: DetectedVideo[];
  addUrl: string;
  adding: boolean;
  addedCount: number;
  enabled: boolean;
  activeTab: 'videos' | 'add' | 'settings';
  expandedVideoUrl: string | null;
}

const Popup: React.FC = () => {
  const [state, setState] = useState<PopupState>({
    connected: false,
    videos: [],
    addUrl: '',
    adding: false,
    addedCount: 0,
    enabled: true,
    activeTab: 'videos',
    expandedVideoUrl: null,
  });

  const patch = useCallback((p: Partial<PopupState>) => setState(s => ({ ...s, ...p })), []);

  useEffect(() => {
    // Get current tab's videos
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      chrome.runtime.sendMessage({ type: 'get:videos', tabId }, (res) => {
        patch({ videos: res?.videos ?? [] });
      });
    });

    chrome.runtime.sendMessage({ type: 'get:connection' }, (res) => {
      patch({ connected: res?.connected ?? false });
    });

    chrome.storage.sync.get(['idmSettings'], (result) => {
      if (result['idmSettings']?.enabled !== undefined) {
        patch({ enabled: result['idmSettings'].enabled });
      }
    });

    const listener = (msg: any) => {
      if (msg.type === 'video:detected') {
        setState(s => ({
          ...s,
          videos: [msg.data, ...s.videos.filter((v: DetectedVideo) => v.url !== msg.data.url)],
        }));
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const downloadQuality = useCallback((video: DetectedVideo, quality: VideoQuality | null) => {
    const url = quality?.url ?? video.url;
    chrome.runtime.sendMessage({
      type: 'download:video-quality',
      url,
      quality,
      referrer: video.pageUrl,
      title: video.tabTitle,
    }, () => {
      patch({ addedCount: state.addedCount + 1 });
      setTimeout(() => setState(s => ({ ...s, addedCount: Math.max(0, s.addedCount - 1) })), 2000);
    });
  }, [state.addedCount]);

  const addManual = useCallback(() => {
    if (!state.addUrl.trim()) return;
    patch({ adding: true });
    chrome.runtime.sendMessage({
      type: 'download:video',
      url: state.addUrl.trim(),
    }, () => {
      patch({ adding: false, addUrl: '', addedCount: state.addedCount + 1 });
      setTimeout(() => setState(s => ({ ...s, addedCount: Math.max(0, s.addedCount - 1) })), 2000);
    });
  }, [state.addUrl, state.addedCount]);

  const toggleEnabled = useCallback(() => {
    const next = !state.enabled;
    patch({ enabled: next });
    chrome.runtime.sendMessage({ type: 'settings:update', data: { enabled: next } });
  }, [state.enabled]);

  return (
    <div style={{ width: 340, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', fontSize: 13, background: '#0f1428', color: '#e5e7eb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%)',
        padding: '10px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>⚡</span>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: 0.5 }}>IDM Clone</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: state.connected ? '#4ade80' : '#f87171',
              display: 'inline-block',
              boxShadow: state.connected ? '0 0 6px #4ade80' : 'none',
            }} />
            <span style={{ opacity: 0.85 }}>{state.connected ? 'Connected' : 'Offline'}</span>
          </div>
          <button
            onClick={toggleEnabled}
            style={{
              background: state.enabled ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', borderRadius: 4, padding: '2px 8px',
              fontSize: 11, cursor: 'pointer', fontWeight: 700,
            }}
          >
            {state.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', background: '#0a0e1a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {(['videos', 'add', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => patch({ activeTab: tab })}
            style={{
              flex: 1, padding: '8px 4px', border: 'none', cursor: 'pointer',
              background: state.activeTab === tab ? 'rgba(37,99,235,0.15)' : 'transparent',
              color: state.activeTab === tab ? '#60a5fa' : 'rgba(255,255,255,0.4)',
              fontSize: 11.5, fontWeight: 600, borderBottom: state.activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
              fontFamily: 'inherit',
            }}
          >
            {tab === 'videos' ? `🎬 Videos${state.videos.length > 0 ? ` (${state.videos.length})` : ''}` :
             tab === 'add' ? '⊕ Add URL' : '⚙ Settings'}
          </button>
        ))}
      </div>

      {/* Videos tab */}
      {state.activeTab === 'videos' && (
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {state.videos.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', padding: '28px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>No video streams detected</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Play a video on any page to detect streams</div>
            </div>
          ) : (
            state.videos.map(v => (
              <VideoCard
                key={v.url}
                video={v}
                expanded={state.expandedVideoUrl === v.url}
                onExpand={() => patch({ expandedVideoUrl: state.expandedVideoUrl === v.url ? null : v.url })}
                onDownload={(quality) => downloadQuality(v, quality)}
              />
            ))
          )}
        </div>
      )}

      {/* Add URL tab */}
      {state.activeTab === 'add' && (
        <div style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Enter URL to download
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input
              type="text"
              value={state.addUrl}
              autoFocus
              onChange={e => patch({ addUrl: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && addManual()}
              placeholder="https://  ·  ftp://  ·  magnet:..."
              style={{
                flex: 1, padding: '7px 10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 5, fontSize: 12,
                color: '#fff', outline: 'none', fontFamily: 'monospace',
              }}
            />
            <button
              onClick={addManual}
              disabled={state.adding || !state.addUrl.trim()}
              style={{
                background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5,
                padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                opacity: state.adding || !state.addUrl.trim() ? 0.5 : 1,
              }}
            >
              {state.adding ? '…' : 'Add'}
            </button>
          </div>
          {state.addedCount > 0 && (
            <div style={{ color: '#4ade80', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>✓</span> Sent to IDM Clone desktop app
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {state.activeTab === 'settings' && (
        <div style={{ padding: 14 }}>
          <SettingsPanel enabled={state.enabled} onToggle={toggleEnabled} />
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: '7px 14px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>IDM Clone Extension v1.0.0</span>
        <button
          onClick={() => chrome.runtime.sendMessage({ type: 'open:app' })}
          style={{ fontSize: 10.5, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Open App ↗
        </button>
      </div>
    </div>
  );
};

// ── VideoCard ──────────────────────────────────────────────────────────────────
const VideoCard: React.FC<{
  video: DetectedVideo;
  expanded: boolean;
  onExpand: () => void;
  onDownload: (quality: VideoQuality | null) => void;
}> = ({ video, expanded, onExpand, onDownload }) => {
  const typeBg: Record<string, string> = {
    hls: '#1e3a8a', dash: '#4a1d96', 'direct-video': '#14532d',
    'direct-audio': '#7c2d12', progressive: '#14532d',
  };
  const typeColor: Record<string, string> = {
    hls: '#93c5fd', dash: '#c4b5fd', 'direct-video': '#86efac',
    'direct-audio': '#fdba74', progressive: '#86efac',
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {/* Main row */}
      <div
        onClick={onExpand}
        style={{
          display: 'flex', alignItems: 'flex-start', padding: '9px 12px',
          cursor: 'pointer', gap: 8,
          background: expanded ? 'rgba(37,99,235,0.08)' : 'transparent',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
              background: typeBg[video.type] ?? '#1f2937',
              color: typeColor[video.type] ?? '#9ca3af',
            }}>
              {video.type.toUpperCase()}
            </span>
            {video.qualities.length > 0 && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                {video.qualities.length} qualities
              </span>
            )}
          </div>
          <div style={{
            fontSize: 11.5, color: 'rgba(255,255,255,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {video.tabTitle || 'Unknown video'}
          </div>
          <div style={{
            fontSize: 10, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1,
          }}>
            {video.url.length > 55 ? video.url.slice(0, 55) + '…' : video.url}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDownload(video.qualities[0] ?? null); }}
            style={{
              background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5,
              padding: '4px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}
          >⬇</button>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded quality list */}
      {expanded && (
        <div style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {video.qualities.length === 0 ? (
            <div
              onClick={() => onDownload(null)}
              style={{ padding: '8px 16px', cursor: 'pointer', fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span>⬇</span> Download
            </div>
          ) : video.qualities.map((q, idx) => (
            <div
              key={q.url}
              onClick={() => onDownload(q)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 16px', cursor: 'pointer', fontSize: 12,
                color: 'rgba(255,255,255,0.75)',
                borderBottom: idx < video.qualities.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <span>{q.isAudioOnly ? '🎵' : '🎬'}</span>
              <span style={{ flex: 1 }}>{q.label}</span>
              {q.mimeType && (
                <span style={{
                  fontSize: 9.5, padding: '1px 4px', borderRadius: 2,
                  background: 'rgba(37,99,235,0.3)', color: '#93c5fd', fontWeight: 700,
                }}>
                  {(q.container ?? q.mimeType.split('/')[1] ?? '').toUpperCase().slice(0, 4)}
                </span>
              )}
              {q.fileSize && q.fileSize > 0 && (
                <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', minWidth: 60, textAlign: 'right' }}>
                  {formatBytes(q.fileSize)}
                </span>
              )}
              <span style={{ color: '#60a5fa', fontSize: 13 }}>⬇</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── SettingsPanel ──────────────────────────────────────────────────────────────
const SettingsPanel: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
  <div>
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        cursor: 'pointer', padding: '6px 0',
      }}>
        <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)' }}>Extension enabled</span>
        <div onClick={onToggle} style={{
          width: 36, height: 20, borderRadius: 10,
          background: enabled ? '#2563eb' : 'rgba(255,255,255,0.15)',
          position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
          flexShrink: 0,
        }}>
          <div style={{
            position: 'absolute', top: 2, width: 16, height: 16,
            borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
            left: enabled ? 18 : 2,
          }} />
        </div>
      </label>
    </div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>
      IDM Clone Extension v1.0.0<br />
      Monitors downloads and video streams.<br />
      Requires the IDM Clone desktop app to be running.
    </div>
  </div>
);

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// Type augmentation for DetectedVideo in popup
declare module '../videoDetector' {
  interface DetectedVideo {
    pageUrl?: string;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Popup />);
