/**
 * videoDetector.ts
 *
 * IDM-style real-time network observer for video/audio streams.
 * Uses onBeforeRequest + onHeadersReceived + onResponseStarted
 * to detect HLS, DASH, progressive MP4/WebM streams.
 *
 * Heuristics mirror what IDM does:
 * - Sequential chunk requests (seg-, chunk_, fragment_, .ts, .m4s)
 * - Video/audio MIME types
 * - Manifest files (.m3u8, .mpd)
 * - High-bandwidth correlated requests per tab
 * - YouTube itag= patterns
 */

export interface VideoQuality {
  label: string;       // "1080p HD", "720p", "480p", etc.
  url: string;
  bandwidth?: number;
  width?: number;
  height?: number;
  mimeType?: string;
  fileSize?: number;   // bytes, -1 if unknown
  isAudioOnly?: boolean;
  isVideoOnly?: boolean;
  container?: string;  // "mp4", "webm", "ts"
}

export interface DetectedVideo {
  url: string;
  tabId: number;
  tabTitle?: string;
  pageUrl?: string;
  type: 'hls' | 'dash' | 'direct-video' | 'direct-audio' | 'progressive';
  timestamp: number;
  title?: string;
  qualities: VideoQuality[];
  thumbnail?: string;
  duration?: number;
  // For HLS/DASH — the manifest URL (best to pass this to the downloader)
  manifestUrl?: string;
}

// ── Storage ───────────────────────────────────────────────────────────────────
// Tab-keyed map for detected videos (URL → DetectedVideo)
const detectedByTab = new Map<number, Map<string, DetectedVideo>>();
const listeners: Array<(v: DetectedVideo) => void> = [];

// Track sequential chunk request counts per tab+domain (for streaming heuristics)
interface ChunkCounter {
  count: number;
  lastSeen: number;
  domain: string;
}
const chunkCounters = new Map<string, ChunkCounter>(); // key: `${tabId}:${domain}`

// ── Patterns ──────────────────────────────────────────────────────────────────
const MANIFEST_PATTERNS = [
  /\.m3u8(\?.*)?$/i,
  /\.mpd(\?.*)?$/i,
  /manifest(\.m3u8|\.mpd)?(\?.*)?$/i,
  /\/api\/manifest\/dash\//i,
  /mime=application%2Fdash\+xml/i,
  /playlist(\.m3u8)?(\?.*)?$/i,
  /\/hls\//i,
  /\/dash\//i,
];

const SEGMENT_PATTERNS = [
  /[\/\-_]seg(ment)?[-_]?\d+/i,
  /[\/\-_]chunk[-_]?\d+/i,
  /[\/\-_]fragment[-_]?\d+/i,
  /\/\d{4,}\.ts$/i,
  /\.ts\?/i,
  /\.m4s(\?.*)?$/i,
  /\.aac\?.*t=/i,
  /itag=\d+/i,             // YouTube
  /quality(=|\/)\w+/i,
  /\/seg-\d+/i,
  /\/index\d+\.ts/i,
];

const VIDEO_MIME_TYPES = new Set([
  'video/mp4', 'video/webm', 'video/ogg', 'video/x-matroska',
  'video/quicktime', 'video/x-msvideo', 'video/3gpp',
  'application/x-mpegurl', 'application/vnd.apple.mpegurl',
  'application/dash+xml', 'video/mp2t',
]);

const AUDIO_MIME_TYPES = new Set([
  'audio/mp4', 'audio/mpeg', 'audio/ogg', 'audio/webm',
  'audio/aac', 'audio/flac', 'audio/wav', 'audio/x-m4a',
]);

// Resource types that can carry media
const MEDIA_TYPES = new Set(['media', 'xmlhttprequest', 'other', 'fetch']);

// ── Helpers ───────────────────────────────────────────────────────────────────
function isManifestUrl(url: string): boolean {
  return MANIFEST_PATTERNS.some(p => p.test(url));
}

function isSegmentUrl(url: string): boolean {
  return SEGMENT_PATTERNS.some(p => p.test(url));
}

function getVideoType(url: string, mimeType?: string): DetectedVideo['type'] | null {
  const lower = url.toLowerCase();

  if (lower.includes('.m3u8') || lower.includes('application/x-mpegurl') ||
    (mimeType && (mimeType.includes('mpegurl') || mimeType.includes('x-mpegurl')))) {
    return 'hls';
  }
  if (lower.includes('.mpd') || (mimeType && mimeType.includes('dash+xml'))) {
    return 'dash';
  }
  if (mimeType) {
    if (VIDEO_MIME_TYPES.has(mimeType.split(';')[0]?.trim() ?? '')) return 'direct-video';
    if (AUDIO_MIME_TYPES.has(mimeType.split(';')[0]?.trim() ?? '')) return 'direct-audio';
  }
  return null;
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

function buildQualityLabel(width?: number, height?: number, bandwidth?: number, isAudio?: boolean): string {
  if (isAudio) return `Audio ${bandwidth ? formatBitrate(bandwidth) : ''}`.trim();
  if (height) {
    const hd = height >= 720 ? ' HD' : '';
    return `${height}p${hd}`;
  }
  if (bandwidth) return formatBitrate(bandwidth);
  return 'Unknown';
}

function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  return `${Math.round(bps / 1000)} Kbps`;
}

// ── Public API ────────────────────────────────────────────────────────────────
export function onVideoDetected(cb: (v: DetectedVideo) => void): () => void {
  listeners.push(cb);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export async function getDetectedVideos(): Promise<DetectedVideo[]> {
  const all: DetectedVideo[] = [];
  for (const tabMap of detectedByTab.values()) {
    all.push(...tabMap.values());
  }
  // Sort newest first
  return all.sort((a, b) => b.timestamp - a.timestamp);
}

export function clearVideosForTab(tabId: number): void {
  detectedByTab.delete(tabId);
  // Clear chunk counters for this tab
  for (const key of chunkCounters.keys()) {
    if (key.startsWith(`${tabId}:`)) chunkCounters.delete(key);
  }
}

function emit(video: DetectedVideo): void {
  listeners.forEach(l => {
    try { l(video); } catch {}
  });
}

function upsertVideo(tabId: number, url: string, update: Partial<DetectedVideo>): DetectedVideo {
  if (!detectedByTab.has(tabId)) detectedByTab.set(tabId, new Map());
  const tabMap = detectedByTab.get(tabId)!;

  const existing = tabMap.get(url);
  if (existing) {
    // Merge qualities (deduplicate by label)
    if (update.qualities?.length) {
      const labels = new Set(existing.qualities.map(q => q.label));
      for (const q of update.qualities) {
        if (!labels.has(q.label)) {
          existing.qualities.push(q);
          labels.add(q.label);
        }
      }
      // Sort by resolution descending
      existing.qualities.sort((a, b) => {
        const ah = a.height ?? (a.bandwidth ? a.bandwidth / 1000 : 0);
        const bh = b.height ?? (b.bandwidth ? b.bandwidth / 1000 : 0);
        return bh - ah;
      });
    }
    Object.assign(existing, { ...update, qualities: existing.qualities, timestamp: Date.now() });
    return existing;
  }

  const video: DetectedVideo = {
    url,
    tabId,
    type: 'hls',
    timestamp: Date.now(),
    qualities: [],
    ...update,
  };
  tabMap.set(url, video);
  return video;
}

// ── Main detector ──────────────────────────────────────────────────────────────
export function startVideoDetector(): void {
  // 1. onBeforeRequest — earliest interception point
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      if (!MEDIA_TYPES.has(details.type)) return;
      if (details.tabId < 0) return; // background requests

      const { url, tabId } = details;
      handleRequest(url, tabId, undefined);
    },
    { urls: ['<all_urls>'] },
    []
  );

  // 2. onHeadersReceived — get actual MIME type from server
  chrome.webRequest.onHeadersReceived.addListener(
    (details) => {
      if (!MEDIA_TYPES.has(details.type)) return;
      if (details.tabId < 0) return;

      const mimeType = details.responseHeaders
        ?.find(h => h.name.toLowerCase() === 'content-type')
        ?.value?.split(';')[0]?.trim()
        ?.toLowerCase();

      const contentLength = parseInt(
        details.responseHeaders
          ?.find(h => h.name.toLowerCase() === 'content-length')?.value ?? '-1',
        10
      );

      if (mimeType && (VIDEO_MIME_TYPES.has(mimeType) || AUDIO_MIME_TYPES.has(mimeType))) {
        handleRequest(details.url, details.tabId, mimeType, contentLength);
      }
    },
    { urls: ['<all_urls>'] },
    ['responseHeaders']
  );

  // 3. Clean up on tab navigation
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'loading') clearVideosForTab(tabId);
  });

  chrome.tabs.onRemoved.addListener(clearVideosForTab);
}

function handleRequest(url: string, tabId: number, mimeType?: string, fileSize?: number): void {
  const isManifest = isManifestUrl(url);
  const isSegment = isSegmentUrl(url);
  const videoType = getVideoType(url, mimeType);

  // Track segment request frequency for streaming heuristics
  if (isSegment) {
    const domain = extractDomain(url);
    const key = `${tabId}:${domain}`;
    const counter = chunkCounters.get(key);
    const now = Date.now();
    if (counter && now - counter.lastSeen < 30_000) {
      counter.count++;
      counter.lastSeen = now;
    } else {
      chunkCounters.set(key, { count: 1, lastSeen: now, domain });
    }
  }

  if (!isManifest && !videoType) return;

  // Determine the canonical manifest/stream URL
  const canonicalUrl = isManifest ? url : url;
  const type = videoType ?? (isManifest ? (url.includes('.mpd') ? 'dash' : 'hls') : 'direct-video');

  // Build quality entry if we have enough info
  const qualities: VideoQuality[] = [];

  if (videoType === 'direct-video' || videoType === 'direct-audio') {
    const container = url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'mp4';
    qualities.push({
      label: videoType === 'direct-audio' ? 'Audio' : 'Video',
      url,
      mimeType,
      fileSize: fileSize && fileSize > 0 ? fileSize : -1,
      isAudioOnly: videoType === 'direct-audio',
      container,
    });
  }

  // Enrich with tab info
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) return;

    const video = upsertVideo(tabId, canonicalUrl, {
      type,
      tabTitle: tab?.title,
      pageUrl: tab?.url,
      manifestUrl: isManifest ? url : undefined,
      qualities,
    });

    // For HLS manifests, fetch and parse them to extract quality variants
    if (isManifest && type === 'hls') {
      fetchAndParseM3U8(url, tabId, video);
    } else if (isManifest && type === 'dash') {
      fetchAndParseMPD(url, tabId, video);
    }

    emit(video);
  });
}

// ── HLS manifest quick-parse for quality extraction ───────────────────────────
async function fetchAndParseM3U8(manifestUrl: string, tabId: number, video: DetectedVideo): Promise<void> {
  try {
    const resp = await fetch(manifestUrl, { credentials: 'include' });
    if (!resp.ok) return;
    const text = await resp.text();

    const variants: VideoQuality[] = [];
    const lines = text.split('\n').map(l => l.trim());

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';

      if (line.startsWith('#EXT-X-STREAM-INF')) {
        // Master playlist variant
        const bwMatch = line.match(/BANDWIDTH=(\d+)/);
        const resMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
        const nameMatch = line.match(/NAME="([^"]+)"/);
        const bandwidth = bwMatch ? parseInt(bwMatch[1] ?? '0') : undefined;
        const width = resMatch ? parseInt(resMatch[1] ?? '0') : undefined;
        const height = resMatch ? parseInt(resMatch[2] ?? '0') : undefined;
        const nextLine = lines[i + 1];
        if (nextLine && !nextLine.startsWith('#')) {
          const variantUrl = resolveUrl(nextLine, manifestUrl);
          variants.push({
            label: nameMatch?.[1] ?? buildQualityLabel(width, height, bandwidth),
            url: variantUrl,
            bandwidth,
            width,
            height,
            container: 'ts',
          });
          i++;
        }
      } else if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=AUDIO')) {
        // Audio-only track
        const uriMatch = line.match(/URI="([^"]+)"/);
        const nameMatch = line.match(/NAME="([^"]+)"/);
        if (uriMatch?.[1]) {
          variants.push({
            label: nameMatch?.[1] ?? 'Audio',
            url: resolveUrl(uriMatch[1], manifestUrl),
            isAudioOnly: true,
            container: 'aac',
          });
        }
      }
    }

    if (variants.length > 0) {
      // Sort best first
      variants.sort((a, b) => (b.height ?? 0) - (a.height ?? 0));
      const updated = upsertVideo(tabId, manifestUrl, { qualities: variants });
      emit(updated);
    }
  } catch {
    // Silent fail — network errors are expected
  }
}

// ── DASH MPD quick-parse for quality extraction ──────────────────────────────
async function fetchAndParseMPD(manifestUrl: string, tabId: number, _video: DetectedVideo): Promise<void> {
  try {
    const resp = await fetch(manifestUrl, { credentials: 'include' });
    if (!resp.ok) return;
    const xml = await resp.text();

    const variants: VideoQuality[] = [];
    const reps = [...xml.matchAll(/<Representation([^>]*)>/g)];
    for (const m of reps) {
      const tag = m[1] ?? '';
      const id = tag.match(/id="([^"]+)"/)?.[1];
      const bw = parseInt(tag.match(/bandwidth="(\d+)"/)?.[1] ?? '0', 10);
      const width = parseInt(tag.match(/width="(\d+)"/)?.[1] ?? '0', 10) || undefined;
      const height = parseInt(tag.match(/height="(\d+)"/)?.[1] ?? '0', 10) || undefined;
      const codecs = tag.match(/codecs="([^"]+)"/)?.[1];
      const mimeType = tag.match(/mimeType="([^"]+)"/)?.[1] ?? 'video/mp4';
      const isAudioOnly = mimeType.startsWith('audio/');

      variants.push({
        label: isAudioOnly ? `Audio ${formatBitrate(bw)}` : buildQualityLabel(width, height, bw),
        url: manifestUrl,
        bandwidth: bw || undefined,
        width,
        height,
        mimeType,
        isAudioOnly,
        isVideoOnly: !isAudioOnly,
        container: mimeType.includes('webm') ? 'webm' : 'mp4',
      });
      // avoid overwhelming menu on very large manifests
      if (variants.length >= 40) break;
      if (!id && !bw && !width && !height && !codecs) continue;
    }

    if (variants.length > 0) {
      const dedup = new Map<string, VideoQuality>();
      for (const v of variants) dedup.set(`${v.label}:${v.mimeType}:${v.isAudioOnly ? 'a' : 'v'}`, v);
      const sorted = [...dedup.values()].sort((a, b) => (b.height ?? b.bandwidth ?? 0) - (a.height ?? a.bandwidth ?? 0));
      const updated = upsertVideo(tabId, manifestUrl, { qualities: sorted });
      emit(updated);
    }
  } catch {
    // ignore parse/network errors
  }
}

function resolveUrl(url: string, base: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  try { return new URL(url, base).toString(); } catch { return url; }
}
