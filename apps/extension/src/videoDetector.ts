import { isVideoStreamUrl } from './utils/links';

export interface DetectedVideo {
  url: string;
  tabId: number;
  tabTitle?: string;
  type: 'hls' | 'dash' | 'direct';
  timestamp: number;
}

const detectedVideos = new Map<string, DetectedVideo>();
const listeners: Array<(v: DetectedVideo) => void> = [];

export function onVideoDetected(cb: (v: DetectedVideo) => void): () => void {
  listeners.push(cb);
  return () => { listeners.splice(listeners.indexOf(cb), 1); };
}

export function getDetectedVideos(): DetectedVideo[] {
  return [...detectedVideos.values()];
}

export function clearVideosForTab(tabId: number): void {
  for (const [key, v] of detectedVideos) {
    if (v.tabId === tabId) detectedVideos.delete(key);
  }
}

export function startVideoDetector(): void {
  // Watch all network requests for video stream signatures
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (details.type !== 'xmlhttprequest' && details.type !== 'other' && details.type !== 'media') return;
      if (!isVideoStreamUrl(details.url)) return;

      const type: DetectedVideo['type'] = details.url.includes('.m3u8') ? 'hls'
        : details.url.includes('.mpd') ? 'dash' : 'direct';

      const video: DetectedVideo = {
        url: details.url,
        tabId: details.tabId,
        type,
        timestamp: Date.now(),
      };

      // Enrich with tab title
      chrome.tabs.get(details.tabId, (tab) => {
        video.tabTitle = tab?.title;
        detectedVideos.set(details.url, video);
        listeners.forEach(l => l(video));
      });
    },
    { urls: ['<all_urls>'] },
    []
  );

  // Clean up when tab navigates away
  chrome.tabs.onUpdated.addListener((tabId, info) => {
    if (info.status === 'loading') clearVideosForTab(tabId);
  });
}
