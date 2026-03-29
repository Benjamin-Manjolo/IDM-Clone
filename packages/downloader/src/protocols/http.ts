import { EventEmitter } from 'events';
import * as http from 'http';
import * as https from 'https';
import * as fs from 'fs';
import type { DownloadItem, DownloadSegment } from '@idm/shared';

export interface HttpDownloadOptions {
  url: string;
  destPath: string;
  segment: DownloadSegment;
  headers?: Record<string, string>;
  cookies?: string;
  timeout?: number;
  onProgress?: (bytes: number) => void;
}

export class HttpProtocol extends EventEmitter {
  private activeRequests = new Map<number, http.ClientRequest>();

  async probe(url: string, headers?: Record<string, string>): Promise<{
    contentLength: number;
    resumable: boolean;
    filename?: string;
    mimeType?: string;
  }> {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const lib = parsedUrl.protocol === 'https:' ? https : http;

      const req = lib.request(
        { method: 'HEAD', hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname + parsedUrl.search, headers: { ...headers, 'Range': 'bytes=0-0' } },
        (res) => {
          const contentLength = parseInt(res.headers['content-length'] ?? '-1', 10);
          const resumable = res.headers['accept-ranges'] === 'bytes' || res.statusCode === 206;
          const disposition = res.headers['content-disposition'] ?? '';
          const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
          const filename = filenameMatch ? filenameMatch[1]?.replace(/['"]/g, '') : undefined;
          const mimeType = res.headers['content-type']?.split(';')[0];
          resolve({ contentLength, resumable, filename, mimeType });
          req.destroy();
        }
      );
      req.on('error', reject);
      req.setTimeout(10000, () => { req.destroy(); reject(new Error('HEAD request timed out')); });
      req.end();
    });
  }

  async downloadSegment(options: HttpDownloadOptions): Promise<void> {
    const { url, destPath, segment, headers = {}, cookies, timeout = 30000, onProgress } = options;
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const lib = parsedUrl.protocol === 'https:' ? https : http;

      const reqHeaders: Record<string, string> = {
        ...headers,
        'Range': `bytes=${segment.start + segment.downloaded}-${segment.end}`,
        'User-Agent': 'IDM-Clone/1.0',
      };
      if (cookies) reqHeaders['Cookie'] = cookies;

      const req = lib.get(
        { hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname + parsedUrl.search, headers: reqHeaders },
        (res) => {
          if (res.statusCode !== 206 && res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            return;
          }

          const offset = segment.start + segment.downloaded;
          const fd = fs.openSync(destPath, 'r+');
          let position = offset;

          res.on('data', (chunk: Buffer) => {
            fs.writeSync(fd, chunk, 0, chunk.length, position);
            position += chunk.length;
            onProgress?.(chunk.length);
          });

          res.on('end', () => {
            fs.closeSync(fd);
            resolve();
          });

          res.on('error', (err) => {
            fs.closeSync(fd);
            reject(err);
          });
        }
      );

      req.on('error', reject);
      req.setTimeout(timeout, () => {
        req.destroy();
        reject(new Error('Connection timed out'));
      });

      this.activeRequests.set(segment.id, req);
    });
  }

  cancelSegment(segmentId: number): void {
    const req = this.activeRequests.get(segmentId);
    if (req) {
      req.destroy();
      this.activeRequests.delete(segmentId);
    }
  }

  cancelAll(): void {
    this.activeRequests.forEach(req => req.destroy());
    this.activeRequests.clear();
  }
}