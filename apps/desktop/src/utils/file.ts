import type { DownloadCategory } from '@idm/shared';
import { CATEGORY_EXTENSIONS } from '@idm/shared';

export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const icons: Record<string, string> = {
    // Video
    mp4: '🎬', mkv: '🎬', avi: '🎬', mov: '🎬', webm: '🎬',
    // Audio
    mp3: '🎵', flac: '🎵', aac: '🎵', wav: '🎵', ogg: '🎵',
    // Documents
    pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊', ppt: '📋', pptx: '📋',
    // Compressed
    zip: '🗜', rar: '🗜', '7z': '🗜', tar: '🗜', gz: '🗜',
    // Programs
    exe: '⚙️', msi: '⚙️', dmg: '💿', pkg: '📦', deb: '📦', rpm: '📦',
    // Images
    jpg: '🖼', jpeg: '🖼', png: '🖼', gif: '🖼', webp: '🖼', svg: '🖼',
  };
  return icons[ext] ?? '📁';
}

export function detectCategory(filename: string): DownloadCategory {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  for (const [cat, exts] of Object.entries(CATEGORY_EXTENSIONS)) {
    if ((exts as string[]).includes(ext)) return cat as DownloadCategory;
  }
  return 'general';
}

export function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return ['http:', 'https:', 'ftp:', 'magnet:'].includes(u.protocol);
  } catch {
    return false;
  }
}

export function extractFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const name = u.pathname.split('/').pop();
    return name ? decodeURIComponent(name) : 'download';
  } catch {
    return 'download';
  }
}
