"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class QueueManager extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.queues = new Map();
        this.activeQueueId = null;
    }
    createQueue(name, opts = {}) {
        const queue = {
            id: (0, uuid_1.v4)(),
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
    updateQueue(id, updates) {
        const q = this.queues.get(id);
        if (!q)
            return;
        Object.assign(q, updates);
        this.emit('queue-updated', q);
    }
    deleteQueue(id) {
        this.queues.delete(id);
        if (this.activeQueueId === id)
            this.activeQueueId = null;
        this.emit('queue-deleted', id);
    }
    addToQueue(queueId, downloadId) {
        const q = this.queues.get(queueId);
        if (!q || q.downloadIds.includes(downloadId))
            return;
        q.downloadIds.push(downloadId);
        this.emit('queue-updated', q);
    }
    removeFromQueue(queueId, downloadId) {
        const q = this.queues.get(queueId);
        if (!q)
            return;
        q.downloadIds = q.downloadIds.filter((id) => id !== downloadId);
        this.emit('queue-updated', q);
    }
    getQueue(id) {
        return this.queues.get(id);
    }
    getAllQueues() {
        return [...this.queues.values()];
    }
    getState() {
        return {
            queues: this.getAllQueues(),
            activeQueueId: this.activeQueueId,
            globalMaxConcurrent: 3,
            globalSpeedLimit: 0,
        };
    }
}
exports.QueueManager = QueueManager;
//# sourceMappingURL=queueManager.js.map