import React, { memo, useCallback } from 'react';
import type { DownloadItem as DLItem } from '@idm/shared';
import { formatBytes, formatTime, formatPercent, formatShortDate, truncate } from '../utils/format';
import { getFileIcon } from '../utils/file';

interface DownloadItemProps {
  item: DLItem;
  selected: boolean;
  onSelect: (id: string, multi: boolean) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenDir: (id: string) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  downloading: { label: 'Downloading', color: 'var(--accent)',  bg: 'rgba(14,165,233,0.12)',  border: 'rgba(14,165,233,0.3)' },
  queued:      { label: 'Queued',      color: 'var(--purple)', bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.3)' },
  paused:      { label: 'Paused',      color: 'var(--yellow)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  completed:   { label: 'Complete',    color: 'var(--green)',  bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  error:       { label: 'Error',       color: 'var(--red)',    bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)' },
  merging:     { label: 'Merging',     color: 'var(--accent)', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.3)' },
  checking:    { label: 'Checking',    color: 'var(--yellow)', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
};

const GRID = '32px 1fr 90px 110px 80px 120px 90px 100px';

export const DownloadItem: React.FC<DownloadItemProps> = memo(({
  item, selected, onSelect, onPause, onResume, onCancel, onRemove, onOpen, onOpenDir,
}) => {
  const pct = formatPercent(item.downloadedSize, item.totalSize);
  const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG['queued']!;
  const icon = getFileIcon(item.filename);
  const isActive = item.status === 'downloading';
  const isDone   = item.status === 'completed';
  const isError  = item.status === 'error';
  const isPaused = item.status === 'paused';

  const [hovered, setHovered] = React.useState(false);

  const row: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: GRID,
    alignItems: 'center',
    padding: '0 12px',
    height: 38,
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    background: selected ? 'var(--bg-selected)' : hovered ? 'var(--bg-hover)' : 'transparent',
    position: 'relative',
    transition: 'background 0.1s',
    animation: 'fadeIn 0.2s ease',
  };

  return (
    <div
      style={row}
      onClick={e => onSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey)}
      onDoubleClick={() => isDone && onOpen(item.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Selection accent bar */}
      {selected && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--accent)', borderRadius: '0 1px 1px 0' }} />
      )}

      {/* Icon */}
      <span style={{ fontSize: 18 }}>{icon}</span>

      {/* Filename */}
      <span style={{
        fontSize: 12.5, fontWeight: 500,
        color: isError ? 'var(--red)' : 'var(--text-primary)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        paddingRight: 8,
      }} title={item.filename}>
        {truncate(item.filename, 55)}
      </span>

      {/* Size */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
        {item.totalSize > 0 ? formatBytes(item.totalSize) : '—'}
      </span>

      {/* Status badge */}
      <div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '2px 7px', borderRadius: 3,
          fontSize: 10, fontWeight: 600, letterSpacing: '0.4px',
          color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: cfg.color,
            animation: isActive ? 'pulse-dot 1.5s infinite' : 'none',
          }} />
          {cfg.label}
        </span>
      </div>

      {/* Progress */}
      <div>
        {isActive && item.totalSize > 0 ? (
          <>
            <div style={{ height: 3, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden', marginBottom: 2 }}>
              <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: 'linear-gradient(90deg, var(--accent), var(--accent2))', transition: 'width 0.4s ease' }} />
            </div>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--accent)' }}>{pct}%</span>
          </>
        ) : isDone ? (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--green)' }}>✓ 100%</span>
        ) : (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>—</span>
        )}
      </div>

      {/* Transfer rate */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: isActive ? 'var(--green)' : 'var(--text-muted)' }}>
        {isActive && item.speed > 0 ? `${formatBytes(item.speed)}/s` : '—'}
      </span>

      {/* Time left */}
      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
        {isActive && item.timeRemaining > 0 ? formatTime(item.timeRemaining) : '—'}
      </span>

      {/* Date / actions on hover */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {hovered ? (
          <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
            {isActive  && <ActionBtn onClick={() => onPause(item.id)}  title="Pause"  icon="⏸" />}
            {isPaused  && <ActionBtn onClick={() => onResume(item.id)} title="Resume" icon="▶" />}
            {isError   && <ActionBtn onClick={() => onResume(item.id)} title="Retry"  icon="🔄" />}
            {isDone    && <ActionBtn onClick={() => onOpen(item.id)}   title="Open"   icon="📂" />}
            {isDone    && <ActionBtn onClick={() => onOpenDir(item.id)} title="Show in folder" icon="📁" />}
            {!isDone && !isError && <ActionBtn onClick={() => onCancel(item.id)} title="Cancel" icon="✕" danger />}
            {(isDone || isError) && <ActionBtn onClick={() => onRemove(item.id)} title="Remove" icon="🗑" danger />}
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)' }}>
            {formatShortDate(item.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
});

DownloadItem.displayName = 'DownloadItem';

const ActionBtn: React.FC<{ onClick: () => void; title: string; icon: string; danger?: boolean }> = ({ onClick, title, icon, danger }) => {
  const [hov, setHov] = React.useState(false);
  return (
    <button
      title={title}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 26, height: 26,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, border: 'none', fontSize: 13, cursor: 'pointer',
        background: hov ? (danger ? 'rgba(239,68,68,0.15)' : 'var(--bg-card)') : 'transparent',
        color: hov ? (danger ? 'var(--red)' : 'var(--text-primary)') : 'var(--text-muted)',
        transition: 'all 0.15s',
      }}
    >
      {icon}
    </button>
  );
};
