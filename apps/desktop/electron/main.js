"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var path = require("path");
var download_ipc_1 = require("./ipc/download.ipc");
var queue_ipc_1 = require("./ipc/queue.ipc");
var scheduler_ipc_1 = require("./ipc/scheduler.ipc");
var settings_ipc_1 = require("./ipc/settings.ipc");
var tray_1 = require("./tray");
var menu_1 = require("./menu");
var updater_1 = require("./updater");
var downloader_1 = require("@idm/downloader");
var scheduler_1 = require("@idm/scheduler");
var shared_1 = require("@idm/shared");
var fs = require("fs");
var os = require("os");
var isDev = process.env.NODE_ENV === 'development';
var USER_DATA = electron_1.app.getPath('userData');
var SETTINGS_PATH = path.join(USER_DATA, 'settings.json');
// ── Default settings ──────────────────────────────────────────────────────────
var DEFAULT_SETTINGS = {
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
var mainWindow = null;
var settings = loadSettings();
var downloadManager;
var scheduler;
var queueManager;
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            var raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
            return __assign(__assign({}, DEFAULT_SETTINGS), raw);
        }
    }
    catch (_a) { }
    return __assign({}, DEFAULT_SETTINGS);
}
function saveSettings(s) {
    fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2), 'utf8');
}
function createWindow() {
    var win = new electron_1.BrowserWindow({
        width: 1100,
        height: 700,
        minWidth: 800,
        minHeight: 500,
        show: !settings.startMinimized,
        backgroundColor: electron_1.nativeTheme.shouldUseDarkColors ? '#1a1a2e' : '#ffffff',
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
    }
    else {
        win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
    }
    win.on('close', function (e) {
        if (settings.minimizeToTray) {
            e.preventDefault();
            win.hide();
        }
    });
    return win;
}
// ── App lifecycle ─────────────────────────────────────────────────────────────
electron_1.app.whenReady().then(function () {
    fs.mkdirSync(settings.save.defaultDownloadDir, { recursive: true });
    fs.mkdirSync(settings.save.tempDir, { recursive: true });
    downloadManager = new downloader_1.DownloadManager({
        downloadDir: settings.save.defaultDownloadDir,
        tempDir: settings.save.tempDir,
        maxConcurrent: settings.connection.maxConcurrentDownloads,
        globalSpeedLimit: settings.connection.globalSpeedLimit,
    });
    queueManager = new scheduler_1.QueueManager();
    scheduler = new scheduler_1.Scheduler();
    mainWindow = createWindow();
    (0, tray_1.createTray)(mainWindow, downloadManager);
    (0, menu_1.createMenu)(mainWindow);
    (0, updater_1.setupUpdater)(mainWindow);
    // Forward download events to renderer
    downloadManager.on('progress', function (item) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send(shared_1.IPC_CHANNELS.DOWNLOAD_PROGRESS, item);
    });
    downloadManager.on('added', function (item) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download:added', item);
    });
    downloadManager.on('updated', function (item) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download:updated', item);
    });
    downloadManager.on('completed', function (item) {
        mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.webContents.send('download:completed', item);
    });
    // IPC handlers
    (0, download_ipc_1.setupDownloadIpc)(electron_1.ipcMain, downloadManager, settings);
    (0, queue_ipc_1.setupQueueIpc)(electron_1.ipcMain, queueManager);
    (0, scheduler_ipc_1.setupSchedulerIpc)(electron_1.ipcMain, scheduler, downloadManager);
    (0, settings_ipc_1.setupSettingsIpc)(electron_1.ipcMain, function () { return settings; }, function (s) { settings = s; saveSettings(s); });
    // Generic handlers
    electron_1.ipcMain.handle(shared_1.IPC_CHANNELS.DIALOG_OPEN_DIR, function () { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, electron_1.dialog.showOpenDialog({ properties: ['openDirectory'] })];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, (_a = res.filePaths[0]) !== null && _a !== void 0 ? _a : null];
            }
        });
    }); });
    electron_1.ipcMain.handle(shared_1.IPC_CHANNELS.DIALOG_SAVE_FILE, function (_, defaultPath) { return __awaiter(void 0, void 0, void 0, function () {
        var res;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, electron_1.dialog.showSaveDialog({ defaultPath: defaultPath })];
                case 1:
                    res = _b.sent();
                    return [2 /*return*/, (_a = res.filePath) !== null && _a !== void 0 ? _a : null];
            }
        });
    }); });
    electron_1.ipcMain.handle(shared_1.IPC_CHANNELS.SHELL_OPEN, function (_, p) { return electron_1.shell.openPath(p); });
    electron_1.ipcMain.on(shared_1.IPC_CHANNELS.APP_MINIMIZE, function () { return mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.minimize(); });
    electron_1.ipcMain.on(shared_1.IPC_CHANNELS.APP_QUIT, function () { return electron_1.app.quit(); });
    electron_1.app.on('activate', function () {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            mainWindow = createWindow();
        else
            mainWindow === null || mainWindow === void 0 ? void 0 : mainWindow.show();
    });
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
electron_1.app.on('before-quit', function () {
    scheduler.stop();
});
