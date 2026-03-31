/**
 * download.ipc.ts
 *
 * IPC handlers for all download operations.
 * Handles standard file downloads + HLS/DASH video downloads
 * dispatched from the browser extension.
 */
import type { IpcMain } from 'electron';
import { shell } from 'electron';
import type { DownloadManager } from '@idm/downloader';
import type { AppSettings, AddDownloadOptions } from '@idm/shared';
import { IPC_CHANNELS } from '@idm/shared';

export function setupDownloadIpc(
  ipc: IpcMain,
  manager: DownloadManager,
  settings: AppSettings
): void {

  // ── Add a single download ────────────────────────────────────────────────
  ipc.handle(IPC_CHANNELS.DOWNLOAD_ADD, async (_, opts: AddDownloadOptions) => {
    const merged: AddDownloadOptions = {
      savePath: settings.save.defaultDownloadDir,
      maxConnections: settings.connection.maxConnections,
      ...opts,
    };
    return manager.add(merged);
  });

  // ── Batch add (from "download all links on page") ────────────────────────
  ipc.handle('download:add-batch', async (_, urls: string[], referrer?: string) => {
    const results = [];
    for (const url of urls.slice(0, 100)) {
      try {
        const item = await manager.add({
          url,
          referrer,
          savePath: settings.save.defaultDownloadDir,
          maxConnections: settings.connection.maxConnections,
        });
        results.push({ url, id: item.id, ok: true });
      } catch (err) {
        results.push({ url, ok: false, error: (err as Error).message });
      }
    }
    return results;
  });

  // ── Control ──────────────────────────────────────────────────────────────
  ipc.handle(IPC_CHANNELS.DOWNLOAD_PAUSE, (_, id: string) => {
    manager.pause(id);
  });

  ipc.handle(IPC_CHANNELS.DOWNLOAD_RESUME, (_, id: string) => {
    manager.resume(id);
  });

  ipc.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, (_, id: string) => {
    manager.cancel(id);
  });

  ipc.handle(IPC_CHANNELS.DOWNLOAD_REMOVE, (_, id: string, deleteFile = false) => {
    manager.remove(id, deleteFile);
  });

  // ── Query ────────────────────────────────────────────────────────────────
  ipc.handle(IPC_CHANNELS.DOWNLOAD_LIST, () => {
    return manager.getAll();
  });

  // ── Shell ────────────────────────────────────────────────────────────────
  ipc.handle(IPC_CHANNELS.DOWNLOAD_OPEN, async (_, id: string) => {
    const item = manager.get(id);
    if (item) await shell.openPath(item.savePath);
  });

  ipc.handle(IPC_CHANNELS.DOWNLOAD_OPEN_DIR, async (_, id: string) => {
    const item = manager.get(id);
    if (item) await shell.showItemInFolder(item.savePath);
  });
}
