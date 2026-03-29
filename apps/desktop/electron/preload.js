"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var shared_1 = require("@idm/shared");
var api = {
    // ── Downloads ──────────────────────────────────────────────────────────────
    download: {
        add: function (opts) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_ADD, opts); },
        pause: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_PAUSE, id); },
        resume: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_RESUME, id); },
        cancel: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_CANCEL, id); },
        remove: function (id, del) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_REMOVE, id, del); },
        list: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_LIST); },
        open: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_OPEN, id); },
        openDir: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DOWNLOAD_OPEN_DIR, id); },
    },
    // ── Queue ──────────────────────────────────────────────────────────────────
    queue: {
        list: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_LIST); },
        create: function (name, opts) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_CREATE, name, opts); },
        update: function (id, updates) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_UPDATE, id, updates); },
        delete: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_DELETE, id); },
        start: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_START, id); },
        stop: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_STOP, id); },
        stats: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.QUEUE_STATS); },
    },
    // ── Scheduler ─────────────────────────────────────────────────────────────
    scheduler: {
        list: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SCHEDULER_LIST); },
        create: function (task) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SCHEDULER_CREATE, task); },
        update: function (id, updates) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SCHEDULER_UPDATE, id, updates); },
        delete: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SCHEDULER_DELETE, id); },
        toggle: function (id) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SCHEDULER_TOGGLE, id); },
    },
    // ── Settings ───────────────────────────────────────────────────────────────
    settings: {
        get: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SETTINGS_GET); },
        set: function (s) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SETTINGS_SET, s); },
        reset: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SETTINGS_RESET); },
    },
    // ── System ─────────────────────────────────────────────────────────────────
    system: {
        openDir: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DIALOG_OPEN_DIR); },
        saveFile: function (defaultPath) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.DIALOG_SAVE_FILE, defaultPath); },
        openPath: function (p) { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.SHELL_OPEN, p); },
        minimize: function () { return electron_1.ipcRenderer.send(shared_1.IPC_CHANNELS.APP_MINIMIZE); },
        quit: function () { return electron_1.ipcRenderer.send(shared_1.IPC_CHANNELS.APP_QUIT); },
        checkUpdate: function () { return electron_1.ipcRenderer.invoke(shared_1.IPC_CHANNELS.UPDATER_CHECK); },
    },
    // ── Event listeners ────────────────────────────────────────────────────────
    on: function (channel, cb) {
        var allowed = [
            shared_1.IPC_CHANNELS.DOWNLOAD_PROGRESS,
            'download:added', 'download:updated', 'download:completed',
            'updater:checking', 'updater:available', 'updater:not-available', 'updater:error',
        ];
        if (allowed.includes(channel)) {
            var wrapped_1 = function (_) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                return cb.apply(void 0, args);
            };
            electron_1.ipcRenderer.on(channel, wrapped_1);
            return function () { return electron_1.ipcRenderer.removeListener(channel, wrapped_1); };
        }
        return function () { };
    },
};
electron_1.contextBridge.exposeInMainWorld('idm', api);
