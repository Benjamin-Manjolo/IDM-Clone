export interface DownloadQueue {
    id: string;
    name: string;
    downloadIds: string[];
    maxConcurrent: number;
    speedLimit: number;
    active: boolean;
    createdAt: number;
}
export interface QueueState {
    queues: DownloadQueue[];
    activeQueueId: string | null;
    globalMaxConcurrent: number;
    globalSpeedLimit: number;
}
export interface QueueStats {
    total: number;
    active: number;
    queued: number;
    completed: number;
    failed: number;
    totalBytes: number;
    downloadedBytes: number;
    currentSpeed: number;
}
//# sourceMappingURL=queue.d.ts.map