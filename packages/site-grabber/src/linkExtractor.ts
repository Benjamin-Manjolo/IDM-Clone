export interface ExtractedLink {
  url: string;
  type: 'download' | 'page' | 'media' | 'asset';
  text?: string;
  mimeHint?: string;
}

const DOWNLOAD_EXTENSIONS = new Set([
  'exe','msi','dmg','pkg','deb','rpm','zip','rar','7z','tar','gz','bz2',
  'mp4','mkv','avi','mov','mp3','flac','aac','pdf','doc','docx','xls',
  'xlsx','ppt','pptx','iso','img','apk','ipa','torrent',
]);

const MEDIA_EXTENSIONS = new Set(['jpg','jpeg','png','gif','webp','svg','bmp','tiff','ico']);

export function extractLinks(html: string, baseUrl: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const seen = new Set<string>();

  const add = (rawUrl: string, type: ExtractedLink['type'], text?: string, mimeHint?: string) => {
    const resolved = resolveUrl(rawUrl, baseUrl);
    if (!resolved || seen.has(resolved)) return;
    seen.add(resolved);
    links.push({ url: resolved, type, text, mimeHint });
  };

  // <a href="...">
  const aPattern = /<a\s[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gis;
  let m: RegExpExecArray | null;
  while ((m = aPattern.exec(html)) !== null) {
    const href = m[1]!.trim();
    const text = m[2]!.replace(/<[^>]+>/g, '').trim();
    const ext = getExt(href);
    if (DOWNLOAD_EXTENSIONS.has(ext)) add(href, 'download', text);
    else if (href && !href.startsWith('#') && !href.startsWith('javascript:')) add(href, 'page', text);
  }

  // <img src="...">
  const imgPattern = /<img\s[^>]*src="([^"]*)"/gi;
  while ((m = imgPattern.exec(html)) !== null) {
    add(m[1]!.trim(), 'media');
  }

  // <video src="..."> / <audio src="..."> / <source src="...">
  const mediaPattern = /<(?:video|audio|source)\s[^>]*src="([^"]*)"/gi;
  while ((m = mediaPattern.exec(html)) !== null) {
    add(m[1]!.trim(), 'media');
  }

  // <link href="..."> for stylesheets/icons
  const linkPattern = /<link\s[^>]*href="([^"]*)"[^>]*>/gi;
  while ((m = linkPattern.exec(html)) !== null) {
    const href = m[1]!.trim();
    if (href.endsWith('.css') || href.includes('favicon')) add(href, 'asset');
  }

  return links;
}

function getExt(url: string): string {
  try {
    const pathname = new URL(url, 'https://x.com').pathname;
    return pathname.split('.').pop()?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}

function resolveUrl(url: string, base: string): string | null {
  if (!url || url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('#')) return null;
  try { return new URL(url, base).toString(); } catch { return null; }
}
