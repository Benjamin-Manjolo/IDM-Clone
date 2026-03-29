"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatBytes = formatBytes;
exports.formatSpeed = formatSpeed;
exports.formatTime = formatTime;
exports.formatPercent = formatPercent;
exports.formatDate = formatDate;
exports.formatShortDate = formatShortDate;
exports.truncate = truncate;
function formatBytes(bytes, decimals) {
    if (decimals === void 0) { decimals = 1; }
    if (bytes < 0)
        return '—';
    if (bytes === 0)
        return '0 B';
    var k = 1024;
    var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    var idx = Math.min(i, sizes.length - 1);
    return "".concat(parseFloat((bytes / Math.pow(k, idx)).toFixed(decimals)), " ").concat(sizes[idx]);
}
function formatSpeed(bps) {
    if (bps <= 0)
        return '—';
    return "".concat(formatBytes(bps, 1), "/s");
}
function formatTime(seconds) {
    if (seconds < 0 || !isFinite(seconds))
        return '—';
    if (seconds < 60)
        return "".concat(Math.round(seconds), "s");
    if (seconds < 3600)
        return "".concat(Math.floor(seconds / 60), "m ").concat(Math.round(seconds % 60), "s");
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    return "".concat(h, "h ").concat(m, "m");
}
function formatPercent(downloaded, total) {
    if (total <= 0)
        return 0;
    return Math.min(100, Math.round((downloaded / total) * 100));
}
function formatDate(ts) {
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    }).format(new Date(ts));
}
function formatShortDate(ts) {
    var d = new Date(ts);
    var now = new Date();
    if (d.toDateString() === now.toDateString()) {
        return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
function truncate(str, maxLen) {
    if (str.length <= maxLen)
        return str;
    var ext = str.includes('.') ? '.' + str.split('.').pop() : '';
    var base = str.slice(0, maxLen - ext.length - 3);
    return "".concat(base, "...").concat(ext);
}
