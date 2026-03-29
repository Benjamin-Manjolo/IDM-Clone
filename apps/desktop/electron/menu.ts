import { Menu, shell, app } from 'electron';
import type { BrowserWindow } from 'electron';

export function createMenu(win: BrowserWindow): void {
  const isMac = process.platform === 'darwin';

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ label: app.name, submenu: [
      { role: 'about' as const },
      { type: 'separator' as const },
      { role: 'services' as const },
      { type: 'separator' as const },
      { role: 'hide' as const },
      { role: 'hideOthers' as const },
      { role: 'unhide' as const },
      { type: 'separator' as const },
      { role: 'quit' as const },
    ]}] : []),
    {
      label: 'Downloads',
      submenu: [
        { label: 'Add URL...', accelerator: 'CmdOrCtrl+N', click: () => win.webContents.send('ui:add-url') },
        { label: 'Add Batch...', click: () => win.webContents.send('ui:add-batch') },
        { type: 'separator' },
        { label: 'Pause All', accelerator: 'CmdOrCtrl+P', click: () => win.webContents.send('ui:pause-all') },
        { label: 'Resume All', accelerator: 'CmdOrCtrl+R', click: () => win.webContents.send('ui:resume-all') },
        { type: 'separator' },
        { label: 'Open Download Folder', click: () => win.webContents.send('ui:open-downloads') },
        { type: 'separator' },
        ...(!isMac ? [{ label: 'Exit', role: 'quit' as const }] : []),
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'All Downloads',  accelerator: 'CmdOrCtrl+1', click: () => win.webContents.send('ui:nav', '/') },
        { label: 'Queue',          accelerator: 'CmdOrCtrl+2', click: () => win.webContents.send('ui:nav', '/queue') },
        { label: 'Scheduler',      accelerator: 'CmdOrCtrl+3', click: () => win.webContents.send('ui:nav', '/scheduler') },
        { label: 'Grabber',        accelerator: 'CmdOrCtrl+4', click: () => win.webContents.send('ui:nav', '/grabber') },
        { type: 'separator' },
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: () => win.webContents.send('ui:nav', '/settings') },
        { label: 'Check for Updates', click: () => win.webContents.send('updater:check') },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Documentation', click: () => shell.openExternal('https://github.com/your-repo/idm-clone') },
        { label: 'Report Issue',  click: () => shell.openExternal('https://github.com/your-repo/idm-clone/issues') },
        { type: 'separator' },
        { label: 'About IDM Clone', click: () => win.webContents.send('ui:about') },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
