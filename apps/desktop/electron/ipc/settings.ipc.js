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
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSettingsIpc = setupSettingsIpc;
var shared_1 = require("@idm/shared");
function setupSettingsIpc(ipc, getSettings, setSettings) {
    ipc.handle(shared_1.IPC_CHANNELS.SETTINGS_GET, function () { return getSettings(); });
    ipc.handle(shared_1.IPC_CHANNELS.SETTINGS_SET, function (_, partial) {
        var merged = deepMerge(getSettings(), partial);
        setSettings(merged);
        return merged;
    });
    ipc.handle(shared_1.IPC_CHANNELS.SETTINGS_RESET, function () {
        // Caller resets by passing default; main.ts handles that
        return getSettings();
    });
}
function deepMerge(target, source) {
    var _a;
    var result = __assign({}, target);
    for (var _i = 0, _b = Object.keys(source); _i < _b.length; _i++) {
        var key = _b[_i];
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge((_a = target[key]) !== null && _a !== void 0 ? _a : {}, source[key]);
        }
        else {
            result[key] = source[key];
        }
    }
    return result;
}
