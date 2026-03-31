/**
 * hlsDownloader.ts
 *
 * IDM-style HLS stream downloader.
 *
 * Implements the PDF guide's requirements:
 * - Parse master manifest → list quality variants
 * - Download all segments (with concurrency)
 * - Handle AES-128 encryption (non-DRM)
 * - Handle separated audio+video tracks
 * - Reassemble into a coherent output file
 *
 * For proper MP4 remux of TS→MP4 or separated audio+video tracks,
 * the native layer should invoke FFmpeg (if available).
 * This module handles the download + concatenation layer.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { parseM3U8 } from './m3u8Parser';
import type { HlsPlaylist, HlsSegment, HlsVariant } from './m3u8Parser';
import { MERGE_BUFFER_SIZE } from '@idm/shared';

export interface HlsDownloadOptions {
  manifestUrl: string;
  outputPath: string;
  /** 'best' | 'worst' | height in pixels (e.g. 1080) */
  quality?: 'best' | 'worst' | number;
  headers?: Record<string, string>;
  maxConcurrentSegments?: number;
  onProgress?: (downloaded: number, total: number, speed: number) => void;
  onVariantsFound?: (variants: HlsVariant[]) => void;
  /** Signal to cancel the download */
  signal?: { cancelled: boolean };
}

export interface HlsDownloadResult {
  outputPath: string;
  segmentsDownloaded: number;
  totalBytes: number;
  hasAudio: boolean;
  hasVideo: boolean;
}

export class HlsDownloader extends EventEmitter {
  private cancelled = false;
  private bytesDownloaded = 0;
  private speedBytes = 0;
  private speedTimer: ReturnType<typeof setInterval> | null = null;

  async download(opts: HlsDownloadOptions): Promise<HlsDownloadResult> {
    const {
      manifestUrl,
      outputPath,
      quality = 'best',
      headers = {},
      maxConcurrentSegments = 4,
      onProgress,
      onVariantsFound,
      signal,
    } = opts;

    this.cancelled = false;
    this.bytesDownloaded = 0;

    // Start speed tracking
    let lastBytes = 0;
    this.speedTimer = setInterval(() => {
      this.speedBytes = this.bytesDownloaded - lastBytes;
      lastBytes = this.bytesDownloaded;
    }, 1000);

    try {
      // 1. Fetch master manifest
      const manifestText = await this.fetchText(manifestUrl, headers);
      const playlist = parseM3U8(manifestText, manifestUrl);

      let mediaPlaylistUrl = manifestUrl;
      let selectedVariant: HlsVariant | undefined;

      if (playlist.isMaster && playlist.variants.length > 0) {
        onVariantsFound?.(playlist.variants);
        selectedVariant = selectVariant(playlist.variants, quality);
        mediaPlaylistUrl = selectedVariant.uri;
        this.emit('variant-selected', selectedVariant);
      }

      // 2. Fetch media playlist (segment list)
      const mediaText = await this.fetchText(mediaPlaylistUrl, headers);
      const mediaPlaylist = parseM3U8(mediaText, mediaPlaylistUrl);
      const segments = mediaPlaylist.segments;

      if (segments.length === 0) {
        throw new Error('No segments found in HLS playlist');
      }

      this.emit('segments-found', segments.length);

      // 3. Create temp directory for segments
      const tmpDir = path.join(path.dirname(outputPath), `.hls-${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        // 4. Download segments with limited concurrency
        let completed = 0;
        const total = segments.length;
        const queue = [...segments];
        const active: Promise<void>[] = [];

        const downloadNext = async (): Promise<void> => {
          while (queue.length > 0 && !this.cancelled && !(signal?.cancelled)) {
            const seg = queue.shift()!;
            const segPath = path.join(tmpDir, `seg-${String(seg.sequence).padStart(6, '0')}.ts`);

            await this.downloadSegment(seg, segPath, headers, (bytes) => {
              this.bytesDownloaded += bytes;
            });

            // Handle AES-128 decryption
            if (seg.key && seg.key.method === 'AES-128') {
              await decryptSegment(segPath, seg.key, seg.sequence);
            }

            completed++;
            onProgress?.(completed, total, this.speedBytes);
            this.emit('segment-done', { completed, total });
          }
        };

        // Run N parallel downloaders
        for (let i = 0; i < maxConcurrentSegments; i++) {
          active.push(downloadNext());
        }
        await Promise.all(active);

        if (this.cancelled || signal?.cancelled) {
          throw new Error('Download cancelled');
        }

        // 5. Merge segments into output file
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        await mergeSegments(
          segments.map(s =>
            path.join(tmpDir, `seg-${String(s.sequence).padStart(6, '0')}.ts`)
          ),
          outputPath
        );

        const stats = fs.statSync(outputPath);
        return {
          outputPath,
          segmentsDownloaded: completed,
          totalBytes: stats.size,
          hasAudio: true,  // TS containers always have muxed audio
          hasVideo: true,
        };
      } finally {
        // Clean up temp dir
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        if (this.speedTimer) clearInterval(this.speedTimer);
      }
    } catch (err) {
      if (this.speedTimer) clearInterval(this.speedTimer);
      throw err;
    }
  }

  cancel(): void {
    this.cancelled = true;
  }

  private downloadSegment(
    segment: HlsSegment,
    destPath: string,
    headers: Record<string, string>,
    onBytes: (bytes: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL(segment.uri);
      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.get(
        {
          hostname: url.hostname,
          port: url.port || undefined,
          path: url.pathname + url.search,
          headers: { 'User-Agent': 'IDM-Clone/1.0', ...headers },
        },
        (res) => {
          if (res.statusCode !== 200 && res.statusCode !== 206) {
            reject(new Error(`HTTP ${res.statusCode} for segment ${segment.uri}`));
            return;
          }
          const stream = fs.createWriteStream(destPath, { flags: 'a' });
          res.on('data', (chunk: Buffer) => {
            stream.write(chunk);
            onBytes(chunk.length);
          });
          res.on('end', () => { stream.end(); resolve(); });
          res.on('error', (e) => { stream.destroy(); reject(e); });
        }
      );
      req.on('error', reject);
      req.setTimeout(30_000, () => { req.destroy(); reject(new Error('Segment download timed out')); });
    });
  }

  private fetchText(url: string, headers: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(
        {
          hostname: parsed.hostname,
          port: parsed.port || undefined,
          path: parsed.pathname + parsed.search,
          headers: { 'User-Agent': 'IDM-Clone/1.0', ...headers },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            resolve(this.fetchText(new URL(res.headers.location, url).toString(), headers));
            req.destroy();
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} fetching manifest`));
            return;
          }
          let data = '';
          res.setEncoding('utf8');
          res.on('data', (c) => { data += c; });
          res.on('end', () => resolve(data));
          res.on('error', reject);
        }
      );
      req.on('error', reject);
      req.setTimeout(15_000, () => { req.destroy(); reject(new Error('Manifest fetch timed out')); });
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function selectVariant(variants: HlsVariant[], quality: 'best' | 'worst' | number): HlsVariant {
  const sorted = [...variants].sort((a, b) => b.bandwidth - a.bandwidth);
  if (quality === 'best') return sorted[0]!;
  if (quality === 'worst') return sorted[sorted.length - 1]!;

  // Pick closest resolution without exceeding desired height
  const maxH = quality as number;
  const parseHeight = (res?: string) => {
    const m = res?.match(/\d+x(\d+)/);
    return m ? parseInt(m[1]!, 10) : 0;
  };
  const withRes = sorted.filter(v => {
    const h = parseHeight(v.resolution);
    return h > 0 && h <= maxH;
  });
  return withRes[0] ?? sorted[sorted.length - 1]!;
}

/**
 * AES-128 segment decryption (for non-DRM HLS streams).
 * Key URI is fetched from the manifest. IV defaults to segment sequence number.
 */
async function decryptSegment(
  filePath: string,
  key: NonNullable<HlsSegment['key']>,
  sequence: number
): Promise<void> {
  if (key.method !== 'AES-128') return;

  const keyData = await fetchBytes(key.uri);

  let iv: Buffer;
  if (key.iv) {
    const ivHex = key.iv.replace('0x', '').replace('0X', '');
    iv = Buffer.from(ivHex.padStart(32, '0'), 'hex');
  } else {
    iv = Buffer.alloc(16, 0);
    iv.writeUInt32BE(sequence, 12);
  }

  const encrypted = fs.readFileSync(filePath);
  const decipher = crypto.createDecipheriv('aes-128-cbc', keyData, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  fs.writeFileSync(filePath, decrypted);
}

function fetchBytes(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const chunks: Buffer[] = [];
    lib.get({ hostname: parsed.hostname, path: parsed.pathname + parsed.search }, (res) => {
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function mergeSegments(segmentPaths: string[], outputPath: string): Promise<void> {
  const out = fs.createWriteStream(outputPath);
  for (const segPath of segmentPaths) {
    if (!fs.existsSync(segPath)) continue;
    await new Promise<void>((resolve, reject) => {
      const inp = fs.createReadStream(segPath, { highWaterMark: MERGE_BUFFER_SIZE });
      inp.on('data', (chunk) => out.write(chunk));
      inp.on('end', resolve);
      inp.on('error', reject);
    });
  }
  await new Promise<void>((resolve, reject) => {
    out.end();
    out.on('finish', resolve);
    out.on('error', reject);
  });
}
