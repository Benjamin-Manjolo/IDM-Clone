/**
 * useScheduler.ts
 */
import { useEffect, useCallback } from 'react';
import { useSchedulerStore } from '../store/scheduler.store';
import type { SchedulerTask } from '@idm/shared';

export function useScheduler() {
  const store = useSchedulerStore();

  useEffect(() => {
    window.idm.scheduler.list().then((state: any) => {
      store.setTasks(state?.tasks ?? []);
      store.setEnabled(state?.enabled ?? false);
    }).catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useCallback(
    async (task: Omit<SchedulerTask, 'id' | 'createdAt'>) => {
      const created = await window.idm.scheduler.create(task);
      store.upsertTask(created);
      return created;
    },
    [store]
  );

  const update = useCallback(
    async (id: string, updates: Partial<SchedulerTask>) => {
      await window.idm.scheduler.update(id, updates);
      const existing = store.tasks.find(t => t.id === id);
      if (existing) store.upsertTask({ ...existing, ...updates });
    },
    [store]
  );

  const remove = useCallback(
    async (id: string) => {
      await window.idm.scheduler.delete(id);
      store.removeTask(id);
    },
    [store]
  );

  const toggle = useCallback(
    async (id: string) => {
      await window.idm.scheduler.toggle(id);
      const task = store.tasks.find(t => t.id === id);
      if (task) store.upsertTask({ ...task, enabled: !task.enabled });
    },
    [store]
  );

  return {
    tasks:   store.tasks,
    enabled: store.enabled,
    create,
    update,
    remove,
    toggle,
  };
}
