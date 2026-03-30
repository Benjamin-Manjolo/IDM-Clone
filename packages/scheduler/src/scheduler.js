"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const timeParser_1 = require("./timeParser");
const shutdownManager_1 = require("./shutdownManager");
const CHECK_INTERVAL = 30000; // 30 seconds
class Scheduler extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.tasks = new Map();
        this.timer = null;
        this.enabled = false;
        this.shutdown = new shutdownManager_1.ShutdownManager();
    }
    start(onTaskFire) {
        this.onTaskFire = onTaskFire;
        this.enabled = true;
        this.timer = setInterval(() => this.tick(), CHECK_INTERVAL);
        this.tick(); // immediate first check
    }
    stop() {
        this.enabled = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async tick() {
        if (!this.enabled)
            return;
        const now = Date.now();
        for (const task of this.tasks.values()) {
            if (!task.enabled)
                continue;
            if (!task.nextRunAt) {
                task.nextRunAt = (0, timeParser_1.getNextRunTime)(task) ?? undefined;
                continue;
            }
            if (task.nextRunAt <= now) {
                await this.fireTask(task);
            }
        }
    }
    async fireTask(task) {
        task.lastRunAt = Date.now();
        task.nextRunAt = (0, timeParser_1.getNextRunTime)(task, Date.now()) ?? undefined;
        this.emit('task-fired', task);
        try {
            if (task.onStart === 'start') {
                await this.onTaskFire?.(task);
            }
            if (task.stopTime && Date.now() >= task.stopTime && task.onStop) {
                await this.shutdown.execute(task.onStop);
            }
        }
        catch (err) {
            this.emit('task-error', { task, error: err });
        }
        // Disable once-only tasks
        if (task.repeat === 'once')
            task.enabled = false;
    }
    addTask(task) {
        const full = {
            ...task,
            id: (0, uuid_1.v4)(),
            createdAt: Date.now(),
            nextRunAt: undefined,
        };
        full.nextRunAt = (0, timeParser_1.getNextRunTime)(full) ?? undefined;
        this.tasks.set(full.id, full);
        this.emit('task-added', full);
        return full;
    }
    updateTask(id, updates) {
        const t = this.tasks.get(id);
        if (!t)
            return;
        Object.assign(t, updates);
        t.nextRunAt = (0, timeParser_1.getNextRunTime)(t) ?? undefined;
        this.emit('task-updated', t);
    }
    deleteTask(id) {
        this.tasks.delete(id);
        this.emit('task-deleted', id);
    }
    getState() {
        return { tasks: [...this.tasks.values()], enabled: this.enabled };
    }
}
exports.Scheduler = Scheduler;
