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
  ipc.handle(IPC_CHANNELS.DOWNLOAD_ADD, async (_, opts: AddDownloadOptions) => {
    const merged: AddDownloadOptions = {
      savePath: settings.save.defaultDownloadDir,
      maxConnections: settings.connection.maxConnections,
      ...opts,
    };
    return manager.add(merged);
  });

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

  ipc.handle(IPC_CHANNELS.DOWNLOAD_LIST, () => {
    return manager.getAll();
  });

  ipc.handle(IPC_CHANNELS.DOWNLOAD_OPEN, async (_, id: string) => {
    const item = manager.get(id);
    if (item) await shell.openPath(item.savePath);
  });

  ipc.handle(IPC_CHANNELS.DOWNLOAD_OPEN_DIR, async (_, id: string) => {
    const item = manager.get(id);
    if (item) await shell.showItemInFolder(item.savePath);
  });
}