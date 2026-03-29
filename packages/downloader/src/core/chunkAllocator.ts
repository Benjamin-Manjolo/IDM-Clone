import type { DownloadSegment } from '@idm/shared';

export interface AllocatorOptions {
  totalSize: number;
  maxConnections: number;
  minChunkSize?: number;   // default 256 KB
  maxChunkSize?: number;   // default 32 MB
}

/**
 * IDM-style dynamic chunk allocator.
 * When a new connection becomes available, it finds the largest in-progress segment
 * and splits it in half — exactly how IDM achieves its speed advantage.
 */
export class ChunkAllocator {
  private readonly minChunk: number;
  private readonly maxChunk: number;

  constructor(private opts: AllocatorOptions) {
    this.minChunk = opts.minChunkSize ?? 256 * 1024;
    this.maxChunk = opts.maxChunkSize ?? 32 * 1024 * 1024;
  }

  /**
   * Build initial segments for a download.
   * If the file is not resumable or size is unknown, returns a single segment.
   */
  createInitialSegments(resumable: boolean): DownloadSegment[] {
    const { totalSize, maxConnections } = this.opts;

    if (!resumable || totalSize <= 0) {
      return [{ id: 0, start: 0, end: totalSize > 0 ? totalSize - 1 : -1, downloaded: 0, status: 'pending' }];
    }

    const count = Math.min(maxConnections, Math.floor(totalSize / this.minChunk), 32);
    const actualCount = Math.max(1, count);
    const chunkSize = Math.floor(totalSize / actualCount);

    return Array.from({ length: actualCount }, (_, i) => ({
      id: i,
      start: i * chunkSize,
      end: i === actualCount - 1 ? totalSize - 1 : (i + 1) * chunkSize - 1,
      downloaded: 0,
      status: 'pending' as const,
    }));
  }

  /**
   * IDM's dynamic segmentation: find the largest active segment with remaining bytes,
   * then split it. Returns the new segment, or null if no split is possible.
   */
  splitLargestSegment(segments: DownloadSegment[], nextId: number): DownloadSegment | null {
    const splittable = segments.filter(s => {
      if (s.status !== 'downloading' && s.status !== 'pending') return false;
      const remaining = (s.end - s.start + 1) - s.downloaded;
      return remaining > this.minChunk * 2;
    });

    if (splittable.length === 0) return null;

    // Find segment with most remaining bytes
    const largest = splittable.reduce((best, s) => {
      const remaining = (s.end - s.start + 1) - s.downloaded;
      const bestRemaining = (best.end - best.start + 1) - best.downloaded;
      return remaining > bestRemaining ? s : best;
    });

    const currentPos = largest.start + largest.downloaded;
    const remaining = largest.end - currentPos + 1;
    const splitAt = currentPos + Math.floor(remaining / 2);

    if (splitAt >= largest.end) return null;

    // Shrink the original segment
    const originalEnd = largest.end;
    largest.end = splitAt - 1;

    // Create new segment from the split point
    return {
      id: nextId,
      start: splitAt,
      end: originalEnd,
      downloaded: 0,
      status: 'pending',
    };
  }

  /**
   * Merge tiny adjacent pending segments to avoid thrashing with small chunks.
   */
  mergeSmallSegments(segments: DownloadSegment[]): DownloadSegment[] {
    const pending = segments
      .filter(s => s.status === 'pending')
      .sort((a, b) => a.start - b.start);

    const result = segments.filter(s => s.status !== 'pending');

    let i = 0;
    while (i < pending.length) {
      const seg = { ...pending[i]! };
      while (
        i + 1 < pending.length &&
        pending[i + 1]!.start === seg.end + 1 &&
        (seg.end - seg.start + 1) < this.minChunk
      ) {
        i++;
        seg.end = pending[i]!.end;
      }
      result.push(seg);
      i++;
    }

    return result.sort((a, b) => a.start - b.start);
  }

  static detectProtocol(url: string): 'http' | 'https' | 'ftp' | 'magnet' {
    try {
      const proto = new URL(url).protocol.replace(':', '');
      if (['http', 'https', 'ftp', 'magnet'].includes(proto)) return proto as any;
    } catch {}
    return 'http';
  }
}