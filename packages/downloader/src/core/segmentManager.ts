import { EventEmitter } from 'events';
import * as fs from 'fs';
import type { DownloadSegment } from '@idm/shared';
import { HttpProtocol } from '../protocols/http';
import { ChunkAllocator } from './chunkAllocator';
import { ProgressTracker } from './progressTracker';
import type { DownloadProgress } from '@idm/shared';

export interface SegmentManagerOptions {
  downloadId: string;
  url: string;
  destPath: string;
  totalSize: number;
  segments: DownloadSegment[];
  maxConnections: number;
  headers?: Record<string, string>;
  cookies?: string;
  speedLimit?: number;   // bytes/sec, 0 = unlimited
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
  private nextSegmentId: number;
  private resolveAll?: () => void;
  private rejectAll?: (e: Error) => void;

  constructor(private opts: SegmentManagerOptions) {
    super();
    this.segments = opts.segments.map(s => ({ ...s }));
    this.nextSegmentId = Math.max(...this.segments.map(s => s.id)) + 1;
    this.tracker = new ProgressTracker(opts.downloadId, opts.totalSize, opts.onProgress);
    this.allocator = new ChunkAllocator({
      totalSize: opts.totalSize,
      maxConnections: opts.maxConnections,
    });
  }

  async start(): Promise<void> {
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

  private pump(): void {
    if (this.paused || this.cancelled) return;

    // Check if all done
    const allDone = this.segments.every(
      s => s.status === 'completed' || s.status === 'error'
    );
    if (allDone && this.activeCount === 0) {
      const hasError = this.segments.some(s => s.status === 'error');
      if (hasError) this.rejectAll?.(new Error('One or more segments failed'));
      else this.resolveAll?.();
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
        onProgress: (bytes) => {
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
      if (!this.cancelled) this.pump();
    }
  }

  pause(): void {
    this.paused = true;
    this.http.cancelAll();
    // Reset downloading segments back to pending so they resume correctly
    this.segments
      .filter(s => s.status === 'downloading')
      .forEach(s => { s.status = 'pending'; });
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
    return [...this.segments];
  }
}
