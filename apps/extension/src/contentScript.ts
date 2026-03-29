import { isDownloadableUrl } from './utils/links';

let tooltip: HTMLElement | null = null;

function createTooltip(): HTMLElement {
  const el = document.createElement('div');
  el.id = '__idm_tooltip__';
  el.style.cssText = `
    position: fixed; z-index: 2147483647;
    background: #2563eb; color: white;
    font: bold 11px/1 sans-serif;
    padding: 4px 8px; border-radius: 4px;
    pointer-events: none; opacity: 0;
    transition: opacity 0.15s; white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  `;
  el.textContent = '⬇ Download with IDM';
  document.body.appendChild(el);
  return el;
}

function getTooltip(): HTMLElement {
  if (!tooltip || !document.contains(tooltip)) tooltip = createTooltip();
  return tooltip;
}

document.addEventListener('mouseover', (e) => {
  const anchor = (e.target as Element).closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return;
  const href = anchor.href;
  if (!isDownloadableUrl(href)) return;

  const tip = getTooltip();
  const rect = anchor.getBoundingClientRect();
  tip.style.left = `${rect.left}px`;
  tip.style.top = `${rect.bottom + 4}px`;
  tip.style.opacity = '1';

  anchor.addEventListener('click', (ev) => {
    const url = anchor.href;
    if (!isDownloadableUrl(url)) return;
    ev.preventDefault();
    ev.stopPropagation();
    chrome.runtime.sendMessage({ type: 'download:video', url });
  }, { once: true });
}, { passive: true });

document.addEventListener('mouseout', (e) => {
  const anchor = (e.target as Element).closest('a[href]');
  if (!anchor) return;
  const tip = getTooltip();
  tip.style.opacity = '0';
}, { passive: true });