/**
 * queue.store.ts
 * Zustand store for download queues.
 */
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DownloadQueue, QueueStats } from '@idm/shared';

interface QueueState {
  queues: DownloadQueue[];
  stats: QueueStats | null;
  loading: boolean;

  setQueues: (queues: DownloadQueue[]) => void;
  upsertQueue: (queue: DownloadQueue) => void;
  removeQueue: (id: string) => void;
  setStats: (stats: QueueStats) => void;
  setLoading: (v: boolean) => void;
}

export const useQueueStore = create<QueueState>()(
  immer((set) => ({
    queues: [],
    stats: null,
    loading: false,

    setQueues: (queues) =>
      set((s) => { s.queues = queues; }),

    upsertQueue: (queue) =>
      set((s) => {
        const idx = s.queues.findIndex((q) => q.id === queue.id);
        if (idx >= 0) s.queues[idx] = queue;
        else s.queues.push(queue);
      }),

    removeQueue: (id) =>
      set((s) => {
        s.queues = s.queues.filter((q) => q.id !== id);
      }),

    setStats: (stats) =>
      set((s) => { s.stats = stats; }),

    setLoading: (v) =>
      set((s) => { s.loading = v; }),
  }))
);
