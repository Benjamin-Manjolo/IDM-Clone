import * as fs from 'fs';
import * as path from 'path';

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function preallocate(filePath: string, size: number): void {
  ensureDir(path.dirname(filePath));
  const fd = fs.openSync(filePath, 'w');
  if (size > 0) fs.ftruncateSync(fd, size);
  fs.closeSync(fd);
}

export function resolveConflict(
  filePath: string,
  strategy: 'rename' | 'overwrite' | 'skip'
): string | null {
  if (!fs.existsSync(filePath)) return filePath;

  if (strategy === 'overwrite') {
    fs.unlinkSync(filePath);
    return filePath;
  }

  if (strategy === 'skip') return null;

  // rename: add (1), (2), ... suffix
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  let i = 1;
  while (true) {
    const candidate = path.join(dir, `${base} (${i})${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
    i++;
  }
}

export function deleteFile(filePath: string): void {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

export function getFileSize(filePath: string): number {
  try { return fs.statSync(filePath).size; } catch { return 0; }
}
