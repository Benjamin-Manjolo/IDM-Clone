"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadManager = void 0;
const events_1 = require("events");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const shared_1 = require("@idm/shared");
const http_1 = require("../protocols/http");
const chunkAllocator_1 = require("./chunkAllocator");
const segmentManager_1 = require("./segmentManager");
const resumeManager_1 = require("./resumeManager");
class DownloadManager extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.opts = opts;
        this.downloads = new Map();
        this.managers = new Map();
        this.http = new http_1.HttpProtocol();
        this.maxConcurrent = opts.maxConcurrent ?? shared_1.DEFAULT_CONCURRENT_DOWNLOADS;
        this.globalSpeedLimit = opts.globalSpeedLimit ?? 0;
        this.resumeManager = new resumeManager_1.ResumeManager(opts.tempDir ?? opts.downloadDir);
    }
    async add(options) {
        const id = (0, uuid_1.v4)();
        const filename = options.filename ?? this.extractFilename(options.url);
        const savePath = options.savePath ?? path.join(this.opts.downloadDir, filename);
        const category = options.category ?? this.detectCategory(filename);
        const item = {
            id,
            url: options.url,
            filename,
            savePath,
            category,
            status: 'queued',
            protocol: chunkAllocator_1.ChunkAllocator.detectProtocol(options.url),
            totalSize: -1,
            downloadedSize: 0,
            speed: 0,
            averageSpeed: 0,
            timeRemaining: -1,
            segments: [],
            maxConnections: options.maxConnections ?? shared_1.DEFAULT_MAX_CONNECTIONS,
            createdAt: Date.now(),
            retryCount: 0,
            resumable: false,
            referrer: options.referrer,
            cookies: options.cookies,
            headers: options.headers,
        };
        this.downloads.set(id, item);
        this.emit('added', item);
        if (options.startImmediately !== false) {
            await this.start(id);
        }
        return item;
    }
    async start(id) {
        const item = this.downloads.get(id);
        if (!item)
            throw new Error(`Download ${id} not found`);
        if (item.status === 'downloading')
            return;
        const active = [...this.downloads.values()].filter(d => d.status === 'downloading').length;
        if (active >= this.maxConcurrent) {
            item.status = 'queued';
            this.emit('updated', item);
            return;
        }
        item.status = 'downloading';
        item.startedAt = Date.now();
        this.emit('updated', item);
        try {
            if (item.totalSize < 0) {
                const info = await this.http.probe(item.url, item.headers);
                item.totalSize = info.contentLength;
                item.resumable = info.resumable;
                if (info.filename && item.filename === this.extractFilename(item.url)) {
                    item.filename = info.filename;
                    item.savePath = path.join(path.dirname(item.savePath), info.filename);
                }
            }
            const resumeData = this.resumeManager.load(id);
            if (resumeData && item.resumable) {
                item.segments = resumeData.segments;
                item.downloadedSize = resumeData.downloadedSize;
            }
            else {
                const allocator = new chunkAllocator_1.ChunkAllocator({ totalSize: item.totalSize, maxConnections: item.maxConnections });
                item.segments = allocator.createInitialSegments(item.resumable);
            }
            this.resumeManager.save({
                id, url: item.url, filename: item.filename,
                savePath: item.savePath, totalSize: item.totalSize,
                downloadedSize: item.downloadedSize, segments: item.segments,
                headers: item.headers, cookies: item.cookies, createdAt: item.createdAt, updatedAt: Date.now(),
            });
            const manager = new segmentManager_1.SegmentManager({
                downloadId: id,
                url: item.url,
                destPath: item.savePath,
                totalSize: item.totalSize,
                segments: item.segments,
                maxConnections: item.maxConnections,
                headers: item.headers,
                cookies: item.cookies,
                onProgress: (p) => {
                    item.downloadedSize = p.downloadedSize;
                    item.speed = p.speed;
                    item.timeRemaining = p.timeRemaining;
                    item.segments = p.segments;
                    this.resumeManager.updateSegments(id, p.segments, p.downloadedSize);
                    this.emit('progress', { ...item });
                },
                onSegmentUpdate: (segments) => { item.segments = segments; },
            });
            this.managers.set(id, manager);
            await manager.start();
            item.status = 'completed';
            item.completedAt = Date.now();
            item.speed = 0;
            item.timeRemaining = 0;
            this.resumeManager.delete(id);
            this.emit('completed', item);
        }
        catch (err) {
            // Read current status from map - it may have changed to 'paused' during the await
            const latestStatus = this.downloads.get(id)?.status;
            if (latestStatus !== 'paused') {
                item.status = 'error';
                item.errorMessage = err instanceof Error ? err.message : 'Unknown error';
                this.emit('error', { item, error: err });
            }
        }
        finally {
            this.managers.delete(id);
            this.emit('updated', item);
            this.startNextQueued();
        }
    }
    pause(id) {
        const item = this.downloads.get(id);
        if (!item || item.status !== 'downloading')
            return;
        item.status = 'paused';
        item.pausedAt = Date.now();
        this.managers.get(id)?.pause();
        this.emit('updated', item);
        this.startNextQueued();
    }
    resume(id) {
        const item = this.downloads.get(id);
        if (!item || item.status !== 'paused')
            return;
        this.start(id);
    }
    cancel(id) {
        const item = this.downloads.get(id);
        if (!item)
            return;
        this.managers.get(id)?.cancel();
        this.downloads.delete(id);
        this.resumeManager.delete(id);
        this.emit('removed', id);
        this.startNextQueued();
    }
    remove(id, deleteFile = false) {
        const item = this.downloads.get(id);
        if (!item)
            return;
        this.managers.get(id)?.cancel();
        if (deleteFile && fs.existsSync(item.savePath))
            fs.unlinkSync(item.savePath);
        this.downloads.delete(id);
        this.resumeManager.delete(id);
        this.emit('removed', id);
    }
    getAll() {
        return [...this.downloads.values()];
    }
    get(id) {
        return this.downloads.get(id);
    }
    setMaxConcurrent(n) {
        this.maxConcurrent = n;
        this.startNextQueued();
    }
    startNextQueued() {
        const active = [...this.downloads.values()].filter(d => d.status === 'downloading').length;
        if (active >= this.maxConcurrent)
            return;
        const next = [...this.downloads.values()].find(d => d.status === 'queued');
        if (next)
            this.start(next.id);
    }
    extractFilename(url) {
        try {
            const parsed = new URL(url);
            const name = parsed.pathname.split('/').pop();
            return name && name.length > 0 ? decodeURIComponent(name) : `download-${Date.now()}`;
        }
        catch {
            return `download-${Date.now()}`;
        }
    }
    detectCategory(filename) {
        const ext = filename.split('.').pop()?.toLowerCase() ?? '';
        for (const [cat, exts] of Object.entries(shared_1.CATEGORY_EXTENSIONS)) {
            if (exts.includes(ext))
                return cat;
        }
        return 'general';
    }
}
exports.DownloadManager = DownloadManager;
//# sourceMappingURL=downloadManager.js.map