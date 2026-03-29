import { bridge } from './messaging/bridge';
import { startDownloadInterceptor, onDownloadIntercepted } from './downloadDetector';
import { startVideoDetector, onVideoDetected, getDetectedVideos } from './videoDetector';

// ── Connect to desktop app ────────────────────────────────────────────────────
bridge.connect();

// ── Load settings from storage ────────────────────────────────────────────────
let settings = {
  enabled: true,
  catchAll: true,
  minSize: 0,
  extensions: [] as string[],
};

chrome.storage.sync.get(['idmSettings'], (result) => {
  if (result['idmSettings']) settings = { ...settings, ...result['idmSettings'] };
  if (settings.enabled) {
    startDownloadInterceptor(settings);
    startVideoDetector();
  }
});

// ── Download interception ─────────────────────────────────────────────────────
onDownloadIntercepted((dl) => {
  if (!settings.enabled) return;
  bridge.send('download:add', dl);
  chrome.action.setBadgeText({ text: '↓' });
  chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 2000);
});

// ── Video detection ───────────────────────────────────────────────────────────
onVideoDetected((video) => {
  // Notify popup if open
  chrome.runtime.sendMessage({ type: 'video:detected', data: video }).catch(() => {});
});

// ── Context menu ──────────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'idm-download-link',
    title: 'Download with IDM Clone',
    contexts: ['link'],
  });
  chrome.contextMenus.create({
    id: 'idm-download-page-links',
    title: 'Download all links on page',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'idm-download-link' && info.linkUrl) {
    bridge.send('download:add', {
      url: info.linkUrl,
      referrer: info.pageUrl,
    });
  } else if (info.menuItemId === 'idm-download-page-links' && tab?.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => Array.from(document.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).href),
    }).then((results) => {
      const urls: string[] = results[0]?.result ?? [];
      bridge.send('download:add-batch', { urls, referrer: tab.url });
    });
  }
});

// ── Message handler from popup ────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'get:videos':
      sendResponse({ videos: getDetectedVideos() });
      break;
    case 'download:video':
      bridge.send('download:add', { url: msg.url });
      sendResponse({ ok: true });
      break;
    case 'get:connection':
      sendResponse({ connected: bridge.isConnected() });
      break;
    case 'settings:update':
      settings = { ...settings, ...msg.data };
      chrome.storage.sync.set({ idmSettings: settings });
      sendResponse({ ok: true });
      break;
  }
  return true; // keep message channel open for async
});