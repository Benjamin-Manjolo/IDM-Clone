import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import type { DownloadItem, AddDownloadOptions, DownloadProgress, DownloadCategory } from '@idm/shared';
import { CATEGORY_EXTENSIONS, DEFAULT_MAX_CONNECTIONS, DEFAULT_CONCURRENT_DOWNLOADS } from '@idm/shared';
import { HttpProtocol } from '../protocols/http';
import { ChunkAllocator } from './chunkAllocator';
import { SegmentManager } from './segmentManager';
import { ResumeManager } from './resumeManager';

export interface DownloadManagerOptions {
  downloadDir: string;
  tempDir?: string;
  maxConcurrent?: number;
  globalSpeedLimit?: number;
}

export class DownloadManager extends EventEmitter {
  private downloads = new Map<string, DownloadItem>();
  private managers = new Map<string, SegmentManager>();
  private resumeManager: ResumeManager;
  private http = new HttpProtocol();
  private maxConcurrent: number;
  private globalSpeedLimit: number;

  constructor(private opts: DownloadManagerOptions) {
    super();
    this.maxConcurrent = opts.maxConcurrent ?? DEFAULT_CONCURRENT_DOWNLOADS;
    this.globalSpeedLimit = opts.globalSpeedLimit ?? 0;
    this.resumeManager = new ResumeManager(opts.tempDir ?? opts.downloadDir);
  }

  async add(options: AddDownloadOptions): Promise<DownloadItem> {
    const id = uuid();
    const filename = options.filename ?? this.extractFilename(options.url);
    const savePath = options.savePath ?? path.join(this.opts.downloadDir, filename);
    const category = options.category ?? this.detectCategory(filename);

    const item: DownloadItem = {
      id,
      url: options.url,
      filename,
      savePath,
      category,
      status: 'queued',
      protocol: ChunkAllocator.detectProtocol(options.url),
      totalSize: -1,
      downloadedSize: 0,
      speed: 0,
      averageSpeed: 0,
      timeRemaining: -1,
      segments: [],
      maxConnections: options.maxConnections ?? DEFAULT_MAX_CONNECTIONS,
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

  async start(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (!item) throw new Error(`Download ${id} not found`);
    if (item.status === 'downloading') return;

    // Check concurrent limit
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
      // Probe URL for size and resumability
      if (item.totalSize < 0) {
        const info = await this.http.probe(item.url, item.headers);
        item.totalSize = info.contentLength;
        item.resumable = info.resumable;
        if (info.filename && item.filename === this.extractFilename(item.url)) {
          item.filename = info.filename;
          item.savePath = path.join(path.dirname(item.savePath), info.filename);
        }
      }

      // Build or restore segments
      const resumeData = this.resumeManager.load(id);
      if (resumeData && item.resumable) {
        item.segments = resumeData.segments;
        item.downloadedSize = resumeData.downloadedSize;
      } else {
        const allocator = new ChunkAllocator({ totalSize: item.totalSize, maxConnections: item.maxConnections });
        item.segments = allocator.createInitialSegments(item.resumable);
      }

      this.resumeManager.save({
        id, url: item.url, filename: item.filename,
        savePath: item.savePath, totalSize: item.totalSize,
        downloadedSize: item.downloadedSize, segments: item.segments,
        headers: item.headers, cookies: item.cookies, createdAt: item.createdAt, updatedAt: Date.now(),
      });

      const manager = new SegmentManager({
        downloadId: id,
        url: item.url,
        destPath: item.savePath,
        totalSize: item.totalSize,
        segments: item.segments,
        maxConnections: item.maxConnections,
        headers: item.headers,
        cookies: item.cookies,
        onProgress: (p: DownloadProgress) => {
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
    } catch (err: unknown) {
      // Re-read item status from map in case it was changed (e.g. paused) during await
      const currentItem = this.downloads.get(id);
      const currentStatus = currentItem?.status as string | undefined;
      if (currentStatus !== 'paused') {
        item.status = 'error';
        item.errorMessage = err instanceof Error ? err.message : 'Unknown error';
        this.emit('error', { item, error: err });
      }
    } finally {
      this.managers.delete(id);
      this.emit('updated', item);
      // Start next queued item
      this.startNextQueued();
    }
  }

  pause(id: string): void {
    const item = this.downloads.get(id);
    if (!item || item.status !== 'downloading') return;
    item.status = 'paused';
    item.pausedAt = Date.now();
    this.managers.get(id)?.pause();
    this.emit('updated', item);
    this.startNextQueued();
  }

  resume(id: string): void {
    const item = this.downloads.get(id);
    if (!item || item.status !== 'paused') return;
    this.start(id);
  }

  cancel(id: string): void {
    const item = this.downloads.get(id);
    if (!item) return;
    this.managers.get(id)?.cancel();
    this.downloads.delete(id);
    this.resumeManager.delete(id);
    this.emit('removed', id);
    this.startNextQueued();
  }

  remove(id: string, deleteFile = false): void {
    const item = this.downloads.get(id);
    if (!item) return;
    this.managers.get(id)?.cancel();
    if (deleteFile && fs.existsSync(item.savePath)) fs.unlinkSync(item.savePath);
    this.downloads.delete(id);
    this.resumeManager.delete(id);
    this.emit('removed', id);
  }

  getAll(): DownloadItem[] {
    return [...this.downloads.values()];
  }

  get(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  setMaxConcurrent(n: number): void {
    this.maxConcurrent = n;
    this.startNextQueued();
  }

  private startNextQueued(): void {
    const active = [...this.downloads.values()].filter(d => d.status === 'downloading').length;
    if (active >= this.maxConcurrent) return;
    const next = [...this.downloads.values()].find(d => d.status === 'queued');
    if (next) this.start(next.id);
  }

  private extractFilename(url: string): string {
    try {
      const parsed = new URL(url);
      const name = parsed.pathname.split('/').pop();
      return name && name.length > 0 ? decodeURIComponent(name) : `download-${Date.now()}`;
    } catch {
      return `download-${Date.now()}`;
    }
  }

  private detectCategory(filename: string): DownloadCategory {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    for (const [cat, exts] of Object.entries(CATEGORY_EXTENSIONS)) {
      if ((exts as string[]).includes(ext)) return cat as DownloadCategory;
    }
    return 'general';
  }
}
