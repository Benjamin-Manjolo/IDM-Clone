"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileIcon = getFileIcon;
exports.detectCategory = detectCategory;
exports.isValidUrl = isValidUrl;
exports.extractFilenameFromUrl = extractFilenameFromUrl;
var shared_1 = require("@idm/shared");
function getFileIcon(filename) {
    var _a, _b, _c;
    var ext = (_b = (_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    var icons = {
        // Video
        mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬', webm: '🎬',
        // Audio
        mp3: '🎵', flac: '🎵', aac: '🎵', wav: '🎵', ogg: '🎵',
        // Documents
        pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📋', pptx: '📋',
        // Compressed
        zip: '🗜', rar: '🗜', '7z': '🗜', tar: '🗜', gz: '🗜',
        // Programs
        exe: '⚙️', msi: '⚙️', dmg: '💿', pkg: '📦', deb: '📦', rpm: '📦',
        // Images
        jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼', svg: '🖼',
    };
    return (_c = icons[ext]) !== null && _c !== void 0 ? _c : '📁';
}
function detectCategory(filename) {
    var _a, _b;
    var ext = (_b = (_a = filename.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
    for (var _i = 0, _c = Object.entries(shared_1.CATEGORY_EXTENSIONS); _i < _c.length; _i++) {
        var _d = _c[_i], cat = _d[0], exts = _d[1];
        if (exts.includes(ext))
            return cat;
    }
    return 'general';
}
function isValidUrl(url) {
    try {
        var u = new URL(url);
        return ['http:', 'https:', 'ftp:', 'magnet:'].includes(u.protocol);
    }
    catch (_a) {
        return false;
    }
}
function extractFilenameFromUrl(url) {
    try {
        var u = new URL(url);
        var name_1 = u.pathname.split('/').pop();
        return name_1 ? decodeURIComponent(name_1) : 'download';
    }
    catch (_a) {
        return 'download';
    }
}
