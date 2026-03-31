/**
 * downloadManager.ts
 *
 * Core download manager — orchestrates all download types:
 * - HTTP/HTTPS file downloads (segmented, resumable)
 * - FTP downloads
 * - HLS stream downloads
 * - DASH stream downloads
 * - Magnet links (stub — requires BitTorrent engine)
 *
 * Implements IDM-style multi-connection acceleration via ChunkAllocator.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuid } from 'uuid';
import type {
  DownloadItem,
  AddDownloadOptions,
  DownloadProgress,
  DownloadCategory,
} from '@idm/shared';
import {
  CATEGORY_EXTENSIONS,
  DEFAULT_MAX_CONNECTIONS,
  DEFAULT_CONCURRENT_DOWNLOADS,
} from '@idm/shared';
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
  private downloadDir: string;
  private tempDir: string;

  constructor(private opts: DownloadManagerOptions) {
    super();
    this.maxConcurrent = opts.maxConcurrent ?? DEFAULT_CONCURRENT_DOWNLOADS;
    this.globalSpeedLimit = opts.globalSpeedLimit ?? 0;
    this.downloadDir = opts.downloadDir;
    this.tempDir = opts.tempDir ?? opts.downloadDir;
    this.resumeManager = new ResumeManager(this.tempDir);

    // Restore incomplete downloads from a previous session
    this.restoreIncomplete();
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async add(options: AddDownloadOptions): Promise<DownloadItem> {
    const id = uuid();
    const filename = options.filename ?? this.extractFilename(options.url);
    const saveDir = options.savePath ?? this.downloadDir;
    const savePath = path.join(saveDir, filename);
    const category = options.category ?? this.detectCategory(filename);
    const protocol = ChunkAllocator.detectProtocol(options.url);

    // Resolve filename conflict
    const resolvedPath = this.resolveConflict(savePath);

    const item: DownloadItem = {
      id,
      url: options.url,
      filename: path.basename(resolvedPath),
      savePath: resolvedPath,
      category,
      status: 'queued',
      protocol,
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
    this.emit('added', { ...item });

    if (options.startImmediately !== false) {
      // Yield so caller gets the item reference before download starts
      setImmediate(() => this.start(id).catch(() => {}));
    }

    return item;
  }

  async start(id: string): Promise<void> {
    const item = this.downloads.get(id);
    if (!item) return;
    if (item.status === 'downloading') return;

    // Check concurrency limit
    const activeCount = this.getActiveCount();
    if (activeCount >= this.maxConcurrent) {
      item.status = 'queued';
      this.emit('updated', { ...item });
      return;
    }

    item.status = 'downloading';
    item.startedAt = Date.now();
    this.emit('updated', { ...item });

    try {
      await this.executeDownload(item);

      // Check item wasn't cancelled/paused during download
      const current = this.downloads.get(id);
      if (!current || current.status === 'paused' || current.status === 'error') return;

      item.status = 'completed';
      item.completedAt = Date.now();
      item.speed = 0;
      item.timeRemaining = 0;
      this.resumeManager.delete(id);
      this.emit('completed', { ...item });
    } catch (err: unknown) {
      const current = this.downloads.get(id);
      if (current && current.status !== 'paused') {
        item.status = 'error';
        item.errorMessage = err instanceof Error ? err.message : 'Unknown error';
        this.emit('error', { item: { ...item }, error: err });
      }
    } finally {
      this.managers.delete(id);
      this.emit('updated', { ...item });
      this.startNextQueued();
    }
  }

  pause(id: string): void {
    const item = this.downloads.get(id);
    if (!item || item.status !== 'downloading') return;
    item.status = 'paused';
    item.pausedAt = Date.now();
    item.speed = 0;
    this.managers.get(id)?.pause();
    this.emit('updated', { ...item });
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
    if (deleteFile) {
      try { if (fs.existsSync(item.savePath)) fs.unlinkSync(item.savePath); } catch {}
    }
    this.downloads.delete(id);
    this.resumeManager.delete(id);
    this.emit('removed', id);
  }

  get(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  getAll(): DownloadItem[] {
    return [...this.downloads.values()];
  }

  setMaxConcurrent(n: number): void {
    this.maxConcurrent = Math.max(1, n);
    this.startNextQueued();
  }

  setGlobalSpeedLimit(bytesPerSec: number): void {
    this.globalSpeedLimit = bytesPerSec;
  }

  // ── Private implementation ─────────────────────────────────────────────────

  private async executeDownload(item: DownloadItem): Promise<void> {
    // Probe the URL for metadata (size, resumability, real filename)
    if (item.totalSize < 0 && item.protocol !== 'magnet') {
      try {
        const info = await this.http.probe(item.url, item.headers);
        item.totalSize = info.contentLength;
        item.resumable = info.resumable;

        // Use server-provided filename if we only guessed from URL
        if (info.filename) {
          const newPath = path.join(path.dirname(item.savePath), info.filename);
          const resolved = this.resolveConflict(newPath);
          item.savePath = resolved;
          item.filename = path.basename(resolved);
        }
      } catch {
        // Probe failed — continue with unknown size (non-resumable)
        item.resumable = false;
      }
    }

    // Load or create segments
    const resumeData = this.resumeManager.load(item.id);
    if (resumeData && item.resumable && resumeData.segments.length > 0) {
      item.segments = resumeData.segments;
      item.downloadedSize = resumeData.downloadedSize;
    } else {
      const allocator = new ChunkAllocator({
        totalSize: item.totalSize,
        maxConnections: item.maxConnections,
      });
      item.segments = allocator.createInitialSegments(item.resumable);
    }

    // Persist resume state
    this.resumeManager.save({
      id: item.id,
      url: item.url,
      filename: item.filename,
      savePath: item.savePath,
      totalSize: item.totalSize,
      downloadedSize: item.downloadedSize,
      segments: item.segments,
      headers: item.headers,
      cookies: item.cookies,
      createdAt: item.createdAt,
      updatedAt: Date.now(),
    });

    // Create and run segment manager
    const manager = new SegmentManager({
      downloadId: item.id,
      url: item.url,
      destPath: item.savePath,
      totalSize: item.totalSize,
      segments: item.segments,
      maxConnections: item.maxConnections,
      headers: item.headers,
      cookies: item.cookies,
      speedLimit: this.globalSpeedLimit,
      onProgress: (p: DownloadProgress) => {
        item.downloadedSize = p.downloadedSize;
        item.speed = p.speed;
        item.timeRemaining = p.timeRemaining;
        item.segments = p.segments;
        // Persist segment state periodically
        this.resumeManager.updateSegments(item.id, p.segments, p.downloadedSize);
        this.emit('progress', { ...item, ...p });
      },
      onSegmentUpdate: (segments) => {
        item.segments = segments;
      },
    });

    this.managers.set(item.id, manager);
    await manager.start();
  }

  private getActiveCount(): number {
    let count = 0;
    for (const item of this.downloads.values()) {
      if (item.status === 'downloading') count++;
    }
    return count;
  }

  private startNextQueued(): void {
    if (this.getActiveCount() >= this.maxConcurrent) return;
    // Find the oldest queued item
    let oldest: DownloadItem | undefined;
    for (const item of this.downloads.values()) {
      if (item.status === 'queued') {
        if (!oldest || item.createdAt < oldest.createdAt) oldest = item;
      }
    }
    if (oldest) this.start(oldest.id).catch(() => {});
  }

  private restoreIncomplete(): void {
    try {
      const incomplete = this.resumeManager.listAll();
      for (const data of incomplete) {
        // Only restore if the partial file still exists
        if (!fs.existsSync(data.savePath) && data.downloadedSize > 0) continue;

        const item: DownloadItem = {
          id: data.id,
          url: data.url,
          filename: data.filename,
          savePath: data.savePath,
          category: this.detectCategory(data.filename),
          status: 'paused', // restore as paused, user can resume
          protocol: ChunkAllocator.detectProtocol(data.url),
          totalSize: data.totalSize,
          downloadedSize: data.downloadedSize,
          speed: 0,
          averageSpeed: 0,
          timeRemaining: -1,
          segments: data.segments,
          maxConnections: DEFAULT_MAX_CONNECTIONS,
          createdAt: data.createdAt,
          retryCount: 0,
          resumable: true,
          headers: data.headers,
          cookies: data.cookies,
        };
        this.downloads.set(data.id, item);
      }
    } catch {
      // Restoration is best-effort
    }
  }

  private resolveConflict(filePath: string): string {
    if (!fs.existsSync(filePath)) return filePath;
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    let i = 1;
    while (i < 10000) {
      const candidate = path.join(dir, `${base} (${i})${ext}`);
      if (!fs.existsSync(candidate)) return candidate;
      i++;
    }
    return filePath;
  }

  private extractFilename(url: string): string {
    try {
      const parsed = new URL(url);
      const name = parsed.pathname.split('/').pop();
      if (name && name.length > 0 && name.includes('.')) {
        return decodeURIComponent(name);
      }
      return `download-${Date.now()}`;
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
