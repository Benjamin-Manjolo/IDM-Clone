/**
 * contentScript.ts
 *
 * IDM Clone content script — injected into every page.
 *
 * Features:
 * 1. Floating "Download this video" badge on <video> elements (IDM-style)
 * 2. Quality selection dropdown when badge is clicked
 * 3. "Download with IDM Clone" tooltip on downloadable <a href> links
 * 4. Listens for video:detected messages from background
 */

import { isDownloadableUrl } from './utils/links';
import type { DetectedVideo, VideoQuality } from './videoDetector';

// ── State ─────────────────────────────────────────────────────────────────────
// Map video element → its badge element
const videoBadges = new Map<HTMLVideoElement, HTMLElement>();
// Currently detected videos (keyed by URL)
const detectedVideos = new Map<string, DetectedVideo>();
// Currently open quality menu
let openQualityMenu: HTMLElement | null = null;

// ── Badge styles injected once ─────────────────────────────────────────────────
function injectStyles(): void {
  if (document.getElementById('__idm_styles__')) return;
  const style = document.createElement('style');
  style.id = '__idm_styles__';
  style.textContent = `
    .__idm_badge__ {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      background: rgba(15, 20, 40, 0.88);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid rgba(37, 99, 235, 0.6);
      backdrop-filter: blur(6px);
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
      transition: opacity 0.2s, transform 0.15s;
      pointer-events: all;
      user-select: none;
      white-space: nowrap;
    }
    .__idm_badge__:hover {
      background: rgba(37, 99, 235, 0.85);
      border-color: rgba(59, 130, 246, 0.8);
      transform: scale(1.02);
    }
    .__idm_badge__ .__idm_icon__ {
      font-size: 14px;
      flex-shrink: 0;
    }
    .__idm_badge__ .__idm_close__ {
      margin-left: 4px;
      opacity: 0.6;
      font-size: 13px;
      cursor: pointer;
      line-height: 1;
      padding: 0 2px;
    }
    .__idm_badge__ .__idm_close__:hover { opacity: 1; }

    .__idm_quality_menu__ {
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 4px;
      z-index: 2147483647;
      background: rgba(12, 16, 32, 0.97);
      border: 1px solid rgba(37, 99, 235, 0.4);
      border-radius: 6px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.6);
      backdrop-filter: blur(12px);
      min-width: 260px;
      max-height: 320px;
      overflow-y: auto;
      padding: 4px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .__idm_quality_menu__ .__idm_qm_header__ {
      padding: 8px 12px 6px;
      font-size: 11px;
      font-weight: 700;
      color: rgba(255,255,255,0.4);
      letter-spacing: 0.8px;
      text-transform: uppercase;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 2px;
    }
    .__idm_quality_menu__ .__idm_q_item__ {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 12px;
      cursor: pointer;
      font-size: 12.5px;
      color: rgba(255,255,255,0.85);
      transition: background 0.1s;
    }
    .__idm_quality_menu__ .__idm_q_item__:hover {
      background: rgba(37, 99, 235, 0.25);
      color: #fff;
    }
    .__idm_quality_menu__ .__idm_q_badge__ {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(37,99,235,0.3);
      color: #60a5fa;
      border: 1px solid rgba(37,99,235,0.3);
      flex-shrink: 0;
    }
    .__idm_quality_menu__ .__idm_q_size__ {
      margin-left: auto;
      font-size: 10.5px;
      color: rgba(255,255,255,0.35);
      font-family: monospace;
    }
    .__idm_q_download_all__ {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 600;
      color: #60a5fa;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      margin-bottom: 2px;
      transition: background 0.1s;
    }
    .__idm_q_download_all__:hover { background: rgba(37, 99, 235, 0.2); }

    .__idm_link_tip__ {
      position: fixed;
      z-index: 2147483647;
      background: rgba(15,20,40,0.92);
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 9px;
      border-radius: 3px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s;
      border: 1px solid rgba(37,99,235,0.4);
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
  `;
  document.head?.appendChild(style) ?? document.documentElement.appendChild(style);
}

// ── Link tooltip (for <a href> downloadable links) ─────────────────────────────
let linkTooltip: HTMLElement | null = null;

function getLinkTooltip(): HTMLElement {
  if (!linkTooltip || !document.contains(linkTooltip)) {
    linkTooltip = document.createElement('div');
    linkTooltip.className = '__idm_link_tip__';
    linkTooltip.textContent = '⬇ Download with IDM Clone';
    document.body?.appendChild(linkTooltip);
  }
  return linkTooltip;
}

document.addEventListener('mouseover', (e) => {
  const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return;
  if (!isDownloadableUrl(anchor.href)) return;

  const tip = getLinkTooltip();
  const rect = anchor.getBoundingClientRect();
  tip.style.left = `${rect.left}px`;
  tip.style.top = `${rect.bottom + 4}px`;
  tip.style.opacity = '1';
}, { passive: true });

document.addEventListener('mouseout', (e) => {
  const anchor = (e.target as Element).closest('a[href]');
  if (!anchor) return;
  getLinkTooltip().style.opacity = '0';
}, { passive: true });

document.addEventListener('click', (e) => {
  const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor || !isDownloadableUrl(anchor.href)) return;

  e.preventDefault();
  e.stopPropagation();
  chrome.runtime.sendMessage({
    type: 'download:video',
    url: anchor.href,
    referrer: window.location.href,
  });
  getLinkTooltip().style.opacity = '0';
}, true);

// ── Video badge ───────────────────────────────────────────────────────────────
function createBadge(video: HTMLVideoElement, detectedVideo: DetectedVideo): void {
  if (videoBadges.has(video)) return;

  // Ensure the video's container is positioned
  const parent = video.parentElement;
  if (!parent) return;

  const origPosition = getComputedStyle(parent).position;
  if (origPosition === 'static') parent.style.position = 'relative';

  const badge = document.createElement('div');
  badge.className = '__idm_badge__';
  badge.dataset.videoUrl = detectedVideo.url;

  const icon = document.createElement('span');
  icon.className = '__idm_icon__';
  icon.textContent = '▶';

  const label = document.createElement('span');
  label.textContent = 'Download this video';

  const closeBtn = document.createElement('span');
  closeBtn.className = '__idm_close__';
  closeBtn.textContent = '✕';
  closeBtn.title = 'Dismiss';

  badge.appendChild(icon);
  badge.appendChild(label);
  badge.appendChild(closeBtn);
  parent.appendChild(badge);

  videoBadges.set(video, badge);

  // Close button — dismiss badge
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeQualityMenu();
    badge.remove();
    videoBadges.delete(video);
  });

  // Main click — show quality menu
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    toggleQualityMenu(badge, detectedVideo);
  });
}

function toggleQualityMenu(badge: HTMLElement, video: DetectedVideo): void {
  // Close any existing menu
  if (openQualityMenu) {
    openQualityMenu.remove();
    openQualityMenu = null;
    return;
  }

  // Ask background for freshest qualities before opening the menu.
  chrome.runtime.sendMessage({ type: 'badge:request-qualities', url: video.url }, (res) => {
    const resolved: DetectedVideo = (res?.video as DetectedVideo | undefined) ?? {
      ...video,
      qualities: (res?.qualities as VideoQuality[] | undefined) ?? video.qualities,
    };
    detectedVideos.set(resolved.url, resolved);

    const menu = buildQualityMenu(resolved, badge);
    badge.appendChild(menu);
    openQualityMenu = menu;

    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', closeQualityMenuHandler, { once: true, capture: true });
    }, 0);
  });
}

function closeQualityMenuHandler(e: Event): void {
  if (openQualityMenu && !openQualityMenu.contains(e.target as Node)) {
    closeQualityMenu();
  }
}

function closeQualityMenu(): void {
  openQualityMenu?.remove();
  openQualityMenu = null;
}

function buildQualityMenu(video: DetectedVideo, _badge: HTMLElement): HTMLElement {
  const menu = document.createElement('div');
  menu.className = '__idm_quality_menu__';

  const header = document.createElement('div');
  header.className = '__idm_qm_header__';
  header.textContent = video.tabTitle ?? document.title ?? 'Video';
  menu.appendChild(header);

  // "Download all" option
  const downloadAll = document.createElement('div');
  downloadAll.className = '__idm_q_download_all__';
  downloadAll.innerHTML = '⬇ <span>Download all</span>';
  downloadAll.addEventListener('click', (e) => {
    e.stopPropagation();
    closeQualityMenu();
    const bestUrl = video.qualities[0]?.url ?? video.url;
    chrome.runtime.sendMessage({
      type: 'download:video',
      url: bestUrl,
      referrer: video.pageUrl,
      title: video.tabTitle,
    });
  });
  menu.appendChild(downloadAll);

  if (video.qualities.length === 0) {
    // No parsed qualities yet — show generic download
    const item = createQualityItem('Download', video.url, video);
    menu.appendChild(item);
  } else {
    video.qualities.forEach((q, idx) => {
      const item = createQualityItem(
        `${idx + 1}. ${q.label}${q.isAudioOnly ? ' (audio)' : q.isVideoOnly ? ' (video)' : ''}`,
        q.url,
        video,
        q
      );
      menu.appendChild(item);
    });
  }

  return menu;
}

function createQualityItem(
  label: string,
  url: string,
  video: DetectedVideo,
  quality?: VideoQuality
): HTMLElement {
  const item = document.createElement('div');
  item.className = '__idm_q_item__';

  const icon = document.createElement('span');
  icon.textContent = quality?.isAudioOnly ? '🎵' : '🎬';
  item.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = label;
  item.appendChild(text);

  if (quality?.mimeType) {
    const badge = document.createElement('span');
    badge.className = '__idm_q_badge__';
    const container = quality.container ?? quality.mimeType.split('/')[1]?.split(';')[0]?.toUpperCase() ?? '';
    badge.textContent = container.toUpperCase().slice(0, 4);
    item.appendChild(badge);
  }

  if (quality?.fileSize && quality.fileSize > 0) {
    const size = document.createElement('span');
    size.className = '__idm_q_size__';
    size.textContent = formatBytes(quality.fileSize);
    item.appendChild(size);
  }

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    closeQualityMenu();
    chrome.runtime.sendMessage({
      type: 'download:video-quality',
      url,
      quality: quality ?? null,
      referrer: video.pageUrl ?? window.location.href,
      title: video.tabTitle ?? document.title,
    });
  });

  return item;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ── Video element observation ─────────────────────────────────────────────────
function attachBadgeToVideo(videoEl: HTMLVideoElement): void {
  if (videoBadges.has(videoEl)) return;

  // Find a matching detected video (by src)
  const src = videoEl.currentSrc || videoEl.src;
  let matchedVideo: DetectedVideo | undefined;

  for (const v of detectedVideos.values()) {
    if (src && (v.url.includes(src) || src.includes(v.url.split('?')[0] ?? ''))) {
      matchedVideo = v;
      break;
    }
  }

  if (!matchedVideo && detectedVideos.size > 0) {
    // No src match — use the most recently detected video for this page
    const sorted = [...detectedVideos.values()].sort((a, b) => b.timestamp - a.timestamp);
    matchedVideo = sorted[0];
  }

  if (!matchedVideo) return;

  createBadge(videoEl, matchedVideo);
}

// Observe new <video> elements appearing in the DOM
const videoObserver = new MutationObserver((mutations) => {
  for (const mut of mutations) {
    for (const node of mut.addedNodes) {
      if (node instanceof HTMLVideoElement) {
        attachBadgeToVideo(node);
      } else if (node instanceof Element) {
        node.querySelectorAll('video').forEach(attachBadgeToVideo);
      }
    }
  }
});

// ── Message listener from background ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'video:detected') {
    const video: DetectedVideo = msg.data;
    detectedVideos.set(video.url, video);

    // Try to attach badge to any existing <video> elements
    document.querySelectorAll('video').forEach(attachBadgeToVideo);

    // Update existing badge if qualities arrived later
    for (const [videoEl, badge] of videoBadges.entries()) {
      if (badge.dataset.videoUrl === video.url) {
        // Update badge to reflect quality count
        const qualityCount = video.qualities.length;
        if (qualityCount > 1) {
          const label = badge.querySelector('span:not(.__idm_icon__):not(.__idm_close__)');
          if (label) label.textContent = `Download this video (${qualityCount} qualities)`;
        }
      }
    }
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
injectStyles();

// Start observing DOM for video elements
videoObserver.observe(document.documentElement, {
  childList: true,
  subtree: true,
});

// Attach badges to already-present videos
document.querySelectorAll('video').forEach(attachBadgeToVideo);

// Request any already-detected videos from background
chrome.runtime.sendMessage(
  { type: 'get:videos', tabId: undefined },
  (response) => {
    if (response?.videos) {
      for (const v of response.videos as DetectedVideo[]) {
        detectedVideos.set(v.url, v);
      }
      document.querySelectorAll('video').forEach(attachBadgeToVideo);
    }
  }
);
