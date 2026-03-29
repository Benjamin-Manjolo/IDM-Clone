const DOWNLOADABLE_EXTENSIONS = new Set([
  'exe','msi','dmg','pkg','deb','rpm','apk','ipa',
  'zip','rar','7z','tar','gz','bz2','xz','iso','cab',
  'mp4','mkv','avi','mov','wmv','flv','webm','m4v','mpeg','mpg','3gp',
  'mp3','flac','aac','ogg','wav','m4a','wma','opus',
  'pdf','doc','docx','xls','xlsx','ppt','pptx','epub','mobi',
  'torrent',
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
    // Ignore known CDN/analytics/tracking noise
    const ignored = ['google-analytics.com', 'googletagmanager.com', 'facebook.com/tr', 'doubleclick.net'];
    return ignored.some(h => u.hostname.includes(h));
  } catch { return true; }
}
