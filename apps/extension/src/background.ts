/**
 * IDM Clone Extension - Background Service Worker
 *
 * Implements IDM's hybrid architecture:
 * 1. onBeforeRequest  → intercept file downloads early, cancel browser download
 * 2. onHeadersReceived → detect Content-Disposition: attachment, MIME type checks
 * 3. onResponseStarted → streaming heuristics (sequential chunks, video MIME)
 * 4. Video badge injection via content scripts
 * 5. WebSocket bridge to desktop app (native process equivalent)
 */

import { bridge } from './messaging/bridge';
import { startDownloadInterceptor, onDownloadIntercepted } from './downloadDetector';
import { startVideoDetector, onVideoDetected, getDetectedVideos, clearVideosForTab } from './videoDetector';
import type { InterceptedDownload } from './downloadDetector';
import type { DetectedVideo, VideoQuality } from './videoDetector';

// ── Settings ──────────────────────────────────────────────────────────────────
interface ExtSettings {
  enabled: boolean;
  catchAll: boolean;
  minSize: number;
  extensions: string[];
  autoOpenApp: boolean;
  showBadgeOnVideos: boolean;
  preferredQuality: 'best' | 'worst' | number;
}

const DEFAULT_SETTINGS: ExtSettings = {
  enabled: true,
  catchAll: true,
  minSize: 0,
  extensions: [],
  autoOpenApp: false,
  showBadgeOnVideos: true,
  preferredQuality: 'best',
};

let settings: ExtSettings = { ...DEFAULT_SETTINGS };

// ── Boot ──────────────────────────────────────────────────────────────────────
bridge.connect();

chrome.storage.sync.get(['idmSettings'], (result) => {
  if (result['idmSettings']) {
    settings = { ...DEFAULT_SETTINGS, ...result['idmSettings'] };
  }
  if (settings.enabled) {
    startDownloadInterceptor(settings);
    startVideoDetector();
  }
});

// ── Download interception ─────────────────────────────────────────────────────
onDownloadIntercepted((dl: InterceptedDownload) => {
  if (!settings.enabled) return;

  bridge.send('download:add', {
    url: dl.url,
    filename: dl.filename,
    referrer: dl.referrer,
    cookies: dl.cookies,
    fileSize: dl.fileSize,
    mimeType: dl.mimeType,
    headers: dl.headers,
  });

  // Flash badge
  chrome.action.setBadgeText({ text: '↓' });
  chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
});

// ── Video detection ───────────────────────────────────────────────────────────
onVideoDetected((video: DetectedVideo) => {
  if (!settings.showBadgeOnVideos) return;

  // Notify the content script in that tab to show the floating badge
  chrome.tabs.sendMessage(video.tabId, {
    type: 'video:detected',
    data: video,
  }).catch(() => { /* tab may not have content script */ });

  // Notify popup if open
  chrome.runtime.sendMessage({ type: 'video:detected', data: video }).catch(() => {});

  // Update action badge with count
  getDetectedVideos().then(videos => {
    const tabVideos = videos.filter(v => v.tabId === video.tabId);
    if (tabVideos.length > 0) {
      chrome.action.setBadgeText({ text: String(tabVideos.length), tabId: video.tabId });
      chrome.action.setBadgeBackgroundColor({ color: '#dc2626', tabId: video.tabId });
    }
  });
});

// ── Context menu ──────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'idm-download-link',
    title: '⬇ Download with IDM Clone',
    contexts: ['link'],
  });

  chrome.contextMenus.create({
    id: 'idm-download-video',
    title: '🎬 Download video with IDM Clone',
    contexts: ['video'],
  });

  chrome.contextMenus.create({
    id: 'idm-download-audio',
    title: '🎵 Download audio with IDM Clone',
    contexts: ['audio'],
  });

  chrome.contextMenus.create({
    id: 'idm-download-page-links',
    title: '📥 Download all links on this page',
    contexts: ['page'],
  });

  chrome.contextMenus.create({
    id: 'idm-separator',
    type: 'separator',
    contexts: ['link', 'page'],
  });

  chrome.contextMenus.create({
    id: 'idm-settings',
    title: '⚙ IDM Clone Settings',
    contexts: ['action'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'idm-download-link' && info.linkUrl) {
    bridge.send('download:add', {
      url: info.linkUrl,
      referrer: info.pageUrl,
    });
  } else if (
    (info.menuItemId === 'idm-download-video' || info.menuItemId === 'idm-download-audio') &&
    info.srcUrl
  ) {
    bridge.send('download:add', {
      url: info.srcUrl,
      referrer: info.pageUrl,
    });
  } else if (info.menuItemId === 'idm-download-page-links' && tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () =>
        Array.from(document.querySelectorAll('a[href]')).map(
          (a) => (a as HTMLAnchorElement).href
        ),
    }).then((results) => {
      const urls: string[] = results[0]?.result ?? [];
      bridge.send('download:add-batch', { urls, referrer: tab.url });
    });
  }
});

// ── Tab events — clear video cache on navigation ──────────────────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    clearVideosForTab(tabId);
    // Clear badge for this tab
    chrome.action.setBadgeText({ text: '', tabId }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  clearVideosForTab(tabId);
});

// ── Message handler from popup / content scripts ──────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'get:videos':
      getDetectedVideos().then(videos => {
        const tabId = msg.tabId ?? sender.tab?.id;
        const filtered = tabId != null ? videos.filter(v => v.tabId === tabId) : videos;
        sendResponse({ videos: filtered });
      });
      return true; // async

    case 'get:all-videos':
      getDetectedVideos().then(videos => sendResponse({ videos }));
      return true;

    case 'download:video':
      if (msg.url) {
        bridge.send('download:add', {
          url: msg.url,
          quality: msg.quality,
          title: msg.title,
          referrer: msg.referrer,
        });
      }
      sendResponse({ ok: true });
      break;

    case 'download:video-quality': {
      // User selected a specific quality from the badge menu
      const { url, quality, title, referrer, videoId } = msg;
      bridge.send('download:add', { url, quality, title, referrer, videoId });
      sendResponse({ ok: true });
      break;
    }

    case 'get:connection':
      sendResponse({ connected: bridge.isConnected() });
      break;

    case 'settings:update':
      settings = { ...settings, ...msg.data };
      chrome.storage.sync.set({ idmSettings: settings });
      sendResponse({ ok: true });
      break;

    case 'settings:get':
      sendResponse({ settings });
      break;

    case 'badge:request-qualities': {
      // Content script asks for available qualities for a detected video
      const tabId = sender.tab?.id;
      if (tabId != null) {
        getDetectedVideos().then(videos => {
          const video = videos.find(v => v.url === msg.url && v.tabId === tabId);
          sendResponse({ qualities: video?.qualities ?? [], video });
        });
      } else {
        sendResponse({ qualities: [] });
      }
      return true;
    }

    case 'open:app':
      // Open the desktop app window via bridge
      bridge.send('app:focus', {});
      sendResponse({ ok: true });
      break;
  }
  return true;
});

// ── Bridge → renderer event forwarding ───────────────────────────────────────
bridge.on('download:added', (data) => {
  chrome.runtime.sendMessage({ type: 'download:added', data }).catch(() => {});
});

bridge.on('download:progress', (data) => {
  chrome.runtime.sendMessage({ type: 'download:progress', data }).catch(() => {});
});

bridge.on('download:completed', (data) => {
  chrome.runtime.sendMessage({ type: 'download:completed', data }).catch(() => {});
  // Show notification
  chrome.notifications?.create({
    type: 'basic',
    iconUrl: 'icon48.png',
    title: 'Download Complete',
    message: `File downloaded successfully`,
  });
});
