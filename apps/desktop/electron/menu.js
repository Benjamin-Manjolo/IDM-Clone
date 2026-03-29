"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenu = createMenu;
var electron_1 = require("electron");
function createMenu(win) {
    var isMac = process.platform === 'darwin';
    var template = __spreadArray(__spreadArray([], (isMac ? [{ label: electron_1.app.name, submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideOthers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' },
            ] }] : []), true), [
        {
            label: 'Downloads',
            submenu: __spreadArray([
                { label: 'Add URL...', accelerator: 'CmdOrCtrl+N', click: function () { return win.webContents.send('ui:add-url'); } },
                { label: 'Add Batch...', click: function () { return win.webContents.send('ui:add-batch'); } },
                { type: 'separator' },
                { label: 'Pause All', accelerator: 'CmdOrCtrl+P', click: function () { return win.webContents.send('ui:pause-all'); } },
                { label: 'Resume All', accelerator: 'CmdOrCtrl+R', click: function () { return win.webContents.send('ui:resume-all'); } },
                { type: 'separator' },
                { label: 'Open Download Folder', click: function () { return win.webContents.send('ui:open-downloads'); } },
                { type: 'separator' }
            ], (!isMac ? [{ label: 'Exit', role: 'quit' }] : []), true),
        },
        {
            label: 'View',
            submenu: [
                { label: 'All Downloads', accelerator: 'CmdOrCtrl+1', click: function () { return win.webContents.send('ui:nav', '/'); } },
                { label: 'Queue', accelerator: 'CmdOrCtrl+2', click: function () { return win.webContents.send('ui:nav', '/queue'); } },
                { label: 'Scheduler', accelerator: 'CmdOrCtrl+3', click: function () { return win.webContents.send('ui:nav', '/scheduler'); } },
                { label: 'Grabber', accelerator: 'CmdOrCtrl+4', click: function () { return win.webContents.send('ui:nav', '/grabber'); } },
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
                { label: 'Settings', accelerator: 'CmdOrCtrl+,', click: function () { return win.webContents.send('ui:nav', '/settings'); } },
                { label: 'Check for Updates', click: function () { return win.webContents.send('updater:check'); } },
            ],
        },
        {
            label: 'Help',
            submenu: [
                { label: 'Documentation', click: function () { return electron_1.shell.openExternal('https://github.com/your-repo/idm-clone'); } },
                { label: 'Report Issue', click: function () { return electron_1.shell.openExternal('https://github.com/your-repo/idm-clone/issues'); } },
                { type: 'separator' },
                { label: 'About IDM Clone', click: function () { return win.webContents.send('ui:about'); } },
            ],
        },
    ], false);
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
