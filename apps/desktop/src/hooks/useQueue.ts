/**
 * useQueue.ts
 */
import { useEffect, useCallback } from 'react';
import { useQueueStore } from '../store/queue.store';
import type { DownloadQueue } from '@idm/shared';

export function useQueue() {
  const store = useQueueStore();

  useEffect(() => {
    store.setLoading(true);
    Promise.all([
      window.idm.queue.list(),
      window.idm.queue.stats(),
    ]).then(([queues, stats]) => {
      store.setQueues(queues ?? []);
      if (stats) store.setStats(stats);
      store.setLoading(false);
    }).catch(() => store.setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(async (name: string, opts?: object) => {
    const q = await window.idm.queue.create(name, opts);
    store.upsertQueue(q);
    return q;
  }, [store]);

  const update = useCallback(async (id: string, updates: Partial<DownloadQueue>) => {
    await window.idm.queue.update(id, updates);
    const existing = store.queues.find(q => q.id === id);
    if (existing) store.upsertQueue({ ...existing, ...updates } as DownloadQueue);
  }, [store]);

  const remove = useCallback(async (id: string) => {
    await window.idm.queue.delete(id);
    store.removeQueue(id);
  }, [store]);

  const start = useCallback((id: string) => window.idm.queue.start(id), []);
  const stop  = useCallback((id: string) => window.idm.queue.stop(id),  []);

  return {
    queues:  store.queues,
    stats:   store.stats,
    loading: store.loading,
    create,
    update,
    remove,
    start,
    stop,
  };
}
