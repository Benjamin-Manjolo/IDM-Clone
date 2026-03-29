import { Tray, Menu, nativeImage, app } from 'electron';
import * as path from 'path';
import type { BrowserWindow } from 'electron';
import type { DownloadManager } from '@idm/downloader';

let tray: Tray | null = null;

export function createTray(win: BrowserWindow, manager: DownloadManager): void {
  const iconPath = path.join(__dirname, '../../assets/icons/tray.png');
  const img = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(img);
  tray.setToolTip('IDM Clone');

  const buildMenu = () => {
    const active = manager.getAll().filter(d => d.status === 'downloading');
    const speedStr = active.length
      ? formatSpeed(active.reduce((s, d) => s + d.speed, 0))
      : 'Idle';

    return Menu.buildFromTemplate([
      { label: `IDM Clone — ${speedStr}`, enabled: false },
      { type: 'separator' },
      { label: 'Show Window',  click: () => { win.show(); win.focus(); } },
      { label: 'Add URL...',   click: () => { win.show(); win.webContents.send('ui:add-url'); } },
      { type: 'separator' },
      {
        label: 'Pause All',
        enabled: active.length > 0,
        click: () => active.forEach(d => manager.pause(d.id)),
      },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]);
  };

  tray.setContextMenu(buildMenu());

  // Rebuild context menu every 2s to show live speed
  setInterval(() => {
    tray?.setContextMenu(buildMenu());
  }, 2000);

  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show();
  });
}

function formatSpeed(bps: number): string {
  if (bps >= 1024 * 1024) return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bps >= 1024) return `${Math.round(bps / 1024)} KB/s`;
  return `${bps} B/s`;
}
