import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { DownloadQueue, QueueStats } from '@idm/shared';

interface QueueState {
  queues: DownloadQueue[];
  stats: QueueStats | null;
  loading: boolean;

  setQueues: (q: DownloadQueue[]) => void;
  upsertQueue: (q: DownloadQueue) => void;
  removeQueue: (id: string) => void;
  setStats: (s: QueueStats) => void;
  setLoading: (v: boolean) => void;
}

export const useQueueStore = create<QueueState>()(
  immer((set) => ({
    queues: [],
    stats: null,
    loading: false,

    setQueues:   (q) => set((s) => { s.queues = q; }),
    upsertQueue: (q) => set((s) => {
      const idx = s.queues.findIndex(x => x.id === q.id);
      if (idx >= 0) s.queues[idx] = q; else s.queues.push(q);
    }),
    removeQueue: (id) => set((s) => { s.queues = s.queues.filter(q => q.id !== id); }),
    setStats:    (stats) => set((s) => { s.stats = stats; }),
    setLoading:  (v) => set((s) => { s.loading = v; }),
  }))
);