import { isDownloadableUrl, isIgnoredUrl } from './utils/links';

export interface InterceptedDownload {
  url: string;
  filename?: string;
  referrer?: string;
  cookies?: string;
  fileSize?: number;
  mimeType?: string;
}

type InterceptCallback = (dl: InterceptedDownload) => void;

const listeners: InterceptCallback[] = [];

export function onDownloadIntercepted(cb: InterceptCallback): () => void {
  listeners.push(cb);
  return () => { listeners.splice(listeners.indexOf(cb), 1); };
}

function emit(dl: InterceptedDownload): void {
  listeners.forEach(l => l(dl));
}

/**
 * Hooks into chrome.downloads.onCreated to catch all browser download events.
 */
export function startDownloadInterceptor(settings: { catchAll: boolean; minSize: number; extensions: string[] }): void {
  chrome.downloads.onCreated.addListener((item) => {
    if (isIgnoredUrl(item.url)) return;

    const ext = item.filename.split('.').pop()?.toLowerCase() ?? '';
    const passesExtFilter = settings.extensions.length === 0 || settings.extensions.includes(ext);
    const passesSize = item.fileSize === -1 || item.fileSize >= settings.minSize;

    if (!settings.catchAll && !isDownloadableUrl(item.url)) return;
    if (!passesExtFilter || !passesSize) return;

    // Cancel the browser's own download — IDM will handle it
    chrome.downloads.cancel(item.id);
    chrome.downloads.erase({ id: item.id });

    emit({
      url: item.url,
      filename: item.filename.split('/').pop() || item.filename.split('\\').pop(),
      referrer: item.referrer,
      fileSize: item.fileSize > 0 ? item.fileSize : undefined,
      mimeType: item.mime,
    });
  });
}
