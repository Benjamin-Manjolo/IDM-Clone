export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes < 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(decimals))} ${sizes[idx]}`;
}

export function formatSpeed(bps: number): string {
  if (bps <= 0) return '—';
  return `${formatBytes(bps, 1)}/s`;
}

export function formatTime(seconds: number): string {
  if (seconds < 0 || !isFinite(seconds)) return '—';
  if (seconds < 60)  return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function formatPercent(downloaded: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((downloaded / total) * 100));
}

export function formatDate(ts: number): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

export function formatShortDate(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  const ext = str.includes('.') ? '.' + str.split('.').pop() : '';
  const base = str.slice(0, maxLen - ext.length - 3);
  return `${base}...${ext}`;
}