import * as fs from 'fs';
import * as path from 'path';
import { MERGE_BUFFER_SIZE } from '@idm/shared';

export interface MergeOptions {
  segmentPaths: string[];
  outputPath: string;
  onProgress?: (merged: number, total: number) => void;
  deleteSegments?: boolean;
}

export async function mergeHlsSegments(opts: MergeOptions): Promise<void> {
  const { segmentPaths, outputPath, onProgress, deleteSegments = true } = opts;

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  const out = fs.createWriteStream(outputPath);

  let merged = 0;
  const total = segmentPaths.length;

  for (const segPath of segmentPaths) {
    await new Promise<void>((resolve, reject) => {
      const inp = fs.createReadStream(segPath, { highWaterMark: MERGE_BUFFER_SIZE });
      inp.on('data', (chunk) => out.write(chunk));
      inp.on('end', () => {
        merged++;
        onProgress?.(merged, total);
        resolve();
      });
      inp.on('error', reject);
    });

    if (deleteSegments) {
      try { fs.unlinkSync(segPath); } catch {}
    }
  }

  await new Promise<void>((resolve, reject) => {
    out.end();
    out.on('finish', resolve);
    out.on('error', reject);
  });
}

export function getTempSegmentPath(baseDir: string, downloadId: string, seq: number): string {
  const dir = path.join(baseDir, '.hls-segments', downloadId);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `seg-${String(seq).padStart(6, '0')}.ts`);
}