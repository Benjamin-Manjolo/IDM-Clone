import * as https from 'https';
import * as http from 'http';

export type MediaType = 'hls' | 'dash' | 'direct-video' | 'direct-audio' | 'unknown';

export interface DetectedMedia {
  url: string;
  type: MediaType;
  mimeType?: string;
  filename?: string;
}

const HLS_MIME_TYPES = ['application/vnd.apple.mpegurl', 'application/x-mpegurl', 'audio/mpegurl'];
const DASH_MIME_TYPES = ['application/dash+xml'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-matroska', 'video/quicktime'];
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/webm'];

export class MediaDetector {
  async detect(url: string, headers?: Record<string, string>): Promise<DetectedMedia> {
    const lower = url.toLowerCase();

    // Extension sniffing
    if (lower.includes('.m3u8')) return { url, type: 'hls' };
    if (lower.includes('.mpd')) return { url, type: 'dash' };

    // HEAD request for Content-Type
    try {
      const info = await this.headRequest(url, headers);
      const mime = (info.contentType ?? '').split(';')[0]!.trim().toLowerCase();

      if (HLS_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'hls', mimeType: mime };
      if (DASH_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'dash', mimeType: mime };
      if (VIDEO_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'direct-video', mimeType: mime, filename: info.filename };
      if (AUDIO_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'direct-audio', mimeType: mime, filename: info.filename };
    } catch {}

    return { url, type: 'unknown' };
  }

  detectFromHeaders(responseHeaders: Record<string, string>, url: string): DetectedMedia {
    const mime = (responseHeaders['content-type'] ?? '').split(';')[0]!.trim().toLowerCase();
    if (HLS_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'hls', mimeType: mime };
    if (DASH_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'dash', mimeType: mime };
    if (VIDEO_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'direct-video', mimeType: mime };
    if (AUDIO_MIME_TYPES.some(m => mime.includes(m))) return { url, type: 'direct-audio', mimeType: mime };
    return { url, type: 'unknown', mimeType: mime };
  }

  private headRequest(url: string, headers?: Record<string, string>): Promise<{ contentType?: string; filename?: string }> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        { method: 'HEAD', hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers },
        (res) => {
          const contentType = res.headers['content-type'];
          const disposition = res.headers['content-disposition'] ?? '';
          const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
          const filename = filenameMatch?.[1]?.replace(/['"]/g, '');
          resolve({ contentType, filename });
          req.destroy();
        }
      );
      req.on('error', reject);
      req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
  }
}
