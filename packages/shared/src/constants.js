"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPC_CHANNELS = exports.CATEGORY_EXTENSIONS = exports.PROGRESS_UPDATE_INTERVAL = exports.MERGE_BUFFER_SIZE = exports.EXTENSION_PORT = exports.DEFAULT_CONNECTION_TIMEOUT = exports.DEFAULT_RETRY_DELAY = exports.DEFAULT_RETRY_COUNT = exports.DEFAULT_CONCURRENT_DOWNLOADS = exports.DEFAULT_CHUNK_SIZE = exports.DEFAULT_MAX_CONNECTIONS = void 0;
exports.DEFAULT_MAX_CONNECTIONS = 8;
exports.DEFAULT_CHUNK_SIZE = 1024 * 1024; // 1 MB
exports.DEFAULT_CONCURRENT_DOWNLOADS = 3;
exports.DEFAULT_RETRY_COUNT = 5;
exports.DEFAULT_RETRY_DELAY = 3000;
exports.DEFAULT_CONNECTION_TIMEOUT = 30000;
exports.EXTENSION_PORT = 9182;
exports.MERGE_BUFFER_SIZE = 4 * 1024 * 1024; // 4 MB
exports.PROGRESS_UPDATE_INTERVAL = 500; // ms
exports.CATEGORY_EXTENSIONS = {
    video: ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpeg', 'mpg', '3gp', 'ts'],
    audio: ['mp3', 'flac', 'aac', 'ogg', 'wav', 'm4a', 'wma', 'opus', 'aiff'],
    documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'odt', 'ods', 'odp', 'epub', 'mobi'],
    compressed: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'cab'],
    programs: ['exe', 'msi', 'dmg', 'pkg', 'deb', 'rpm', 'appimage', 'apk'],
    images: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp', 'tiff', 'ico', 'raw'],
};
exports.IPC_CHANNELS = {
    // Download
    DOWNLOAD_ADD: 'download:add',
    DOWNLOAD_PAUSE: 'download:pause',
    DOWNLOAD_RESUME: 'download:resume',
    DOWNLOAD_CANCEL: 'download:cancel',
    DOWNLOAD_REMOVE: 'download:remove',
    DOWNLOAD_PROGRESS: 'download:progress',
    DOWNLOAD_LIST: 'download:list',
    DOWNLOAD_OPEN: 'download:open',
    DOWNLOAD_OPEN_DIR: 'download:open-dir',
    // Queue
    QUEUE_LIST: 'queue:list',
    QUEUE_CREATE: 'queue:create',
    QUEUE_UPDATE: 'queue:update',
    QUEUE_DELETE: 'queue:delete',
    QUEUE_START: 'queue:start',
    QUEUE_STOP: 'queue:stop',
    QUEUE_STATS: 'queue:stats',
    // Scheduler
    SCHEDULER_LIST: 'scheduler:list',
    SCHEDULER_CREATE: 'scheduler:create',
    SCHEDULER_UPDATE: 'scheduler:update',
    SCHEDULER_DELETE: 'scheduler:delete',
    SCHEDULER_TOGGLE: 'scheduler:toggle',
    // Settings
    SETTINGS_GET: 'settings:get',
    SETTINGS_SET: 'settings:set',
    SETTINGS_RESET: 'settings:reset',
    // System
    DIALOG_OPEN_DIR: 'dialog:open-dir',
    DIALOG_SAVE_FILE: 'dialog:save-file',
    SHELL_OPEN: 'shell:open',
    APP_MINIMIZE: 'app:minimize',
    APP_QUIT: 'app:quit',
    UPDATER_CHECK: 'updater:check',
};
//# sourceMappingURL=constants.js.map