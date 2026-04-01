/**
 * preload.ts
 *
 * Electron preload script — exposes the IDM API to the renderer process
 * via contextBridge. Keeps the renderer sandboxed while allowing controlled
 * IPC communication.
 */
import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '@idm/shared';
import type { AddDownloadOptions, AppSettings } from '@idm/shared';

const api = {
  // ── Downloads ──────────────────────────────────────────────────────────────
  download: {
    add:      (opts: AddDownloadOptions) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_ADD, opts),
    addBatch: (urls: string[], referrer?: string) =>
                ipcRenderer.invoke('download:add-batch', urls, referrer),
    pause:    (id: string) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_PAUSE, id),
    resume:   (id: string) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_RESUME, id),
    cancel:   (id: string) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CANCEL, id),
    remove:   (id: string, del?: boolean) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_REMOVE, id, del),
    list:     () =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_LIST),
    open:     (id: string) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_OPEN, id),
    openDir:  (id: string) =>
                ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_OPEN_DIR, id),
  },

  // ── Queue ──────────────────────────────────────────────────────────────────
  queue: {
    list:   () =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_LIST),
    create: (name: string, opts?: object) =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_CREATE, name, opts),
    update: (id: string, updates: object) =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_UPDATE, id, updates),
    delete: (id: string) =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_DELETE, id),
    start:  (id: string) =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_START, id),
    stop:   (id: string) =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_STOP, id),
    stats:  () =>
              ipcRenderer.invoke(IPC_CHANNELS.QUEUE_STATS),
  },

  // ── Scheduler ─────────────────────────────────────────────────────────────
  scheduler: {
    list:   () =>
              ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_LIST),
    create: (task: object) =>
              ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_CREATE, task),
    update: (id: string, updates: object) =>
              ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_UPDATE, id, updates),
    delete: (id: string) =>
              ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_DELETE, id),
    toggle: (id: string) =>
              ipcRenderer.invoke(IPC_CHANNELS.SCHEDULER_TOGGLE, id),
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: {
    get:   () =>
             ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set:   (s: Partial<AppSettings>) =>
             ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, s),
    reset: () =>
             ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_RESET),
  },

  // ── System ─────────────────────────────────────────────────────────────────
  system: {
    openDir:     () =>
                   ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_DIR),
    saveFile:    (defaultPath: string) =>
                   ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, defaultPath),
    openPath:    (p: string) =>
                   ipcRenderer.invoke(IPC_CHANNELS.SHELL_OPEN, p),
    minimize:    () =>
                   ipcRenderer.send(IPC_CHANNELS.APP_MINIMIZE),
    quit:        () =>
                   ipcRenderer.send(IPC_CHANNELS.APP_QUIT),
    checkUpdate: () =>
                   ipcRenderer.invoke(IPC_CHANNELS.UPDATER_CHECK),
  },

  // ── Site Grabber ───────────────────────────────────────────────────────────
  grabber: {
    start: (args: {
      url: string;
      maxDepth?: number;
      stayOnDomain?: boolean;
      includeExt?: string;
      excludeExt?: string;
    }) => ipcRenderer.invoke('grabber:start', args),
  },

  // ── Event listeners ────────────────────────────────────────────────────────
  on: (channel: string, cb: (...args: unknown[]) => void): (() => void) => {
    const ALLOWED_CHANNELS = new Set([
      IPC_CHANNELS.DOWNLOAD_PROGRESS,
      'download:added',
      'download:updated',
      'download:completed',
      'updater:checking',
      'updater:available',
      'updater:not-available',
      'updater:error',
      'updater:downloaded',
      'ui:add-url',
      'ui:add-batch',
      'ui:pause-all',
      'ui:resume-all',
      'ui:nav',
      'ui:about',
      'ui:open-downloads',
      'grabber:progress',
      'grabber:found',
    ]);

    if (!ALLOWED_CHANNELS.has(channel)) return () => { /* noop */ };

    const wrapped = (_evt: Electron.IpcRendererEvent, ...args: unknown[]) =>
      cb(...args);

    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },
};

contextBridge.exposeInMainWorld('idm', api);

export type IDMApi = typeof api;
