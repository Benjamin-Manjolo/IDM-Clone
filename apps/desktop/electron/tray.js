"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTray = createTray;
var electron_1 = require("electron");
var path = require("path");
var tray = null;
function createTray(win, manager) {
    var iconPath = path.join(__dirname, '../../assets/icons/tray.png');
    var img = electron_1.nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    tray = new electron_1.Tray(img);
    tray.setToolTip('IDM Clone');
    var buildMenu = function () {
        var active = manager.getAll().filter(function (d) { return d.status === 'downloading'; });
        var speedStr = active.length
            ? formatSpeed(active.reduce(function (s, d) { return s + d.speed; }, 0))
            : 'Idle';
        return electron_1.Menu.buildFromTemplate([
            { label: "IDM Clone \u2014 ".concat(speedStr), enabled: false },
            { type: 'separator' },
            { label: 'Show Window', click: function () { win.show(); win.focus(); } },
            { label: 'Add URL...', click: function () { win.show(); win.webContents.send('ui:add-url'); } },
            { type: 'separator' },
            {
                label: 'Pause All',
                enabled: active.length > 0,
                click: function () { return active.forEach(function (d) { return manager.pause(d.id); }); },
            },
            { type: 'separator' },
            { label: 'Quit', click: function () { return electron_1.app.quit(); } },
        ]);
    };
    tray.setContextMenu(buildMenu());
    // Rebuild context menu every 2s to show live speed
    setInterval(function () {
        tray === null || tray === void 0 ? void 0 : tray.setContextMenu(buildMenu());
    }, 2000);
    tray.on('click', function () {
        win.isVisible() ? win.hide() : win.show();
    });
}
function formatSpeed(bps) {
    if (bps >= 1024 * 1024)
        return "".concat((bps / (1024 * 1024)).toFixed(1), " MB/s");
    if (bps >= 1024)
        return "".concat(Math.round(bps / 1024), " KB/s");
    return "".concat(bps, " B/s");
}
