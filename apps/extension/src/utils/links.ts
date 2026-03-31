/**
 * utils/links.ts
 * URL and header utilities for the IDM Clone browser extension.
 */

const DOWNLOADABLE_EXTENSIONS = new Set([
  // Executables & installers
  'exe','msi','dmg','pkg','deb','rpm','apk','ipa','appimage',
  // Archives
  'zip','rar','7z','tar','gz','bz2','xz','iso','cab','img','bin',
  // Video
  'mp4','mkv','avi','mov','wmv','flv','webm','m4v','mpeg','mpg','3gp','ts','m2ts',
  // Audio
  'mp3','flac','aac','ogg','wav','m4a','wma','opus','aiff',
  // Documents
  'pdf','doc','docx','xls','xlsx','ppt','pptx','epub','mobi','azw','azw3',
  // Torrents
  'torrent',
  // Images (large)
  'psd','ai','raw','cr2','nef','arw',
]);

const VIDEO_STREAM_PATTERNS = [
  /\.m3u8(\?.*)?$/i,
  /\.mpd(\?.*)?$/i,
  /manifest\.m3u8/i,
  /playlist\.m3u8/i,
  /\/hls\//i,
  /\/dash\//i,
  /\/manifest\//i,
];

// Known analytics/tracking domains to ignore
const IGNORED_DOMAINS = new Set([
  'google-analytics.com',
  'googletagmanager.com',
  'doubleclick.net',
  'facebook.com',
  'connect.facebook.net',
  'scorecardresearch.com',
  'quantserve.com',
  'chartbeat.com',
  'newrelic.com',
  'hotjar.com',
]);

export function isDownloadableUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!['http:', 'https:', 'ftp:'].includes(u.protocol)) return false;
    const ext = u.pathname.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
    return DOWNLOADABLE_EXTENSIONS.has(ext);
  } catch { return false; }
}

export function isVideoStreamUrl(url: string): boolean {
  return VIDEO_STREAM_PATTERNS.some(p => p.test(url));
}

export function extractFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const name = u.pathname.split('/').pop();
    return name ? decodeURIComponent(name) : 'download';
  } catch { return 'download'; }
}

export function isIgnoredUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (!['http:', 'https:', 'ftp:'].includes(u.protocol)) return true;
    return IGNORED_DOMAINS.has(u.hostname) ||
      [...IGNORED_DOMAINS].some(d => u.hostname.endsWith('.' + d));
  } catch { return true; }
}

/**
 * Extract filename from Content-Disposition header.
 * Handles both simple and RFC 5987 encoded filenames.
 */
export function getFilenameFromHeaders(contentDisposition: string): string | null {
  if (!contentDisposition) return null;

  // RFC 5987: filename*=UTF-8''encoded-name (takes priority)
  const rfc5987 = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (rfc5987?.[1]) {
    try {
      const val = rfc5987[1].trim();
      const parts = val.split("''");
      if (parts.length >= 2) {
        return decodeURIComponent(parts.slice(1).join("''"));
      }
    } catch {}
  }

  // Standard: filename="..." or filename=...
  const standard = contentDisposition.match(/filename\s*=\s*["']?([^"';\r\n]+)["']?/i);
  if (standard?.[1]) {
    return standard[1].trim().replace(/["']/g, '');
  }

  return null;
}
