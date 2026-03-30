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
exports.SegmentManager = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const http_1 = require("../protocols/http");
const chunkAllocator_1 = require("./chunkAllocator");
const progressTracker_1 = require("./progressTracker");
class SegmentManager extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.opts = opts;
        this.activeCount = 0;
        this.paused = false;
        this.cancelled = false;
        this.http = new http_1.HttpProtocol();
        this.segments = opts.segments.map(s => ({ ...s }));
        this.nextSegmentId = Math.max(...this.segments.map(s => s.id)) + 1;
        this.tracker = new progressTracker_1.ProgressTracker(opts.downloadId, opts.totalSize, opts.onProgress);
        this.allocator = new chunkAllocator_1.ChunkAllocator({
            totalSize: opts.totalSize,
            maxConnections: opts.maxConnections,
        });
    }
    async start() {
        // Pre-allocate file
        if (!fs.existsSync(this.opts.destPath) && this.opts.totalSize > 0) {
            const fd = fs.openSync(this.opts.destPath, 'w');
            fs.ftruncateSync(fd, this.opts.totalSize);
            fs.closeSync(fd);
        }
        this.tracker.start();
        return new Promise((resolve, reject) => {
            this.resolveAll = resolve;
            this.rejectAll = reject;
            this.pump();
        });
    }
    pump() {
        if (this.paused || this.cancelled)
            return;
        // Check if all done
        const allDone = this.segments.every(s => s.status === 'completed' || s.status === 'error');
        if (allDone && this.activeCount === 0) {
            const hasError = this.segments.some(s => s.status === 'error');
            if (hasError)
                this.rejectAll?.(new Error('One or more segments failed'));
            else
                this.resolveAll?.();
            return;
        }
        // Launch pending segments up to maxConnections
        while (this.activeCount < this.opts.maxConnections) {
            const pending = this.segments.find(s => s.status === 'pending');
            if (!pending) {
                // Try dynamic split
                if (this.activeCount > 0) {
                    const newSeg = this.allocator.splitLargestSegment(this.segments, this.nextSegmentId);
                    if (newSeg) {
                        this.nextSegmentId++;
                        this.segments.push(newSeg);
                        this.opts.onSegmentUpdate([...this.segments]);
                        continue;
                    }
                }
                break;
            }
            this.downloadSegment(pending);
        }
    }
    async downloadSegment(segment) {
        segment.status = 'downloading';
        this.activeCount++;
        try {
            await this.http.downloadSegment({
                url: this.opts.url,
                destPath: this.opts.destPath,
                segment,
                headers: this.opts.headers,
                cookies: this.opts.cookies,
                onProgress: (bytes) => {
                    segment.downloaded += bytes;
                    this.tracker.addBytes(bytes);
                    this.tracker.emit(this.segments, 'downloading');
                    this.opts.onSegmentUpdate([...this.segments]);
                },
            });
            segment.status = 'completed';
        }
        catch (err) {
            if (this.cancelled)
                return;
            segment.status = 'error';
            this.emit('segment-error', { segment, error: err });
        }
        finally {
            this.activeCount--;
            if (!this.cancelled)
                this.pump();
        }
    }
    pause() {
        this.paused = true;
        this.http.cancelAll();
        // Reset downloading segments back to pending so they resume correctly
        this.segments
            .filter(s => s.status === 'downloading')
            .forEach(s => { s.status = 'pending'; });
    }
    resume() {
        this.paused = false;
        this.pump();
    }
    cancel() {
        this.cancelled = true;
        this.http.cancelAll();
        this.rejectAll?.(new Error('Download cancelled'));
    }
    getSegments() {
        return [...this.segments];
    }
}
exports.SegmentManager = SegmentManager;
