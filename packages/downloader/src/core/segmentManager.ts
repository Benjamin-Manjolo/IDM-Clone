/**
 * segmentManager.ts
 *
 * Manages multi-connection segmented downloads (the core of IDM's speed acceleration).
 *
 * Strategy mirrors IDM:
 * 1. Split file into N initial chunks based on maxConnections
 * 2. Download each chunk in parallel
 * 3. When a connection finishes its chunk early, split the largest remaining chunk
 *    (dynamic re-segmentation — this is IDM's key secret for speed)
 * 4. Progress reported via callback on each chunk write
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import type { DownloadSegment, DownloadProgress } from '@idm/shared';
import { HttpProtocol } from '../protocols/http';
import { ChunkAllocator } from './chunkAllocator';
import { ProgressTracker } from './progressTracker';
import { SpeedLimiter } from '../utils/speedLimiter';

export interface SegmentManagerOptions {
  downloadId: string;
  url: string;
  destPath: string;
  totalSize: number;
  segments: DownloadSegment[];
  maxConnections: number;
  headers?: Record<string, string>;
  cookies?: string;
  speedLimit?: number;      // bytes/sec, 0 = unlimited
  onProgress: (p: DownloadProgress) => void;
  onSegmentUpdate: (segments: DownloadSegment[]) => void;
}

export class SegmentManager extends EventEmitter {
  private segments: DownloadSegment[];
  private activeCount = 0;
  private paused = false;
  private cancelled = false;
  private http = new HttpProtocol();
  private tracker: ProgressTracker;
  private allocator: ChunkAllocator;
  private limiter: SpeedLimiter;
  private nextSegmentId: number;
  private resolveAll?: () => void;
  private rejectAll?: (e: Error) => void;

  constructor(private opts: SegmentManagerOptions) {
    super();
    this.segments = opts.segments.map(s => ({ ...s }));
    this.nextSegmentId =
      this.segments.length > 0
        ? Math.max(...this.segments.map(s => s.id)) + 1
        : 0;
    this.tracker = new ProgressTracker(
      opts.downloadId,
      opts.totalSize,
      opts.onProgress
    );
    this.allocator = new ChunkAllocator({
      totalSize: opts.totalSize,
      maxConnections: opts.maxConnections,
    });
    this.limiter = new SpeedLimiter(opts.speedLimit ?? 0);
  }

  async start(): Promise<void> {
    // Pre-allocate destination file to avoid fragmentation
    if (this.opts.totalSize > 0 && !fs.existsSync(this.opts.destPath)) {
      try {
        const fd = fs.openSync(this.opts.destPath, 'w');
        fs.ftruncateSync(fd, this.opts.totalSize);
        fs.closeSync(fd);
      } catch {
        // Allocation failed (disk full?) — let segment writes create the file
      }
    }

    this.tracker.start();

    return new Promise<void>((resolve, reject) => {
      this.resolveAll = resolve;
      this.rejectAll = reject;
      this.pump();
    });
  }

  pause(): void {
    this.paused = true;
    this.http.cancelAll();
    // Mark all downloading segments back to pending so they can resume
    for (const s of this.segments) {
      if (s.status === 'downloading') s.status = 'pending';
    }
    this.opts.onSegmentUpdate([...this.segments]);
  }

  resume(): void {
    this.paused = false;
    this.pump();
  }

  cancel(): void {
    this.cancelled = true;
    this.http.cancelAll();
    this.rejectAll?.(new Error('Download cancelled'));
  }

  getSegments(): DownloadSegment[] {
    return this.segments.map(s => ({ ...s }));
  }

  updateSpeedLimit(bytesPerSec: number): void {
    this.limiter.setLimit(bytesPerSec);
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private pump(): void {
    if (this.paused || this.cancelled) return;

    // All segments finished?
    const allDone = this.segments.every(
      s => s.status === 'completed' || s.status === 'error'
    );

    if (allDone && this.activeCount === 0) {
      const hasError = this.segments.some(s => s.status === 'error');
      if (hasError) {
        this.rejectAll?.(new Error('One or more segments failed to download'));
      } else {
        this.resolveAll?.();
      }
      return;
    }

    // Launch pending segments up to maxConnections limit
    while (this.activeCount < this.opts.maxConnections) {
      const pending = this.segments.find(s => s.status === 'pending');
      if (!pending) {
        // All segments are either active, done, or errored.
        // If there's still an active download, try dynamic split.
        if (this.activeCount > 0) {
          const newSeg = this.allocator.splitLargestSegment(
            this.segments,
            this.nextSegmentId
          );
          if (newSeg) {
            this.nextSegmentId++;
            this.segments.push(newSeg);
            this.opts.onSegmentUpdate([...this.segments]);
            continue; // try to start this new segment
          }
        }
        break;
      }
      this.downloadSegment(pending);
    }
  }

  private async downloadSegment(segment: DownloadSegment): Promise<void> {
    segment.status = 'downloading';
    this.activeCount++;

    try {
      await this.http.downloadSegment({
        url: this.opts.url,
        destPath: this.opts.destPath,
        segment,
        headers: this.opts.headers,
        cookies: this.opts.cookies,
        onProgress: async (bytes: number) => {
          // Apply global speed limit if configured
          if (!this.limiter.isUnlimited()) {
            const waitMs = this.limiter.consume(bytes);
            if (waitMs > 0) {
              await sleep(waitMs);
            }
          }
          segment.downloaded += bytes;
          this.tracker.addBytes(bytes);
          this.tracker.emit(this.segments, 'downloading');
          this.opts.onSegmentUpdate([...this.segments]);
        },
      });

      segment.status = 'completed';
    } catch (err) {
      if (this.cancelled) return;
      segment.status = 'error';
      this.emit('segment-error', { segment, error: err });
    } finally {
      this.activeCount--;
      if (!this.cancelled && !this.paused) {
        this.pump();
      }
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
