/**
 * Home.tsx — Main download list page
 *
 * IDM-style layout matching the reference screenshots:
 * - Toolbar with Add URL, Resume, Stop All, Delete, Scheduler, Options
 * - Category filter tabs
 * - Download list table with columns: filename, size, status, progress, speed, time, date
 * - Floating download progress panel (bottom-right) for active downloads
 * - Status bar
 */
import React, { useMemo, useEffect, useCallback } from 'react';
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

// Column widths matching IDM's layout
const COL = '30px 1fr 90px 110px 84px 118px 86px 96px';

export const Home: React.FC = () => {
  const {
    items, stats, selected, select,
    add, addBatch, pause, resume, cancel, remove, open, openDir,
    pauseAll, resumeAll, setFilterCategory, setSearch,
  } = useDownload();

  const { filterCategory, searchQuery, items: allItems } = useDownloadsStore();

  // Listen for menu/keyboard events from main process
  useEffect(() => {
    const off1 = window.idm.on('ui:add-url',    () => { /* toolbar handles this */ });
    const off2 = window.idm.on('ui:pause-all',  pauseAll);
    const off3 = window.idm.on('ui:resume-all', resumeAll);
    return () => { off1(); off2(); off3(); };
  }, [pauseAll, resumeAll]);

  const counts = useMemo(() => {
    const all = Object.values(allItems);
    const c: Partial<Record<DownloadCategory | 'all', number>> = { all: all.length };
    for (const i of all) { c[i.category] = (c[i.category] ?? 0) + 1; }
    return c;
  }, [allItems]);

  // Primary active download for the floating progress panel
  const activeItem = items.find(i => i.status === 'downloading');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-deep)', overflow: 'hidden' }}>

      {/* ── Toolbar ────────────────────────────────────────────────────────── */}
      <Toolbar
        stats={stats}
        onAdd={add}
        onAddBatch={addBatch}
        onPauseAll={pauseAll}
        onResumeAll={resumeAll}
        searchQuery={searchQuery}
        onSearch={setSearch}
      />

      {/* ── Category tabs ──────────────────────────────────────────────────── */}
      <div style={{
        height: 34,
        background: 'var(--bg-dark)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        gap: 2,
        overflowX: 'auto',
        flexShrink: 0,
      }}>
        {CATS.map(cat => {
          const cnt = counts[cat.key] ?? 0;
          const isActive = filterCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setFilterCategory(cat.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 9px', borderRadius: 4,
                border: isActive ? '1px solid rgba(37,99,235,0.3)' : '1px solid transparent',
                background: isActive ? 'rgba(37,99,235,0.14)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
                whiteSpace: 'nowrap', fontFamily: 'var(--sans)',
                transition: 'all 0.12s',
              }}
            >
              {cat.icon}
              <span>{cat.label}</span>
              {cnt > 0 && (
                <span style={{
                  background: isActive ? 'rgba(37,99,235,0.25)' : 'var(--bg-card)',
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3,
                }}>{cnt}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Column header ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: COL,
        alignItems: 'center',
        padding: '0 12px',
        height: 26,
        background: '#0b1020',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        {['', 'File Name', 'Size', 'Status', 'Progress', 'Transfer Rate', 'Time Left', 'Last Try'].map((h, i) => (
          <span key={i} style={{
            fontSize: 9.5, fontWeight: 600,
            letterSpacing: '0.7px', textTransform: 'uppercase',
            color: 'var(--text-muted)',
            cursor: h ? 'pointer' : 'default',
            userSelect: 'none',
          }}>
            {h}
          </span>
        ))}
      </div>

      {/* ── Download list ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {items.length === 0 ? (
          <EmptyState />
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

      {/* ── Status bar ─────────────────────────────────────────────────────── */}
      <StatusBar stats={stats} />

      {/* ── Floating progress panel ────────────────────────────────────────── */}
      {activeItem && (
        <DownloadProgressPanel
          item={activeItem}
          onPause={pause}
          onCancel={cancel}
        />
      )}
    </div>
  );
};

// ── Empty state ────────────────────────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', height: '100%', gap: 10,
    color: 'var(--text-muted)',
  }}>
    <span style={{ fontSize: 52, opacity: 0.3 }}>📭</span>
    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>
      No downloads yet
    </span>
    <span style={{ fontSize: 12 }}>
      Press Ctrl+N or click <b style={{ color: 'var(--accent)' }}>Add URL</b> to start downloading
    </span>
  </div>
);

// ── Status bar ──────────────────────────────────────────────────────────────────
const StatusBar: React.FC<{
  stats: { total: number; active: number; completed: number; failed: number; speed: number };
}> = ({ stats }) => (
  <div style={{
    height: 22, background: '#060a14',
    borderTop: '1px solid var(--border)',
    display: 'flex', alignItems: 'center',
    padding: '0 12px', gap: 18, flexShrink: 0,
  }}>
    {([
      ['Total',     String(stats.total),     ''],
      ['Active',    String(stats.active),     stats.active > 0 ? 'var(--green)' : ''],
      ['Completed', String(stats.completed),  ''],
      ['Failed',    String(stats.failed),     stats.failed > 0 ? 'var(--red)' : ''],
    ] as [string, string, string][]).map(([lbl, val, col]) => (
      <span key={lbl} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
        {lbl}:{' '}
        <span style={{ color: col || 'var(--text-secondary)' }}>{val}</span>
      </span>
    ))}
    {stats.active > 0 && (
      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)' }}>
        Speed: <span style={{ color: 'var(--green)' }}>{formatBytes(stats.speed)}/s</span>
      </span>
    )}
    <span style={{ marginLeft: 'auto', fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>
      IDM Clone v1.0 · Ready
    </span>
  </div>
);

// ── Floating download progress panel ────────────────────────────────────────────
// Shown bottom-right when a download is active (matches IDM's "Downloading" dialog)
const DownloadProgressPanel: React.FC<{
  item: DLItem;
  onPause: (id: string) => void;
  onCancel: (id: string) => void;
}> = ({ item, onPause, onCancel }) => {
  const [visible, setVisible] = React.useState(true);
  const pct = formatPercent(item.downloadedSize, item.totalSize);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 18, width: 364,
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-bright)',
      borderRadius: 8,
      boxShadow: '0 16px 56px rgba(0,0,0,0.55)',
      zIndex: 50,
      animation: 'fadeIn 0.25s ease',
    }}>
      {/* Header */}
      <div style={{
        padding: '9px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>
          {pct}% — Downloading
        </span>
        <button
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 15, padding: '0 2px' }}
        >✕</button>
      </div>

      <div style={{ padding: '12px 14px' }}>
        {/* Filename */}
        <div style={{
          fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          marginBottom: 10,
        }}>
          {item.filename}
        </div>

        {/* Multi-segment visualizer */}
        {item.segments.length > 1 && (
          <div style={{ display: 'flex', gap: 2, height: 4, marginBottom: 8, borderRadius: 2, overflow: 'hidden' }}>
            {item.segments.map(seg => {
              const sp = seg.end >= seg.start
                ? formatPercent(seg.downloaded, seg.end - seg.start + 1)
                : 0;
              const segColor =
                seg.status === 'completed'  ? 'var(--green)' :
                seg.status === 'downloading'? 'var(--accent)' :
                seg.status === 'error'      ? 'var(--red)' :
                'var(--bg-card)';
              return (
                <div key={seg.id} style={{
                  flex: 1, background: 'var(--bg-card)',
                  borderRadius: 1, overflow: 'hidden', position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: `${sp}%`, background: segColor,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              );
            })}
          </div>
        )}

        {/* Overall progress bar */}
        <div style={{
          height: 7, background: 'var(--bg-card)', borderRadius: 4,
          overflow: 'hidden', marginBottom: 10, position: 'relative',
        }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
            borderRadius: 4, transition: 'width 0.5s ease',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Shimmer */}
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 50, height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3))',
              animation: 'shimmer 1.5s infinite',
            }} />
          </div>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '4px 16px', marginBottom: 12,
        }}>
          {([
            ['Status',       'Receiving data…',                    'var(--accent)'],
            ['File size',    item.totalSize > 0 ? formatBytes(item.totalSize) : '—', ''],
            ['Downloaded',   `${formatBytes(item.downloadedSize)} (${pct}%)`, 'var(--green)'],
            ['Transfer rate',item.speed > 0 ? `${formatBytes(item.speed)}/s` : '—', 'var(--green)'],
            ['Time left',    item.timeRemaining > 0 ? formatTime(item.timeRemaining) : '—', ''],
            ['Resumable',    item.resumable ? 'Yes' : 'No',        item.resumable ? 'var(--green)' : 'var(--text-muted)'],
            ['Connections',  `${item.segments.filter(s => s.status === 'downloading').length} / ${item.maxConnections}`, ''],
            ['Segments',     String(item.segments.length),         ''],
          ] as [string, string, string][]).map(([lbl, val, col]) => (
            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{lbl}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: col || 'var(--text-secondary)' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['⏸ Pause', '📊 Details', '✕ Cancel'] as const).map((lbl, i) => (
            <button
              key={lbl}
              onClick={() => {
                if (i === 0) onPause(item.id);
                else if (i === 2) onCancel(item.id);
              }}
              style={{
                flex: 1, padding: '5px 0',
                border: `1px solid ${i === 2 ? 'rgba(239,68,68,0.35)' : 'var(--border-bright)'}`,
                background: 'var(--bg-card)',
                color: i === 2 ? 'var(--red)' : 'var(--text-secondary)',
                borderRadius: 4, fontSize: 11.5, cursor: 'pointer',
                fontFamily: 'var(--sans)', fontWeight: 500, transition: 'all 0.12s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = i === 2
                  ? 'rgba(239,68,68,0.12)' : 'var(--bg-hover)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
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
