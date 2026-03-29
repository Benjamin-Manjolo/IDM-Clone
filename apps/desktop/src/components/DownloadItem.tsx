import React, { memo, useCallback } from 'react';
import type { DownloadItem as DLItem } from '@idm/shared';
import { ProgressBar } from './ProgressBar';
import { SpeedIndicator } from './SpeedIndicator';
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

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  downloading: { label: 'Downloading', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  queued:      { label: 'Queued',      cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
  paused:      { label: 'Paused',      cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  completed:   { label: 'Done',        cls: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
  error:       { label: 'Error',       cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  merging:     { label: 'Merging',     cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  checking:    { label: 'Checking',    cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
};

export const DownloadItem: React.FC<DownloadItemProps> = memo(({
  item, selected, onSelect, onPause, onResume, onCancel, onRemove, onOpen, onOpenDir,
}) => {
  const percent = formatPercent(item.downloadedSize, item.totalSize);
  const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE['queued']!;
  const icon = getFileIcon(item.filename);
  const isActive = item.status === 'downloading';
  const isDone = item.status === 'completed';
  const isError = item.status === 'error';
  const isPaused = item.status === 'paused';

  const handleClick = useCallback((e: React.MouseEvent) => {
    onSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey);
  }, [item.id, onSelect]);

  return (
    <div
      onClick={handleClick}
      className={`group flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800
        cursor-pointer select-none transition-colors
        ${selected
          ? 'bg-blue-50 dark:bg-blue-950/40'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
        }`}
    >
      {/* File icon */}
      <div className="text-2xl w-8 flex-shrink-0 text-center">{icon}</div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Filename + badge */}
        <div className="flex items-center gap-2 mb-1">
          <span
            className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate"
            title={item.filename}
          >
            {truncate(item.filename, 60)}
          </span>
          <span className={`flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge.cls}`}>
            {badge.label}
          </span>
        </div>

        {/* Progress bar */}
        {!isDone && item.totalSize > 0 && (
          <ProgressBar percent={percent} status={item.status} height={3} />
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{formatBytes(item.downloadedSize)}{item.totalSize > 0 ? ` / ${formatBytes(item.totalSize)}` : ''}</span>
          {isActive && <SpeedIndicator bps={item.speed} />}
          {isActive && item.timeRemaining > 0 && <span>{formatTime(item.timeRemaining)} left</span>}
          {isDone && item.totalSize > 0 && <span className="text-green-500">✓ {formatBytes(item.totalSize)}</span>}
          {isError && <span className="text-red-500 truncate">{item.errorMessage ?? 'Download failed'}</span>}
          <span className="ml-auto">{formatShortDate(item.createdAt)}</span>
        </div>

        {/* Segment visualization */}
        {isActive && item.segments.length > 1 && (
          <div className="flex gap-px mt-1 h-1 rounded overflow-hidden">
            {item.segments.map(seg => {
              const pct = seg.end >= seg.start
                ? formatPercent(seg.downloaded, seg.end - seg.start + 1)
                : 0;
              return (
                <div key={seg.id} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden">
                  <div className="h-full bg-blue-400 dark:bg-blue-500" style={{ width: `${pct}%` }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isActive && (
          <ActionBtn onClick={() => onPause(item.id)} title="Pause">⏸</ActionBtn>
        )}
        {isPaused && (
          <ActionBtn onClick={() => onResume(item.id)} title="Resume">▶</ActionBtn>
        )}
        {isDone && (
          <>
            <ActionBtn onClick={() => onOpen(item.id)} title="Open file">📂</ActionBtn>
            <ActionBtn onClick={() => onOpenDir(item.id)} title="Show in folder">📁</ActionBtn>
          </>
        )}
        {isError && (
          <ActionBtn onClick={() => onResume(item.id)} title="Retry">🔄</ActionBtn>
        )}
        {!isDone && !isError && (
          <ActionBtn onClick={() => onCancel(item.id)} title="Cancel" danger>✕</ActionBtn>
        )}
        {(isDone || isError) && (
          <ActionBtn onClick={() => onRemove(item.id)} title="Remove" danger>🗑</ActionBtn>
        )}
      </div>
    </div>
  );
});

DownloadItem.displayName = 'DownloadItem';

const ActionBtn: React.FC<{
  onClick: () => void;
  title: string;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, danger, children }) => (
  <button
    title={title}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-7 h-7 flex items-center justify-center rounded text-sm transition-colors
      ${danger
        ? 'hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500'
        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
  >
    {children}
  </button>
);