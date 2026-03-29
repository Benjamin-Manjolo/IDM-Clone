import { autoUpdater } from 'electron-updater';
import type { BrowserWindow } from 'electron';

export function setupUpdater(win: BrowserWindow): void {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update',  () => win.webContents.send('updater:checking'));
  autoUpdater.on('update-available',     (i) => win.webContents.send('updater:available', i));
  autoUpdater.on('update-not-available', (i) => win.webContents.send('updater:not-available', i));
  autoUpdater.on('error',                (e) => win.webContents.send('updater:error', e.message));
  autoUpdater.on('download-progress',    (p) => win.webContents.send('updater:progress', p));
  autoUpdater.on('update-downloaded',    (i) => {
    win.webContents.send('updater:downloaded', i);
    autoUpdater.quitAndInstall();
  });

  // Check once on launch, then every 4 hours
  setTimeout(() => autoUpdater.checkForUpdates(), 5000);
  setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
}