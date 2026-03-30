export type SchedulerAction = 'start' | 'stop' | 'shutdown' | 'hibernate' | 'sleep';
export type SchedulerRepeat = 'once' | 'daily' | 'weekly' | 'custom';
export interface SchedulerTask {
    id: string;
    name: string;
    queueId?: string;
    downloadIds?: string[];
    startTime?: number;
    stopTime?: number;
    repeat: SchedulerRepeat;
    intervalMs?: number;
    daysOfWeek?: number[];
    onStart: SchedulerAction;
    onStop?: SchedulerAction;
    speedLimit?: number;
    quotaMB?: number;
    enabled: boolean;
    lastRunAt?: number;
    nextRunAt?: number;
    createdAt: number;
}
export interface SchedulerState {
    tasks: SchedulerTask[];
    enabled: boolean;
}
//# sourceMappingURL=scheduler.d.ts.map