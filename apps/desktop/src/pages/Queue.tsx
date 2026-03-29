import React, { useState } from 'react';
import { useQueue } from '../hooks/useQueue';
import { formatBytes } from '../utils/format';
import type { DownloadQueue } from '@idm/shared';

export const Queue: React.FC = () => {
  const { queues, stats, loading, create, update, remove, start, stop } = useQueue();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newConcurrent, setNewConcurrent] = useState(3);
  const [newSpeedLimit, setNewSpeedLimit] = useState(0);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    await create(newName.trim(), { maxConcurrent: newConcurrent, speedLimit: newSpeedLimit * 1024 });
    setNewName(''); setNewConcurrent(3); setNewSpeedLimit(0); setShowCreate(false);
  };

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Download Queues</h1>
          {stats && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.active} active · {stats.total} total · {formatBytes(stats.downloadedBytes)} / {formatBytes(stats.totalBytes)}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + New Queue
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {queues.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
            <span className="text-5xl">📋</span>
            <p className="text-sm font-medium">No queues yet</p>
            <p className="text-xs">Create a queue to organize and schedule batches of downloads</p>
          </div>
        )}

        {queues.map(queue => (
          <QueueCard key={queue.id} queue={queue} onStart={start} onStop={stop} onRemove={remove} onUpdate={update} />
        ))}

        {/* Create queue form */}
        {showCreate && (
          <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-950/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Queue</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                autoFocus
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Queue name..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Max concurrent: {newConcurrent}</label>
                  <input type="range" min={1} max={16} value={newConcurrent}
                    onChange={e => setNewConcurrent(+e.target.value)} className="w-full accent-blue-600" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Speed limit (KB/s, 0=unlimited)</label>
                  <input type="number" min={0} value={newSpeedLimit}
                    onChange={e => setNewSpeedLimit(+e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={!newName.trim()}
                  className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium">Create</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const QueueCard: React.FC<{
  queue: DownloadQueue;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, u: Partial<DownloadQueue>) => void;
}> = ({ queue, onStart, onStop, onRemove, onUpdate }) => (
  <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800/50">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{queue.name}</h3>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ${
            queue.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {queue.active ? 'Active' : 'Stopped'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {queue.downloadIds.length} downloads · Max {queue.maxConcurrent} concurrent
          {queue.speedLimit > 0 && ` · ${formatBytes(queue.speedLimit)}/s limit`}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {queue.active
          ? <button onClick={() => onStop(queue.id)} className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">⏸ Stop</button>
          : <button onClick={() => onStart(queue.id)} className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md">▶ Start</button>
        }
        <button onClick={() => onRemove(queue.id)}
          className="px-2.5 py-1 text-xs border border-red-200 dark:border-red-900 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
          Remove
        </button>
      </div>
    </div>
  </div>
);