import React from 'react';
import type { DownloadItem as DLItem } from '@idm/shared';
import { DownloadItem } from './DownloadItem';

interface DownloadListProps {
  items: DLItem[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onRemove: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenDir: (id: string) => void;
}

export const DownloadList: React.FC<DownloadListProps> = ({
  items, selectedIds, onSelect, onPause, onResume, onCancel, onRemove, onOpen, onOpenDir,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-3 py-20">
        <span className="text-5xl">📭</span>
        <p className="text-sm font-medium">No downloads yet</p>
        <p className="text-xs">Press Ctrl+N or click Add URL to start downloading</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {items.map(item => (
        <DownloadItem
          key={item.id}
          item={item}
          selected={selectedIds.has(item.id)}
          onSelect={onSelect}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onRemove={onRemove}
          onOpen={onOpen}
          onOpenDir={onOpenDir}
        />
      ))}
    </div>
  );
};