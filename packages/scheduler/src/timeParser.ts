import type { SchedulerTask } from '@idm/shared';

export function getNextRunTime(task: SchedulerTask, from: number = Date.now()): number | null {
  if (!task.enabled) return null;

  switch (task.repeat) {
    case 'once':
      if (task.startTime && task.startTime > from) return task.startTime;
      return null;

    case 'daily': {
      if (!task.startTime) return null;
      const d = new Date(task.startTime);
      const next = new Date(from);
      next.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
      if (next.getTime() <= from) next.setDate(next.getDate() + 1);
      return next.getTime();
    }

    case 'weekly': {
      if (!task.startTime || !task.daysOfWeek?.length) return null;
      const d = new Date(task.startTime);
      for (let offset = 0; offset <= 7; offset++) {
        const candidate = new Date(from);
        candidate.setDate(candidate.getDate() + offset);
        candidate.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
        if (candidate.getTime() > from && task.daysOfWeek.includes(candidate.getDay())) {
          return candidate.getTime();
        }
      }
      return null;
    }

    case 'custom': {
      if (!task.intervalMs) return null;
      const base = task.lastRunAt ?? task.startTime ?? from;
      return base + task.intervalMs;
    }

    default:
      return null;
  }
}

export function formatScheduleDescription(task: SchedulerTask): string {
  switch (task.repeat) {
    case 'once':
      return task.startTime ? `Once at ${new Date(task.startTime).toLocaleString()}` : 'Once (unscheduled)';
    case 'daily':
      return task.startTime ? `Daily at ${new Date(task.startTime).toLocaleTimeString()}` : 'Daily';
    case 'weekly': {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const named = (task.daysOfWeek ?? []).map((d: number) => days[d]).join(', ');
      return `Weekly on ${named}`;
    }
    case 'custom':
      return task.intervalMs ? `Every ${Math.round(task.intervalMs / 60000)} minutes` : 'Custom interval';
    default:
      return 'Unknown';
  }
}
