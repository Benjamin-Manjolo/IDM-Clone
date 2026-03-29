export interface HlsSegment {
  uri: string;
  duration: number;
  sequence: number;
  key?: { method: string; uri: string; iv?: string };
}

export interface HlsVariant {
  uri: string;
  bandwidth: number;
  resolution?: string;
  codecs?: string;
  frameRate?: number;
}

export interface HlsPlaylist {
  isMedia: boolean;       // true = segment list, false = master playlist
  isMaster: boolean;
  targetDuration: number;
  mediaSequence: number;
  endList: boolean;
  segments: HlsSegment[];
  variants: HlsVariant[];
  baseUrl: string;
}

export function parseM3U8(content: string, baseUrl: string): HlsPlaylist {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  const playlist: HlsPlaylist = {
    isMedia: false, isMaster: false, targetDuration: 0,
    mediaSequence: 0, endList: false, segments: [], variants: [], baseUrl,
  };

  let currentKey: HlsSegment['key'] | undefined;
  let currentDuration = 0;
  let sequence = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('#EXT-X-STREAM-INF')) {
      playlist.isMaster = true;
      const bw = line.match(/BANDWIDTH=(\d+)/)?.[1];
      const res = line.match(/RESOLUTION=([\dx]+)/)?.[1];
      const codecs = line.match(/CODECS="([^"]+)"/)?.[1];
      const fps = line.match(/FRAME-RATE=([\d.]+)/)?.[1];
      const uri = resolveUri(lines[i + 1] ?? '', baseUrl);
      playlist.variants.push({
        uri, bandwidth: parseInt(bw ?? '0', 10),
        resolution: res, codecs, frameRate: fps ? parseFloat(fps) : undefined,
      });
      i++;
    } else if (line.startsWith('#EXTINF')) {
      playlist.isMedia = true;
      const dur = line.match(/#EXTINF:([\d.]+)/)?.[1];
      currentDuration = parseFloat(dur ?? '0');
    } else if (line.startsWith('#EXT-X-KEY')) {
      const method = line.match(/METHOD=([^,]+)/)?.[1] ?? 'NONE';
      const uri = line.match(/URI="([^"]+)"/)?.[1];
      const iv = line.match(/IV=([^,]+)/)?.[1];
      currentKey = uri ? { method, uri: resolveUri(uri, baseUrl), iv } : undefined;
    } else if (line === '#EXT-X-ENDLIST') {
      playlist.endList = true;
    } else if (line.startsWith('#EXT-X-TARGETDURATION')) {
      playlist.targetDuration = parseInt(line.split(':')[1] ?? '0', 10);
    } else if (line.startsWith('#EXT-X-MEDIA-SEQUENCE')) {
      sequence = parseInt(line.split(':')[1] ?? '0', 10);
      playlist.mediaSequence = sequence;
    } else if (!line.startsWith('#')) {
      playlist.segments.push({
        uri: resolveUri(line, baseUrl),
        duration: currentDuration,
        sequence: sequence++,
        key: currentKey,
      });
      currentDuration = 0;
    }
  }
  return playlist;
}

function resolveUri(uri: string, base: string): string {
  if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
  try {
    return new URL(uri, base).toString();
  } catch {
    return uri;
  }
}
