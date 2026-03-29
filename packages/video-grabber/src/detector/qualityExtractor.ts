import type { HlsVariant } from '../hls/m3u8Parser';
import type { DashRepresentation } from '../dash/mpdParser';

export type QualityPreference = 'best' | 'worst' | number; // number = max height (e.g. 1080)

export function selectHlsVariant(
  variants: HlsVariant[],
  preference: QualityPreference = 'best'
): HlsVariant | undefined {
  if (!variants.length) return undefined;

  const sorted = [...variants].sort((a, b) => b.bandwidth - a.bandwidth);

  if (preference === 'best') return sorted[0];
  if (preference === 'worst') return sorted[sorted.length - 1];

  // Pick closest resolution without exceeding
  const maxH = preference;
  const withRes = sorted.filter(v => {
    const h = parseHeight(v.resolution);
    return h !== null && h <= maxH;
  });
  return withRes[0] ?? sorted[sorted.length - 1];
}

export function selectDashRepresentation(
  reprs: DashRepresentation[],
  preference: QualityPreference = 'best'
): DashRepresentation | undefined {
  if (!reprs.length) return undefined;
  const sorted = [...reprs].sort((a, b) => b.bandwidth - a.bandwidth);
  if (preference === 'best') return sorted[0];
  if (preference === 'worst') return sorted[sorted.length - 1];

  const maxH = preference;
  const filtered = sorted.filter(r => r.height !== undefined && r.height <= maxH);
  return filtered[0] ?? sorted[sorted.length - 1];
}

export function describeQuality(variant: HlsVariant): string {
  const h = parseHeight(variant.resolution);
  if (h) return `${h}p (${formatBitrate(variant.bandwidth)})`;
  return formatBitrate(variant.bandwidth);
}

function parseHeight(resolution?: string): number | null {
  if (!resolution) return null;
  const m = resolution.match(/\d+x(\d+)/);
  return m ? parseInt(m[1]!, 10) : null;
}

function formatBitrate(bps: number): string {
  if (bps >= 1_000_000) return `${(bps / 1_000_000).toFixed(1)} Mbps`;
  return `${Math.round(bps / 1000)} Kbps`;
}
