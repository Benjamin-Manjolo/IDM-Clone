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
exports.HttpProtocol = void 0;
const events_1 = require("events");
const http = __importStar(require("http"));
const https = __importStar(require("https"));
const fs = __importStar(require("fs"));
class HttpProtocol extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.activeRequests = new Map();
    }
    async probe(url, headers) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;
            const req = lib.request({ method: 'HEAD', hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname + parsedUrl.search, headers: { ...headers, 'Range': 'bytes=0-0' } }, (res) => {
                const contentLength = parseInt(res.headers['content-length'] ?? '-1', 10);
                const resumable = res.headers['accept-ranges'] === 'bytes' || res.statusCode === 206;
                const disposition = res.headers['content-disposition'] ?? '';
                const filenameMatch = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
                const filename = filenameMatch ? filenameMatch[1]?.replace(/['"]/g, '') : undefined;
                const mimeType = res.headers['content-type']?.split(';')[0];
                resolve({ contentLength, resumable, filename, mimeType });
                req.destroy();
            });
            req.on('error', reject);
            req.setTimeout(10000, () => { req.destroy(); reject(new Error('HEAD request timed out')); });
            req.end();
        });
    }
    async downloadSegment(options) {
        const { url, destPath, segment, headers = {}, cookies, timeout = 30000, onProgress } = options;
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const lib = parsedUrl.protocol === 'https:' ? https : http;
            const reqHeaders = {
                ...headers,
                'Range': `bytes=${segment.start + segment.downloaded}-${segment.end}`,
                'User-Agent': 'IDM-Clone/1.0',
            };
            if (cookies)
                reqHeaders['Cookie'] = cookies;
            const req = lib.get({ hostname: parsedUrl.hostname, port: parsedUrl.port, path: parsedUrl.pathname + parsedUrl.search, headers: reqHeaders }, (res) => {
                if (res.statusCode !== 206 && res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
                    return;
                }
                const offset = segment.start + segment.downloaded;
                const fd = fs.openSync(destPath, 'r+');
                let position = offset;
                res.on('data', (chunk) => {
                    fs.writeSync(fd, chunk, 0, chunk.length, position);
                    position += chunk.length;
                    onProgress?.(chunk.length);
                });
                res.on('end', () => {
                    fs.closeSync(fd);
                    resolve();
                });
                res.on('error', (err) => {
                    fs.closeSync(fd);
                    reject(err);
                });
            });
            req.on('error', reject);
            req.setTimeout(timeout, () => {
                req.destroy();
                reject(new Error('Connection timed out'));
            });
            this.activeRequests.set(segment.id, req);
        });
    }
    cancelSegment(segmentId) {
        const req = this.activeRequests.get(segmentId);
        if (req) {
            req.destroy();
            this.activeRequests.delete(segmentId);
        }
    }
    cancelAll() {
        this.activeRequests.forEach(req => req.destroy());
        this.activeRequests.clear();
    }
}
exports.HttpProtocol = HttpProtocol;
//# sourceMappingURL=http.js.map