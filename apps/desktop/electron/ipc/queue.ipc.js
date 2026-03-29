"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupQueueIpc = setupQueueIpc;
var shared_1 = require("@idm/shared");
function setupQueueIpc(ipc, manager) {
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_LIST, function () { return manager.getAllQueues(); });
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_CREATE, function (_, name, opts) { return manager.createQueue(name, opts); });
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_UPDATE, function (_, id, upd) { return manager.updateQueue(id, upd); });
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_DELETE, function (_, id) { return manager.deleteQueue(id); });
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_STATS, function () { return manager.getState(); });
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_START, function (_, id) {
        manager.updateQueue(id, { active: true });
    });
    ipc.handle(shared_1.IPC_CHANNELS.QUEUE_STOP, function (_, id) {
        manager.updateQueue(id, { active: false });
    });
}
