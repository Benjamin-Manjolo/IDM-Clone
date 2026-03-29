import type { DownloadProgress, DownloadSegment, DownloadStatus } from '@idm/shared';
import { PROGRESS_UPDATE_INTERVAL } from '@idm/shared';

interface SpeedSample {
  bytes: number;
  timestamp: number;
}

const SPEED_WINDOW_MS = 5000;   // rolling 5-second average
const SPEED_SAMPLES   = 20;

export class ProgressTracker {
  private samples: SpeedSample[] = [];
  private totalDownloaded = 0;
  private lastEmitted = 0;
  private startTime = 0;

  constructor(
    private readonly downloadId: string,
    private readonly totalSize: number,
    private readonly onProgress: (p: DownloadProgress) => void
  ) {}

  start(): void {
    this.startTime = Date.now();
  }

  addBytes(bytes: number): void {
    this.totalDownloaded += bytes;
    const now = Date.now();
    this.samples.push({ bytes, timestamp: now });

    // Trim old samples outside window
    const cutoff = now - SPEED_WINDOW_MS;
    this.samples = this.samples.filter(s => s.timestamp > cutoff);
    if (this.samples.length > SPEED_SAMPLES) {
      this.samples = this.samples.slice(-SPEED_SAMPLES);
    }

    if (now - this.lastEmitted >= PROGRESS_UPDATE_INTERVAL) {
      this.lastEmitted = now;
    }
  }

  getSpeed(): number {
    if (this.samples.length < 2) return 0;
    const window = this.samples[this.samples.length - 1]!.timestamp - this.samples[0]!.timestamp;
    if (window === 0) return 0;
    const totalBytes = this.samples.reduce((s, x) => s + x.bytes, 0);
    return (totalBytes / window) * 1000; // bytes/sec
  }

  getAverageSpeed(): number {
    const elapsed = (Date.now() - this.startTime) / 1000;
    if (elapsed === 0) return 0;
    return this.totalDownloaded / elapsed;
  }

  getTimeRemaining(speed: number): number {
    if (speed === 0 || this.totalSize <= 0) return -1;
    const remaining = this.totalSize - this.totalDownloaded;
    return remaining / speed;
  }

  emit(segments: DownloadSegment[], status: DownloadStatus): void {
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

  getTotalDownloaded(): number {
    return this.totalDownloaded;
  }

  reset(): void {
    this.samples = [];
    this.totalDownloaded = 0;
    this.lastEmitted = 0;
    this.startTime = 0;
  }
}
