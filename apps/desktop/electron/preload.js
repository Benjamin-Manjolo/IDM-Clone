"use strict";
// ─────────────────────────────────────────────────────────────────────────────
// preload.js  –  self-contained, zero workspace imports
//
// Drop this file into:  apps/desktop/electron/preload.js
// It replaces the TypeScript-compiled version which breaks at runtime because
// require('@idm/shared') can't be resolved from inside Electron's main process.
// ─────────────────────────────────────────────────────────────────────────────

const { contextBridge, ipcRenderer } = require('electron');

// Inline IPC channel constants (copy of packages/shared/src/constants.ts)
const IPC = {
  DOWNLOAD_ADD:      'download:add',
  DOWNLOAD_PAUSE:    'download:pause',
  DOWNLOAD_RESUME:   'download:resume',
  DOWNLOAD_CANCEL:   'download:cancel',
  DOWNLOAD_REMOVE:   'download:remove',
  DOWNLOAD_PROGRESS: 'download:progress',
  DOWNLOAD_LIST:     'download:list',
  DOWNLOAD_OPEN:     'download:open',
  DOWNLOAD_OPEN_DIR: 'download:open-dir',

  QUEUE_LIST:    'queue:list',
  QUEUE_CREATE:  'queue:create',
  QUEUE_UPDATE:  'queue:update',
  QUEUE_DELETE:  'queue:delete',
  QUEUE_START:   'queue:start',
  QUEUE_STOP:    'queue:stop',
  QUEUE_STATS:   'queue:stats',

  SCHEDULER_LIST:   'scheduler:list',
  SCHEDULER_CREATE: 'scheduler:create',
  SCHEDULER_UPDATE: 'scheduler:update',
  SCHEDULER_DELETE: 'scheduler:delete',
  SCHEDULER_TOGGLE: 'scheduler:toggle',

  SETTINGS_GET:   'settings:get',
  SETTINGS_SET:   'settings:set',
  SETTINGS_RESET: 'settings:reset',

  DIALOG_OPEN_DIR:  'dialog:open-dir',
  DIALOG_SAVE_FILE: 'dialog:save-file',
  SHELL_OPEN:       'shell:open',
  APP_MINIMIZE:     'app:minimize',
  APP_QUIT:         'app:quit',
  UPDATER_CHECK:    'updater:check',
};

const ALLOWED_EVENTS = [
  IPC.DOWNLOAD_PROGRESS,
  'download:added', 'download:updated', 'download:completed',
  'updater:checking', 'updater:available', 'updater:not-available',
  'updater:error', 'updater:downloaded',
  'ui:add-url', 'ui:pause-all', 'ui:resume-all', 'ui:nav',
  'ui:about', 'ui:open-downloads', 'ui:add-batch',
];

const api = {
  // ── Downloads ──────────────────────────────────────────────────────────
  download: {
    add:     (opts)          => ipcRenderer.invoke(IPC.DOWNLOAD_ADD, opts),
    pause:   (id)            => ipcRenderer.invoke(IPC.DOWNLOAD_PAUSE, id),
    resume:  (id)            => ipcRenderer.invoke(IPC.DOWNLOAD_RESUME, id),
    cancel:  (id)            => ipcRenderer.invoke(IPC.DOWNLOAD_CANCEL, id),
    remove:  (id, del)       => ipcRenderer.invoke(IPC.DOWNLOAD_REMOVE, id, del),
    list:    ()              => ipcRenderer.invoke(IPC.DOWNLOAD_LIST),
    open:    (id)            => ipcRenderer.invoke(IPC.DOWNLOAD_OPEN, id),
    openDir: (id)            => ipcRenderer.invoke(IPC.DOWNLOAD_OPEN_DIR, id),
  },

  // ── Queue ──────────────────────────────────────────────────────────────
  queue: {
    list:   ()               => ipcRenderer.invoke(IPC.QUEUE_LIST),
    create: (name, opts)     => ipcRenderer.invoke(IPC.QUEUE_CREATE, name, opts),
    update: (id, updates)    => ipcRenderer.invoke(IPC.QUEUE_UPDATE, id, updates),
    delete: (id)             => ipcRenderer.invoke(IPC.QUEUE_DELETE, id),
    start:  (id)             => ipcRenderer.invoke(IPC.QUEUE_START, id),
    stop:   (id)             => ipcRenderer.invoke(IPC.QUEUE_STOP, id),
    stats:  ()               => ipcRenderer.invoke(IPC.QUEUE_STATS),
  },

  // ── Scheduler ─────────────────────────────────────────────────────────
  scheduler: {
    list:   ()               => ipcRenderer.invoke(IPC.SCHEDULER_LIST),
    create: (task)           => ipcRenderer.invoke(IPC.SCHEDULER_CREATE, task),
    update: (id, updates)    => ipcRenderer.invoke(IPC.SCHEDULER_UPDATE, id, updates),
    delete: (id)             => ipcRenderer.invoke(IPC.SCHEDULER_DELETE, id),
    toggle: (id)             => ipcRenderer.invoke(IPC.SCHEDULER_TOGGLE, id),
  },

  // ── Settings ───────────────────────────────────────────────────────────
  settings: {
    get:   ()                => ipcRenderer.invoke(IPC.SETTINGS_GET),
    set:   (s)               => ipcRenderer.invoke(IPC.SETTINGS_SET, s),
    reset: ()                => ipcRenderer.invoke(IPC.SETTINGS_RESET),
  },

  // ── System ─────────────────────────────────────────────────────────────
  system: {
    openDir:     ()          => ipcRenderer.invoke(IPC.DIALOG_OPEN_DIR),
    saveFile:    (p)         => ipcRenderer.invoke(IPC.DIALOG_SAVE_FILE, p),
    openPath:    (p)         => ipcRenderer.invoke(IPC.SHELL_OPEN, p),
    minimize:    ()          => ipcRenderer.send(IPC.APP_MINIMIZE),
    quit:        ()          => ipcRenderer.send(IPC.APP_QUIT),
    checkUpdate: ()          => ipcRenderer.invoke(IPC.UPDATER_CHECK),
  },

  // ── Event bridge ──────────────────────────────────────────────────────
  on: (channel, cb) => {
    if (!ALLOWED_EVENTS.includes(channel)) return () => {};
    const wrapped = (_evt, ...args) => cb(...args);
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
};

contextBridge.exposeInMainWorld('idm', api);
