import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import type { SchedulerTask, SchedulerState } from '@idm/shared';
import { getNextRunTime } from './timeParser';
import { ShutdownManager } from './shutdownManager';

const CHECK_INTERVAL = 30_000; // 30 seconds

export class Scheduler extends EventEmitter {
  private tasks: Map<string, SchedulerTask> = new Map();
  private timer: ReturnType<typeof setInterval> | null = null;
  private enabled = false;
  private shutdown = new ShutdownManager();
  private onTaskFire?: (task: SchedulerTask) => Promise<void>;

  start(onTaskFire: (task: SchedulerTask) => Promise<void>): void {
    this.onTaskFire = onTaskFire;
    this.enabled = true;
    this.timer = setInterval(() => this.tick(), CHECK_INTERVAL);
    this.tick(); // immediate first check
  }

  stop(): void {
    this.enabled = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  private async tick(): Promise<void> {
    if (!this.enabled) return;
    const now = Date.now();

    for (const task of this.tasks.values()) {
      if (!task.enabled) continue;
      if (!task.nextRunAt) {
        task.nextRunAt = getNextRunTime(task) ?? undefined;
        continue;
      }
      if (task.nextRunAt <= now) {
        await this.fireTask(task);
      }
    }
  }

  private async fireTask(task: SchedulerTask): Promise<void> {
    task.lastRunAt = Date.now();
    task.nextRunAt = getNextRunTime(task, Date.now()) ?? undefined;

    this.emit('task-fired', task);

    try {
      if (task.onStart === 'start') {
        await this.onTaskFire?.(task);
      }
      if (task.stopTime && Date.now() >= task.stopTime && task.onStop) {
        await this.shutdown.execute(task.onStop);
      }
    } catch (err) {
      this.emit('task-error', { task, error: err });
    }

    // Disable once-only tasks
    if (task.repeat === 'once') task.enabled = false;
  }

  addTask(task: Omit<SchedulerTask, 'id' | 'createdAt' | 'nextRunAt'>): SchedulerTask {
    const full: SchedulerTask = {
      ...task,
      id: uuid(),
      createdAt: Date.now(),
      nextRunAt: undefined,
    };
    full.nextRunAt = getNextRunTime(full) ?? undefined;
    this.tasks.set(full.id, full);
    this.emit('task-added', full);
    return full;
  }

  updateTask(id: string, updates: Partial<SchedulerTask>): void {
    const t = this.tasks.get(id);
    if (!t) return;
    Object.assign(t, updates);
    t.nextRunAt = getNextRunTime(t) ?? undefined;
    this.emit('task-updated', t);
  }

  deleteTask(id: string): void {
    this.tasks.delete(id);
    this.emit('task-deleted', id);
  }

  getState(): SchedulerState {
    return { tasks: [...this.tasks.values()], enabled: this.enabled };
  }
}
