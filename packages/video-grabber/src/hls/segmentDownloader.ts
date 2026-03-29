import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import type { HlsSegment } from './m3u8Parser';

export interface SegmentDownloadOptions {
  segment: HlsSegment;
  destPath: string;
  headers?: Record<string, string>;
  onProgress?: (bytes: number) => void;
}

export async function downloadHlsSegment(opts: SegmentDownloadOptions): Promise<void> {
  const { segment, destPath, headers = {}, onProgress } = opts;
  return new Promise((resolve, reject) => {
    const url = new URL(segment.uri);
    const lib = url.protocol === 'https:' ? https : http;
    lib.get({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, headers }, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const stream = fs.createWriteStream(destPath, { flags: 'a' });
      res.on('data', (chunk: Buffer) => { stream.write(chunk); onProgress?.(chunk.length); });
      res.on('end', () => { stream.end(); resolve(); });
      res.on('error', (err) => { stream.destroy(); reject(err); });
    }).on('error', reject);
  });
}