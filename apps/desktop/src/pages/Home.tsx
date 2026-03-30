import React, { useMemo, useState } from 'react';
import { useDownload } from '../hooks/useDownload';
import { DownloadItem } from '../components/DownloadItem';
import { Toolbar } from '../components/Toolbar';
import { useDownloadsStore } from '../store/downloads.store';
import { formatBytes, formatTime, formatPercent } from '../utils/format';
import type { DownloadCategory, DownloadItem as DLItem } from '@idm/shared';

const CATS: Array<{ key: DownloadCategory | 'all'; icon: string; label: string }> = [
  { key: 'all',        icon: '📦', label: 'All' },
  { key: 'video',      icon: '🎬', label: 'Video' },
  { key: 'audio',      icon: '🎵', label: 'Audio' },
  { key: 'documents',  icon: '📄', label: 'Docs' },
  { key: 'programs',   icon: '⚙',  label: 'Programs' },
  { key: 'compressed', icon: '🗜',  label: 'Archives' },
  { key: 'images',     icon: '🖼',  label: 'Images' },
  { key: 'other',      icon: '📁',  label: 'Other' },
];

const COL = '32px 1fr 90px 110px 80px 120px 90px 100px';

export const Home: React.FC = () => {
  const {
    items, stats, selected, select,
    add, pause, resume, cancel, remove, open, openDir,
    pauseAll, resumeAll, setFilterCategory, setSearch,
  } = useDownload();

  const { filterCategory, searchQuery, items: allItems } = useDownloadsStore();

  const counts = useMemo(() => {
    const all = Object.values(allItems);
    const c: Partial<Record<DownloadCategory | 'all', number>> = { all: all.length };
    all.forEach(i => { c[i.category] = (c[i.category] ?? 0) + 1; });
    return c;
  }, [allItems]);

  // Active download for progress panel
  const activeItem = items.find(i => i.status === 'downloading');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-deep)' }}>
      <Toolbar
        stats={stats}
        onAdd={add}
        onPauseAll={pauseAll}
        onResumeAll={resumeAll}
        searchQuery={searchQuery}
        onSearch={setSearch}
      />

      {/* Category tabs */}
      <div style={{
        height: 36, background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 8px', gap: 2, overflowX: 'auto', flexShrink: 0,
      }}>
        {CATS.map(cat => {
          const cnt = counts[cat.key] ?? 0;
          const active = filterCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px', borderRadius: 4, border: active ? '1px solid rgba(14,165,233,0.25)' : '1px solid transparent',
                background: active ? 'rgba(14,165,233,0.12)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 11.5, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                fontFamily: 'var(--sans)', transition: 'all 0.15s',
              }}
            >
              {cat.icon} {cat.label}
              {cnt > 0 && (
                <span style={{
                  background: active ? 'rgba(14,165,233,0.2)' : 'var(--bg-card)',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                }}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: COL,
        alignItems: 'center', padding: '0 12px', height: 28,
        background: '#0d1525', borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        {['', 'File Name', 'Size', 'Status', 'Progress', 'Transfer Rate', 'Time Left', 'Last Try'].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.8px',
            textTransform: 'uppercase', color: 'var(--text-muted)',
            cursor: h ? 'pointer' : 'default',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {items.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, color: 'var(--text-muted)' }}>
            <span style={{ fontSize: 48, opacity: 0.4 }}>📭</span>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>No downloads yet</span>
            <span style={{ fontSize: 12 }}>Click Add URL to start downloading</span>
          </div>
        ) : (
          items.map(item => (
            <DownloadItem
              key={item.id}
              item={item}
              selected={selected.has(item.id)}
              onSelect={select}
              onPause={pause}
              onResume={resume}
              onCancel={cancel}
              onRemove={remove}
              onOpen={open}
              onOpenDir={openDir}
            />
          ))
        )}
      </div>

      {/* Status bar */}
      <div style={{
        height: 22, background: '#070c18', borderTop: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 20, flexShrink: 0,
      }}>
        {[
          ['Total', stats.total],
          ['Active', stats.active],
          ['Completed', stats.completed],
        ].map(([lbl, val]) => (
          <span key={lbl} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            {lbl}:{' '}
            <span style={{ color: lbl === 'Active' && (val as number) > 0 ? 'var(--green)' : 'var(--text-secondary)' }}>
              {val}
            </span>
          </span>
        ))}
        {stats.active > 0 && (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            Speed: <span style={{ color: 'var(--green)' }}>{formatBytes(stats.speed)}/s</span>
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          IDM Clone v1.0 · Ready
        </span>
      </div>

      {/* Active download progress panel */}
      {activeItem && <DownloadProgressPanel item={activeItem} onPause={pause} onCancel={cancel} />}
    </div>
  );
};

/* ── DOWNLOAD PROGRESS PANEL ── */
const DownloadProgressPanel: React.FC<{
  item: DLItem;
  onPause: (id: string) => void;
  onCancel: (id: string) => void;
}> = ({ item, onPause, onCancel }) => {
  const [open, setOpen] = useState(true);
  const pct = formatPercent(item.downloadedSize, item.totalSize);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 30, right: 20, width: 360,
      background: 'var(--bg-panel)', border: '1px solid var(--border-bright)',
      borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
      zIndex: 50, animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 500 }}>
          {pct}% — Downloading
        </span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
      </div>

      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 10 }}>
          {item.filename}
        </div>

        {/* Segment visualizer */}
        {item.segments.length > 1 && (
          <div style={{ display: 'flex', gap: 2, height: 4, borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
            {item.segments.map(seg => {
              const sp = seg.end >= seg.start ? formatPercent(seg.downloaded, seg.end - seg.start + 1) : 0;
              return (
                <div key={seg.id} style={{ flex: 1, background: 'var(--bg-card)', borderRadius: 1, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${sp}%`, background: 'var(--accent2)', opacity: 0.75, transition: 'width 0.4s' }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 6, background: 'var(--bg-card)', borderRadius: 3, overflow: 'hidden', marginBottom: 10, position: 'relative' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', borderRadius: 3, transition: 'width 0.5s ease', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: 40, height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25))', animation: 'shimmer 1.5s infinite' }} />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 12px', marginBottom: 12 }}>
          {[
            ['Status', 'Receiving data...', 'var(--accent)'],
            ['File size', formatBytes(item.totalSize), ''],
            ['Downloaded', `${formatBytes(item.downloadedSize)} (${pct}%)`, 'var(--green)'],
            ['Transfer rate', item.speed > 0 ? `${formatBytes(item.speed)}/s` : '—', 'var(--green)'],
            ['Time left', item.timeRemaining > 0 ? formatTime(item.timeRemaining) : '—', ''],
            ['Resume capability', 'Yes', 'var(--green)'],
          ].map(([lbl, val, col]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{lbl}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: col || 'var(--text-secondary)' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['⏸ Pause', '📊 Details', '✕ Cancel'] as const).map((lbl, i) => (
            <button
              key={lbl}
              onClick={() => {
                if (i === 0) onPause(item.id);
                else if (i === 2) onCancel(item.id);
              }}
              style={{
                flex: 1, padding: 6,
                border: `1px solid ${i === 2 ? 'rgba(239,68,68,0.3)' : 'var(--border-bright)'}`,
                background: 'var(--bg-card)',
                color: i === 2 ? 'var(--red)' : 'var(--text-secondary)',
                borderRadius: 4, fontSize: 11.5, cursor: 'pointer',
                fontFamily: 'var(--sans)', fontWeight: 500, transition: 'all 0.15s',
              }}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
