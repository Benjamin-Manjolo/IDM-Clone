export type SchedulerAction = 'start' | 'stop' | 'shutdown' | 'hibernate' | 'sleep';
export type SchedulerRepeat = 'once' | 'daily' | 'weekly' | 'custom';

export interface SchedulerTask {
  id: string;
  name: string;
  queueId?: string;
  downloadIds?: string[];

  // Timing
  startTime?: number;   // Unix ms
  stopTime?: number;    // Unix ms
  repeat: SchedulerRepeat;
  intervalMs?: number;  // for 'custom'
  daysOfWeek?: number[]; // 0-6, for 'weekly'

  // Actions
  onStart: SchedulerAction;
  onStop?: SchedulerAction;

  // Limits
  speedLimit?: number;   // bytes/sec during this schedule
  quotaMB?: number;      // MB per hour cap (FAP)

  enabled: boolean;
  lastRunAt?: number;
  nextRunAt?: number;
  createdAt: number;
}

export interface SchedulerState {
  tasks: SchedulerTask[];
  enabled: boolean;
}
