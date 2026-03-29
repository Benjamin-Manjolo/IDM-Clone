import { useEffect, useCallback } from 'react';
import { useQueueStore } from '../store/queue.store';

export function useQueue() {
  const store = useQueueStore();

  useEffect(() => {
    store.setLoading(true);
    window.idm.queue.list().then((queues: any[]) => {
      store.setQueues(queues);
      store.setLoading(false);
    });
    window.idm.queue.stats().then((stats: any) => store.setStats(stats));
  }, []);

  const create = useCallback(async (name: string, opts?: object) => {
    const q = await window.idm.queue.create(name, opts);
    store.upsertQueue(q);
    return q;
  }, []);

  const update = useCallback(async (id: string, updates: object) => {
    await window.idm.queue.update(id, updates);
    store.upsertQueue({ ...store.queues.find(q => q.id === id)!, ...updates } as any);
  }, [store.queues]);

  const remove = useCallback(async (id: string) => {
    await window.idm.queue.delete(id);
    store.removeQueue(id);
  }, []);

  const start = useCallback((id: string) => window.idm.queue.start(id), []);
  const stop  = useCallback((id: string) => window.idm.queue.stop(id),  []);

  return { queues: store.queues, stats: store.stats, loading: store.loading, create, update, remove, start, stop };
}
