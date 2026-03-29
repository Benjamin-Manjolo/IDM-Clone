import * as fs from 'fs';
import * as path from 'path';
import type { DownloadSegment } from '@idm/shared';

export interface ResumeData {
  id: string;
  url: string;
  filename: string;
  savePath: string;
  totalSize: number;
  downloadedSize: number;
  segments: DownloadSegment[];
  headers?: Record<string, string>;
  cookies?: string;
  createdAt: number;
  updatedAt: number;
}

export class ResumeManager {
  private readonly resumeDir: string;

  constructor(baseDir: string) {
    this.resumeDir = path.join(baseDir, '.idm-resume');
    fs.mkdirSync(this.resumeDir, { recursive: true });
  }

  private filePath(id: string): string {
    return path.join(this.resumeDir, `${id}.json`);
  }

  save(data: ResumeData): void {
    const updated = { ...data, updatedAt: Date.now() };
    fs.writeFileSync(this.filePath(data.id), JSON.stringify(updated, null, 2), 'utf8');
  }

  load(id: string): ResumeData | null {
    const fp = this.filePath(id);
    if (!fs.existsSync(fp)) return null;
    try {
      return JSON.parse(fs.readFileSync(fp, 'utf8')) as ResumeData;
    } catch {
      return null;
    }
  }

  delete(id: string): void {
    const fp = this.filePath(id);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
  }

  listAll(): ResumeData[] {
    try {
      return fs.readdirSync(this.resumeDir)
        .filter(f => f.endsWith('.json'))
        .map(f => {
          try { return JSON.parse(fs.readFileSync(path.join(this.resumeDir, f), 'utf8')) as ResumeData; }
          catch { return null; }
        })
        .filter(Boolean) as ResumeData[];
    } catch {
      return [];
    }
  }

  /**
   * Update only the segment state — called frequently during download.
   */
  updateSegments(id: string, segments: DownloadSegment[], downloadedSize: number): void {
    const existing = this.load(id);
    if (!existing) return;
    this.save({ ...existing, segments, downloadedSize });
  }
}