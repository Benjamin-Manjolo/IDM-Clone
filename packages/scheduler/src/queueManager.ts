import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';
import type { DownloadQueue, QueueState } from '@idm/shared';

export class QueueManager extends EventEmitter {
  private queues: Map<string, DownloadQueue> = new Map();
  private activeQueueId: string | null = null;

  createQueue(name: string, opts: Partial<DownloadQueue> = {}): DownloadQueue {
    const queue: DownloadQueue = {
      id: uuid(),
      name,
      downloadIds: [],
      maxConcurrent: opts.maxConcurrent ?? 3,
      speedLimit: opts.speedLimit ?? 0,
      active: false,
      createdAt: Date.now(),
    };
    this.queues.set(queue.id, queue);
    this.emit('queue-created', queue);
    return queue;
  }

  updateQueue(id: string, updates: Partial<DownloadQueue>): void {
    const q = this.queues.get(id);
    if (!q) return;
    Object.assign(q, updates);
    this.emit('queue-updated', q);
  }

  deleteQueue(id: string): void {
    this.queues.delete(id);
    if (this.activeQueueId === id) this.activeQueueId = null;
    this.emit('queue-deleted', id);
  }

  addToQueue(queueId: string, downloadId: string): void {
    const q = this.queues.get(queueId);
    if (!q || q.downloadIds.includes(downloadId)) return;
    q.downloadIds.push(downloadId);
    this.emit('queue-updated', q);
  }

  removeFromQueue(queueId: string, downloadId: string): void {
    const q = this.queues.get(queueId);
    if (!q) return;
    q.downloadIds = q.downloadIds.filter((id: string) => id !== downloadId);
    this.emit('queue-updated', q);
  }

  getQueue(id: string): DownloadQueue | undefined {
    return this.queues.get(id);
  }

  getAllQueues(): DownloadQueue[] {
    return [...this.queues.values()];
  }

  getState(): QueueState {
    return {
      queues: this.getAllQueues(),
      activeQueueId: this.activeQueueId,
      globalMaxConcurrent: 3,
      globalSpeedLimit: 0,
    };
  }
}
