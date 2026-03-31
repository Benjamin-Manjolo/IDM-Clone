"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = void 0;
const shared_1 = require("@idm/shared");
const SPEED_WINDOW_MS = 5000; // rolling 5-second average
const SPEED_SAMPLES = 20;
class ProgressTracker {
    constructor(downloadId, totalSize, onProgress) {
        this.downloadId = downloadId;
        this.totalSize = totalSize;
        this.onProgress = onProgress;
        this.samples = [];
        this.totalDownloaded = 0;
        this.lastEmitted = 0;
        this.startTime = 0;
    }
    start() {
        this.startTime = Date.now();
    }
    addBytes(bytes) {
        this.totalDownloaded += bytes;
        const now = Date.now();
        this.samples.push({ bytes, timestamp: now });
        // Trim old samples outside window
        const cutoff = now - SPEED_WINDOW_MS;
        this.samples = this.samples.filter(s => s.timestamp > cutoff);
        if (this.samples.length > SPEED_SAMPLES) {
            this.samples = this.samples.slice(-SPEED_SAMPLES);
        }
        if (now - this.lastEmitted >= shared_1.PROGRESS_UPDATE_INTERVAL) {
            this.lastEmitted = now;
        }
    }
    getSpeed() {
        if (this.samples.length < 2)
            return 0;
        const window = this.samples[this.samples.length - 1].timestamp - this.samples[0].timestamp;
        if (window === 0)
            return 0;
        const totalBytes = this.samples.reduce((s, x) => s + x.bytes, 0);
        return (totalBytes / window) * 1000; // bytes/sec
    }
    getAverageSpeed() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        if (elapsed === 0)
            return 0;
        return this.totalDownloaded / elapsed;
    }
    getTimeRemaining(speed) {
        if (speed === 0 || this.totalSize <= 0)
            return -1;
        const remaining = this.totalSize - this.totalDownloaded;
        return remaining / speed;
    }
    emit(segments, status) {
        const speed = this.getSpeed();
        this.onProgress({
            id: this.downloadId,
            downloadedSize: this.totalDownloaded,
            speed,
            timeRemaining: this.getTimeRemaining(speed),
            segments,
            status,
        });
    }
    getTotalDownloaded() {
        return this.totalDownloaded;
    }
    reset() {
        this.samples = [];
        this.totalDownloaded = 0;
        this.lastEmitted = 0;
        this.startTime = 0;
    }
}
exports.ProgressTracker = ProgressTracker;
//# sourceMappingURL=progressTracker.js.map