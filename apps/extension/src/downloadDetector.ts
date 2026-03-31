/**
 * downloadDetector.ts
 *
 * IDM-style download interception using:
 * 1. chrome.downloads.onCreated — catches browser-initiated downloads
 * 2. onHeadersReceived — catches Content-Disposition: attachment responses
 * 3. Heuristic filtering (file size, extension, MIME type)
 */

import { isDownloadableUrl, isIgnoredUrl, getFilenameFromHeaders } from './utils/links';

export interface InterceptedDownload {
  url: string;
  filename?: string;
  referrer?: string;
  cookies?: string;
  fileSize?: number;
  mimeType?: string;
  headers?: Record<string, string>;
  contentDisposition?: string;
}

type InterceptCallback = (dl: InterceptedDownload) => void;
const listeners: InterceptCallback[] = [];

export function onDownloadIntercepted(cb: InterceptCallback): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function emit(dl: InterceptedDownload): void {
  listeners.forEach(l => { try { l(dl); } catch {} });
}

// Track in-flight requests we already decided to intercept (avoid double-firing)
const interceptedUrls = new Set<string>();

export interface InterceptorSettings {
  catchAll: boolean;
  minSize: number;
  extensions: string[];
  enabled: boolean;
}

export function startDownloadInterceptor(settings: InterceptorSettings): void {

  // ── Method 1: chrome.downloads.onCreated ──────────────────────────────────
  // This fires when the browser itself would start a download.
  // We cancel it and hand off to IDM Clone.
  chrome.downloads.onCreated.addListener((item) => {
    if (!settings.enabled) return;
    if (isIgnoredUrl(item.url)) return;

    const ext = item.filename.split('.').pop()?.toLowerCase() ?? '';
    const passesExt = settings.extensions.length === 0 || settings.extensions.includes(ext);
    const passesSize = item.fileSize <= 0 || item.fileSize >= settings.minSize;

    if (!settings.catchAll && !isDownloadableUrl(item.url)) return;
    if (!passesExt || !passesSize) return;
    if (interceptedUrls.has(item.url)) return;

    interceptedUrls.add(item.url);
    setTimeout(() => interceptedUrls.delete(item.url), 10_000);

    // Cancel the browser's own download
    chrome.downloads.cancel(item.id);
    chrome.downloads.erase({ id: item.id });

    emit({
      url: item.url,
      filename: item.filename.split(/[\\/]/).pop() ?? item.filename,
      referrer: item.referrer || undefined,
      fileSize: item.fileSize > 0 ? item.fileSize : undefined,
      mimeType: item.mime || undefined,
    });
  });

  // ── Method 2: onHeadersReceived — Content-Disposition: attachment ─────────
  // This catches server-forced downloads (the IDM way — deeper interception).
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      if (!settings.enabled) return;
      if (details.tabId < 0) return; // ignore background/extension requests
      if (isIgnoredUrl(details.url)) return;
      if (interceptedUrls.has(details.url)) return;

      const headers = details.responseHeaders ?? [];
      const contentDisposition = headers
        .find(h => h.name.toLowerCase() === 'content-disposition')
        ?.value ?? '';
      const contentType = headers
        .find(h => h.name.toLowerCase() === 'content-type')
        ?.value?.split(';')[0]?.trim()?.toLowerCase() ?? '';
      const contentLength = parseInt(
        headers.find(h => h.name.toLowerCase() === 'content-length')?.value ?? '-1',
        10
      );

      const isAttachment = contentDisposition.toLowerCase().includes('attachment');
      const isDownloadMime = isDownloadableMime(contentType);
      const ext = getExtFromUrl(details.url);
      const isDownloadExt = isDownloadableUrl(details.url);

      if (!isAttachment && !isDownloadMime && !isDownloadExt) return;
      if (!settings.catchAll && !isAttachment && !isDownloadMime) return;

      const sizeOk = contentLength <= 0 || contentLength >= settings.minSize;
      if (!sizeOk) return;

      const extOk = settings.extensions.length === 0 || settings.extensions.includes(ext);
      if (!extOk && !isAttachment) return;

      interceptedUrls.add(details.url);
      setTimeout(() => interceptedUrls.delete(details.url), 10_000);

      // Build header map for the native downloader
      const headerMap: Record<string, string> = {};
      for (const h of headers) {
        if (h.name && h.value) headerMap[h.name.toLowerCase()] = h.value;
      }

      const filename = getFilenameFromHeaders(contentDisposition) ??
        getFilenameFromUrl(details.url);

      emit({
        url: details.url,
        filename,
        fileSize: contentLength > 0 ? contentLength : undefined,
        mimeType: contentType || undefined,
        contentDisposition,
        headers: headerMap,
        referrer: headers.find(h => h.name.toLowerCase() === 'referer')?.value,
      });

      // Return blocking redirect to prevent browser download
      // (In MV3 we can't truly block, but we've already cancelled via downloads API)
    },
    { urls: ['<all_urls>'], types: ['main_frame', 'sub_frame', 'xmlhttprequest', 'other'] },
    ['responseHeaders']
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DOWNLOADABLE_MIMES = new Set([
  'application/octet-stream',
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed', 'application/x-7z-compressed',
  'application/x-tar', 'application/gzip',
  'application/pdf', 'application/msword',
  'application/vnd.ms-excel', 'application/vnd.ms-powerpoint',
  'application/x-msdownload', 'application/vnd.android.package-archive',
  'application/x-iso9660-image',
  'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/flac',
  'video/mp4', 'video/webm', 'video/x-matroska',
]);

function isDownloadableMime(mime: string): boolean {
  return DOWNLOADABLE_MIMES.has(mime);
}

function getExtFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    return p.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
  } catch { return ''; }
}

function getFilenameFromUrl(url: string): string {
  try {
    const p = new URL(url).pathname;
    const name = p.split('/').pop();
    return name ? decodeURIComponent(name) : 'download';
  } catch { return 'download'; }
}
