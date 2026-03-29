"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupUpdater = setupUpdater;
var electron_updater_1 = require("electron-updater");
function setupUpdater(win) {
    electron_updater_1.autoUpdater.autoDownload = false;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    electron_updater_1.autoUpdater.on('checking-for-update', function () { return win.webContents.send('updater:checking'); });
    electron_updater_1.autoUpdater.on('update-available', function (i) { return win.webContents.send('updater:available', i); });
    electron_updater_1.autoUpdater.on('update-not-available', function (i) { return win.webContents.send('updater:not-available', i); });
    electron_updater_1.autoUpdater.on('error', function (e) { return win.webContents.send('updater:error', e.message); });
    electron_updater_1.autoUpdater.on('download-progress', function (p) { return win.webContents.send('updater:progress', p); });
    electron_updater_1.autoUpdater.on('update-downloaded', function (i) {
        win.webContents.send('updater:downloaded', i);
        electron_updater_1.autoUpdater.quitAndInstall();
    });
    // Check once on launch, then every 4 hours
    setTimeout(function () { return electron_updater_1.autoUpdater.checkForUpdates(); }, 5000);
    setInterval(function () { return electron_updater_1.autoUpdater.checkForUpdates(); }, 4 * 60 * 60 * 1000);
}
