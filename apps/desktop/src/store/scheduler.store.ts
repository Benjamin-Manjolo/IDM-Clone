import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { SchedulerTask } from '@idm/shared';

interface SchedulerState {
  tasks: SchedulerTask[];
  enabled: boolean;
  setTasks: (tasks: SchedulerTask[]) => void;
  upsertTask: (task: SchedulerTask) => void;
  removeTask: (id: string) => void;
  setEnabled: (v: boolean) => void;
}

export const useSchedulerStore = create<SchedulerState>()(
  immer((set) => ({
    tasks: [],
    enabled: false,

    setTasks:   (tasks) => set((s) => { s.tasks = tasks; }),
    upsertTask: (task)  => set((s) => {
      const idx = s.tasks.findIndex(t => t.id === task.id);
      if (idx >= 0) s.tasks[idx] = task; else s.tasks.push(task);
    }),
    removeTask: (id) => set((s) => { s.tasks = s.tasks.filter(t => t.id !== id); }),
    setEnabled: (v)  => set((s) => { s.enabled = v; }),
  }))
);
