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
exports.DashDownloader = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const mpdParser_1 = require("./mpdParser");
class DashDownloader {
    async download(opts) {
        const { mpdUrl, outputPath, maxBandwidth, headers = {}, onProgress } = opts;
        // Fetch and parse manifest
        const mpdContent = await this.fetch(mpdUrl, headers);
        const manifest = (0, mpdParser_1.parseMPD)(mpdContent, mpdUrl);
        const videoAdapt = manifest.adaptationSets.find(a => a.contentType === 'video');
        const audioAdapt = manifest.adaptationSets.find(a => a.contentType === 'audio');
        if (!videoAdapt)
            throw new Error('No video adaptation set found in MPD');
        const videoRepr = (0, mpdParser_1.getBestRepresentation)(videoAdapt, maxBandwidth);
        if (!videoRepr)
            throw new Error('No suitable video representation found');
        const totalDur = manifest.mediaPresentationDuration ?? 0;
        const videoSegments = (0, mpdParser_1.buildSegmentUrls)(videoRepr, totalDur, manifest.baseUrl ?? mpdUrl);
        const tmpDir = path.join(path.dirname(outputPath), '.dash-tmp');
        fs.mkdirSync(tmpDir, { recursive: true });
        // Download initialization segment
        if (videoRepr.initialization) {
            const initPath = path.join(tmpDir, 'init.mp4');
            await this.downloadSegment(videoRepr.initialization, initPath, headers);
        }
        let downloaded = 0;
        const total = videoSegments.length;
        for (let i = 0; i < videoSegments.length; i++) {
            const segPath = path.join(tmpDir, `seg-${String(i).padStart(6, '0')}.m4s`);
            await this.downloadSegment(videoSegments[i], segPath, headers);
            downloaded++;
            onProgress?.(downloaded, total);
        }
        // Concatenate init + segments
        await this.concatenate(tmpDir, outputPath);
        // Cleanup
        try {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
        catch { }
    }
    fetch(url, headers) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const lib = parsed.protocol === 'https:' ? https : http;
            lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => resolve(data));
                res.on('error', reject);
            }).on('error', reject);
        });
    }
    downloadSegment(url, destPath, headers) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const lib = parsed.protocol === 'https:' ? https : http;
            lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers }, (res) => {
                const stream = fs.createWriteStream(destPath);
                res.pipe(stream);
                stream.on('finish', resolve);
                stream.on('error', reject);
                res.on('error', reject);
            }).on('error', reject);
        });
    }
    async concatenate(tmpDir, outputPath) {
        const files = fs.readdirSync(tmpDir).sort().map(f => path.join(tmpDir, f));
        const out = fs.createWriteStream(outputPath);
        for (const file of files) {
            await new Promise((resolve, reject) => {
                const inp = fs.createReadStream(file);
                inp.pipe(out, { end: false });
                inp.on('end', resolve);
                inp.on('error', reject);
            });
        }
        await new Promise((resolve, reject) => {
            out.end();
            out.on('finish', resolve);
            out.on('error', reject);
        });
    }
}
exports.DashDownloader = DashDownloader;
