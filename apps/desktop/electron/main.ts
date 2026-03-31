import { app, BrowserWindow, ipcMain, shell, dialog, nativeTheme } from 'electron';
import * as path from 'path';
import { setupDownloadIpc } from './ipc/download.ipc';
import { setupQueueIpc } from './ipc/queue.ipc';
import { setupSchedulerIpc } from './ipc/scheduler.ipc';
import { setupSettingsIpc } from './ipc/settings.ipc';
import { createTray } from './tray';
import { createMenu } from './menu';
import { setupUpdater } from './updater';
import { DownloadManager } from '@idm/downloader';
import { Scheduler, QueueManager } from '@idm/scheduler';
import type { AppSettings } from '@idm/shared';
import { IPC_CHANNELS } from '@idm/shared';
import * as fs from 'fs';
import * as os from 'os';
const { WebSocketServer } = require('ws');

const isDev = process.env.NODE_ENV === 'development';
const USER_DATA = app.getPath('userData');
const SETTINGS_PATH = path.join(USER_DATA, 'settings.json');

// ── Default settings ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  language: 'en',
  startMinimized: false,
  minimizeToTray: true,
  startOnBoot: false,
  showSpeedInTray: true,
  checkForUpdates: true,
  connection: {
    maxConnections: 8,
    maxConcurrentDownloads: 3,
    globalSpeedLimit: 0,
    connectionTimeout: 30000,
    retryCount: 5,
    retryDelay: 3000,
    useProxy: false,
    proxyType: 'none',
  },
  save: {
    defaultDownloadDir: path.join(os.homedir(), 'Downloads'),
    tempDir: path.join(USER_DATA, 'temp'),
    createCategoryDirs: false,
    categoryDirs: {},
    filenameConflict: 'rename',
    deleteIncomplete: false,
  },
  integration: {
    browserExtensionEnabled: true,
    extensionPort: 9182,
    catchAllDownloads: true,
    minFileSizeToCatch: 0,
    fileTypesToCatch: [],
    fileTypesToIgnore: [],
    monitorClipboard: false,
  },
  notifications: {
    soundOnComplete: true,
    soundOnError: false,
    showDesktopNotification: true,
  },
  antivirus: { enabled: false },
};

// ── Globals ───────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let settings: AppSettings = loadSettings();
let downloadManager: DownloadManager;
let scheduler: Scheduler;
let queueManager: QueueManager;

function loadSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      return { ...DEFAULT_SETTINGS, ...raw };
    }
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(s: AppSettings): void {
  fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), 'utf8');
}

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    show: !settings.startMinimized,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1a1a2e' : '#ffffff',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '../../assets/icons/icon.png'),
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  win.on('close', (e) => {
    if (settings.minimizeToTray) {
      e.preventDefault();
      win.hide();
    }
  });

  return win;
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  fs.mkdirSync(settings.save.defaultDownloadDir, { recursive: true });
  fs.mkdirSync(settings.save.tempDir, { recursive: true });

  downloadManager = new DownloadManager({
    downloadDir: settings.save.defaultDownloadDir,
    tempDir: settings.save.tempDir,
    maxConcurrent: settings.connection.maxConcurrentDownloads,
    globalSpeedLimit: settings.connection.globalSpeedLimit,
  });


// Add this after downloadManager is initialized, inside app.whenReady()
const wss = new WebSocketServer({ port: 9182 });
const wsClients = new Set<any>();

wss.on('connection', (ws) => {
  wsClients.add(ws);
  console.log('[IDM] Extension connected');

  ws.on('message', (raw) => {
    try {
      const { type, data } = JSON.parse(raw.toString());
      if (type === 'download:add') {
        downloadManager.add({
          url: data.url,
          referrer: data.referrer,
          savePath: settings.save.defaultDownloadDir,
          maxConnections: settings.connection.maxConnections,
        });
      }
    } catch {}
  });

  ws.on('close', () => wsClients.delete(ws));
  ws.on('error', () => wsClients.delete(ws));
});

// Forward download events to all connected extensions
downloadManager.on('added', (item) => {
  const msg = JSON.stringify({ type: 'download:added', data: item });
  wsClients.forEach(ws => ws.readyState === 1 && ws.send(msg));
});
downloadManager.on('progress', (item) => {
  const msg = JSON.stringify({ type: 'download:progress', data: item });
  wsClients.forEach(ws => ws.readyState === 1 && ws.send(msg));
});

  queueManager = new QueueManager();
  scheduler = new Scheduler();

  mainWindow = createWindow();
  createTray(mainWindow, downloadManager);
  createMenu(mainWindow);
  setupUpdater(mainWindow);

  // Forward download events to renderer
  downloadManager.on('progress', (item) => {
    mainWindow?.webContents.send(IPC_CHANNELS.DOWNLOAD_PROGRESS, item);
  });
  downloadManager.on('added', (item) => {
    mainWindow?.webContents.send('download:added', item);
  });
  downloadManager.on('updated', (item) => {
    mainWindow?.webContents.send('download:updated', item);
  });
  downloadManager.on('completed', (item) => {
    mainWindow?.webContents.send('download:completed', item);
  });

  // IPC handlers
  setupDownloadIpc(ipcMain, downloadManager, settings);
  setupQueueIpc(ipcMain, queueManager);
  setupSchedulerIpc(ipcMain, scheduler, downloadManager);
  setupSettingsIpc(ipcMain, () => settings, (s) => { settings = s; saveSettings(s); });

  // Generic handlers
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_DIR, async () => {
    const res = await dialog.showOpenDialog({ properties: ['openDirectory'] });
    return res.filePaths[0] ?? null;
  });
  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_, defaultPath: string) => {
    const res = await dialog.showSaveDialog({ defaultPath });
    return res.filePath ?? null;
  });
  ipcMain.handle(IPC_CHANNELS.SHELL_OPEN, (_, p: string) => shell.openPath(p));
  ipcMain.on(IPC_CHANNELS.APP_MINIMIZE, () => mainWindow?.minimize());
  ipcMain.on(IPC_CHANNELS.APP_QUIT, () => app.quit());

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
    else mainWindow?.show();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  scheduler.stop();
});
