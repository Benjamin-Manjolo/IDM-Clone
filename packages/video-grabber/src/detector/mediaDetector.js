"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaDetector = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const HLS_MIME_TYPES = ['application/vnd.apple.mpegurl', 'application/x-mpegurl', 'audio/mpegurl'];
const DASH_MIME_TYPES = ['application/dash+xml'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/x-matroska', 'video/quicktime'];
const AUDIO_MIME_TYPES = ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/webm'];
class MediaDetector {
    async detect(url, headers) {
        const lower = url.toLowerCase();
        // Extension sniffing
        if (lower.includes('.m3u8'))
            return { url, type: 'hls' };
        if (lower.includes('.mpd'))
            return { url, type: 'dash' };
        // HEAD request for Content-Type
        try {
            const info = await this.headRequest(url, headers);
            const mime = (info.contentType ?? '').split(';')[0].trim().toLowerCase();
            if (HLS_MIME_TYPES.some(m => mime.includes(m)))
                return { url, type: 'hls', mimeType: mime };
            if (DASH_MIME_TYPES.some(m => mime.includes(m)))
                return { url, type: 'dash', mimeType: mime };
            if (VIDEO_MIME_TYPES.some(m => mime.includes(m)))
                return { url, type: 'direct-video', mimeType: mime, filename: info.filename };
            if (AUDIO_MIME_TYPES.some(m => mime.includes(m)))
                return { url, type: 'direct-audio', mimeType: mime, filename: info.filename };
        }
        catch { }
        return { url, type: 'unknown' };
    }
    detectFromHeaders(responseHeaders, url) {
        const mime = (responseHeaders['content-type'] ?? '').split(';')[0].trim().toLowerCase();
        if (HLS_MIME_TYPES.some(m => mime.includes(m)))
            return { url, type: 'hls', mimeType: mime };
        if (DASH_MIME_TYPES.some(m => mime.includes(m)))
            return { url, type: 'dash', mimeType: mime };
        if (VIDEO_MIME_TYPES.some(m => mime.includes(m)))
            return { url, type: 'direct-video', mimeType: mime };
        if (AUDIO_MIME_TYPES.some(m => mime.includes(m)))
            return { url, type: 'direct-audio', mimeType: mime };
        return { url, type: 'unknown', mimeType: mime };
    }
    headRequest(url, headers) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const lib = parsed.protocol === 'https:' ? https : http;
            const req = lib.request({ method: 'HEAD', hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers }, (res) => {
                const contentType = res.headers['content-type'];
                const disposition = res.headers['content-disposition'] ?? '';
                const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
                const filename = filenameMatch?.[1]?.replace(/['"]/g, '');
                resolve({ contentType, filename });
                req.destroy();
            });
            req.on('error', reject);
            req.setTimeout(8000, () => { req.destroy(); reject(new Error('timeout')); });
            req.end();
        });
    }
}
exports.MediaDetector = MediaDetector;
