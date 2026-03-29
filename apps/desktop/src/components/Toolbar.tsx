import React, { useState, useEffect, useRef } from 'react';
import { formatSpeed, formatBytes } from '../utils/format';
import { isValidUrl } from '../utils/file';
import type { AddDownloadOptions } from '@idm/shared';

interface ToolbarProps {
  stats: { total: number; active: number; completed: number; speed: number };
  onAdd: (opts: AddDownloadOptions) => void;
  onPauseAll: () => void;
  onResumeAll: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  stats, onAdd, onPauseAll, onResumeAll, searchQuery, onSearch,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Listen for menu/tray events
  useEffect(() => {
    const off1 = window.idm.on('ui:add-url',    () => setShowAddModal(true));
    const off2 = window.idm.on('ui:pause-all',  onPauseAll);
    const off3 = window.idm.on('ui:resume-all', onResumeAll);
    return () => { off1(); off2(); off3(); };
  }, []);

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Add button */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Add URL
        </button>

        {/* Pause / Resume all */}
        <button
          onClick={onPauseAll}
          disabled={stats.active === 0}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm transition-colors disabled:opacity-40"
          title="Pause all"
        >
          ⏸ Pause All
        </button>
        <button
          onClick={onResumeAll}
          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm transition-colors"
          title="Resume all"
        >
          ▶ Resume All
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Search */}
        <input
          type="text"
          placeholder="Search downloads..."
          value={searchQuery}
          onChange={e => onSearch(e.target.value)}
          className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Stats */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {stats.active > 0 && (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              {stats.active} active · {formatSpeed(stats.speed)}
            </span>
          )}
          <span>{stats.total} total · {stats.completed} done</span>
        </div>
      </div>

      {showAddModal && (
        <AddUrlModal
          onAdd={(opts) => { onAdd(opts); setShowAddModal(false); }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
};

// ── Add URL modal ──────────────────────────────────────────────────────────────
interface AddUrlModalProps {
  onAdd: (opts: AddDownloadOptions) => void;
  onClose: () => void;
}

const AddUrlModal: React.FC<AddUrlModalProps> = ({ onAdd, onClose }) => {
  const [url, setUrl] = useState('');
  const [savePath, setSavePath] = useState('');
  const [maxConn, setMaxConn] = useState(8);
  const [advanced, setAdvanced] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Try to pre-fill from clipboard
    navigator.clipboard.readText().then(text => {
      if (isValidUrl(text.trim())) setUrl(text.trim());
    }).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidUrl(url.trim())) return;
    onAdd({ url: url.trim(), savePath: savePath || undefined, maxConnections: maxConn });
  };

  const browseSavePath = async () => {
    const dir = await window.idm.system.openDir();
    if (dir) setSavePath(dir);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Download</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
            <input
              ref={inputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://, ftp://, or magnet:..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {url && !isValidUrl(url) && (
              <p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>
            )}
          </div>

          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setAdvanced(a => !a)}
            className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
          >
            {advanced ? '▲ Hide' : '▼ Show'} advanced options
          </button>

          {advanced && (
            <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {/* Save path */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Save to folder</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={savePath}
                    onChange={e => setSavePath(e.target.value)}
                    placeholder="Default downloads folder"
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={browseSavePath}
                    className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                  >Browse</button>
                </div>
              </div>

              {/* Connections */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Parallel connections: {maxConn}
                </label>
                <input
                  type="range" min={1} max={32} value={maxConn}
                  onChange={e => setMaxConn(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!isValidUrl(url.trim())}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium transition-colors">
              Download
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};