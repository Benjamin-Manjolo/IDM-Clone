/**
 * packages/scheduler/src/browser-shim.ts
 *
 * Browser-safe re-export of the scheduler package.
 * Only exports what the renderer (Vite/browser) actually needs.
 * Does NOT import Scheduler, ShutdownManager, QueueManager — those use
 * Node.js built-ins (child_process, events, fs) that crash in the browser.
 */

import type { SchedulerTask } from '@idm/shared';

// ── The only function the renderer uses from @idm/scheduler ────────────────
export function formatScheduleDescription(task: SchedulerTask): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  switch (task.repeat) {
    case 'once':
      return task.startTime
        ? `Once at ${new Date(task.startTime).toLocaleString()}`
        : 'Once (unscheduled)';
    case 'daily':
      return task.startTime
        ? `Daily at ${new Date(task.startTime).toLocaleTimeString()}`
        : 'Daily';
    case 'weekly': {
      const named = (task.daysOfWeek ?? []).map((d: number) => days[d]).join(', ');
      return `Weekly on ${named || '—'}`;
    }
    case 'custom':
      return task.intervalMs
        ? `Every ${Math.round(task.intervalMs / 60000)} minutes`
        : 'Custom interval';
    default:
      return 'Unknown';
  }
}

export function getNextRunTime(_task: SchedulerTask, _from?: number): number | null {
  return null; // not needed in renderer
}

// Stub classes — renderer never instantiates these, but importing the types
// must not fail at bundle time.
export class Scheduler {}
export class QueueManager {}
export class ShutdownManager {}
