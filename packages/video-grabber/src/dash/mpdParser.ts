export interface DashRepresentation {
  id: string;
  bandwidth: number;
  width?: number;
  height?: number;
  codecs?: string;
  mimeType?: string;
  baseUrl?: string;
  // Template-based segmentation
  initialization?: string;
  media?: string;
  startNumber?: number;
  timescale?: number;
  duration?: number;
  // List-based
  segmentUrls?: string[];
}

export interface DashAdaptationSet {
  id: string;
  mimeType?: string;
  contentType?: 'video' | 'audio' | 'text';
  lang?: string;
  representations: DashRepresentation[];
}

export interface DashManifest {
  type: 'static' | 'dynamic';
  mediaPresentationDuration?: number; // seconds
  minBufferTime?: number;
  adaptationSets: DashAdaptationSet[];
  baseUrl?: string;
}

export function parseMPD(xml: string, baseUrl: string): DashManifest {
  // Lightweight XML attribute extractor (avoids heavy DOM dependency in Node)
  const attr = (tag: string, name: string): string | undefined =>
    tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];

  const manifest: DashManifest = {
    type: 'static',
    adaptationSets: [],
    baseUrl,
  };

  // Root MPD attributes
  const mpdMatch = xml.match(/<MPD([^>]*)>/);
  if (mpdMatch) {
    const mpdTag = mpdMatch[1] ?? '';
    manifest.type = attr(mpdTag, 'type') === 'dynamic' ? 'dynamic' : 'static';
    const dur = attr(mpdTag, 'mediaPresentationDuration');
    if (dur) manifest.mediaPresentationDuration = parseIsoDuration(dur);
  }

  // BaseURL
  const baseUrlMatch = xml.match(/<BaseURL[^>]*>([^<]+)<\/BaseURL>/);
  if (baseUrlMatch) manifest.baseUrl = resolveUri(baseUrlMatch[1]!, baseUrl);

  // AdaptationSets
  const adaptationPattern = /<AdaptationSet([^>]*)>([\s\S]*?)<\/AdaptationSet>/g;
  let adaptMatch: RegExpExecArray | null;

  while ((adaptMatch = adaptationPattern.exec(xml)) !== null) {
    const adaptTag = adaptMatch[1] ?? '';
    const adaptContent = adaptMatch[2] ?? '';

    const mimeType = attr(adaptTag, 'mimeType') ?? attr(adaptTag, 'contentType');
    const contentType = mimeType?.includes('video') ? 'video'
      : mimeType?.includes('audio') ? 'audio' : 'text';

    const adaptSet: DashAdaptationSet = {
      id: attr(adaptTag, 'id') ?? String(manifest.adaptationSets.length),
      mimeType,
      contentType: contentType as DashAdaptationSet['contentType'],
      lang: attr(adaptTag, 'lang'),
      representations: [],
    };

    // SegmentTemplate at adaptation level
    const adaptSegTemplate = adaptContent.match(/<SegmentTemplate([^>]*)>/)?.[1];

    // Representations
    const reprPattern = /<Representation([^>]*)>([\s\S]*?)<\/Representation>/g;
    let reprMatch: RegExpExecArray | null;

    while ((reprMatch = reprPattern.exec(adaptContent)) !== null) {
      const reprTag = reprMatch[1] ?? '';
      const reprContent = reprMatch[2] ?? '';
      const segTemplate = reprContent.match(/<SegmentTemplate([^>]*)>/)?.[1] ?? adaptSegTemplate ?? '';

      const repr: DashRepresentation = {
        id: attr(reprTag, 'id') ?? '',
        bandwidth: parseInt(attr(reprTag, 'bandwidth') ?? '0', 10),
        width: attr(reprTag, 'width') ? parseInt(attr(reprTag, 'width')!, 10) : undefined,
        height: attr(reprTag, 'height') ? parseInt(attr(reprTag, 'height')!, 10) : undefined,
        codecs: attr(reprTag, 'codecs'),
        mimeType: attr(reprTag, 'mimeType') ?? mimeType,
        initialization: expandTemplate(attr(segTemplate, 'initialization'), attr(reprTag, 'id')),
        media: attr(segTemplate, 'media'),
        startNumber: parseInt(attr(segTemplate, 'startNumber') ?? '1', 10),
        timescale: parseInt(attr(segTemplate, 'timescale') ?? '1', 10),
        duration: attr(segTemplate, 'duration') ? parseInt(attr(segTemplate, 'duration')!, 10) : undefined,
      };

      adaptSet.representations.push(repr);
    }

    manifest.adaptationSets.push(adaptSet);
  }

  return manifest;
}

export function getBestRepresentation(
  adaptSet: DashAdaptationSet,
  maxBandwidth?: number
): DashRepresentation | undefined {
  const sorted = [...adaptSet.representations].sort((a, b) => b.bandwidth - a.bandwidth);
  if (!maxBandwidth) return sorted[0];
  return sorted.find(r => r.bandwidth <= maxBandwidth) ?? sorted[sorted.length - 1];
}

export function buildSegmentUrls(repr: DashRepresentation, totalDurationSec: number, baseUrl: string): string[] {
  if (!repr.media || !repr.timescale || !repr.duration) return [];
  const segCount = Math.ceil((totalDurationSec * repr.timescale) / repr.duration);
  const start = repr.startNumber ?? 1;
  return Array.from({ length: segCount }, (_, i) =>
    resolveUri(
      (repr.media ?? '').replace('$Number$', String(start + i)).replace('$RepresentationID$', repr.id),
      baseUrl
    )
  );
}

function expandTemplate(template: string | undefined, id: string | undefined): string | undefined {
  if (!template) return undefined;
  return template.replace('$RepresentationID$', id ?? '');
}

function parseIsoDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?/);
  if (!m) return 0;
  return (parseInt(m[1] ?? '0', 10) * 3600) +
         (parseInt(m[2] ?? '0', 10) * 60) +
         parseFloat(m[3] ?? '0');
}

function resolveUri(uri: string, base: string): string {
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  try { return new URL(uri, base).toString(); } catch { return uri; }
}