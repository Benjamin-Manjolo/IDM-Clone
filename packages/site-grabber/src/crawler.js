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
exports.Crawler = void 0;
const events_1 = require("events");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const linkExtractor_1 = require("./linkExtractor");
const depthController_1 = require("./depthController");
const filter_1 = require("./filter");
class Crawler extends events_1.EventEmitter {
    constructor(opts) {
        super();
        this.stopped = false;
        this.pageCount = 0;
        this.opts = {
            startUrl: opts.startUrl,
            maxDepth: opts.maxDepth ?? 3,
            maxPages: opts.maxPages ?? 500,
            stayOnDomain: opts.stayOnDomain ?? true,
            filter: opts.filter ?? {},
            concurrency: opts.concurrency ?? 4,
            headers: opts.headers ?? { 'User-Agent': 'IDM-Clone-Grabber/1.0' },
        };
        this.depth = new depthController_1.DepthController(this.opts.maxDepth);
    }
    async crawl() {
        const allDownloads = [];
        const queue = [{ url: this.opts.startUrl, depth: 0 }];
        while (queue.length > 0 && !this.stopped) {
            if (this.pageCount >= this.opts.maxPages)
                break;
            // Process up to `concurrency` pages in parallel
            const batch = queue.splice(0, this.opts.concurrency);
            const results = await Promise.allSettled(batch.map(({ url, depth }) => this.processPage(url, depth)));
            for (const result of results) {
                if (result.status !== 'fulfilled')
                    continue;
                const { downloadUrls, pageUrls, depth, pageUrl } = result.value;
                for (const dl of downloadUrls) {
                    if ((0, filter_1.passesFilter)(dl, this.opts.filter)) {
                        allDownloads.push(dl);
                        this.emit('download-found', dl);
                    }
                }
                for (const pageUrl of pageUrls) {
                    const nextDepth = depth + 1;
                    if (nextDepth <= this.opts.maxDepth &&
                        this.depth.canVisit(pageUrl, nextDepth) &&
                        this.depth.shouldFollowLink(pageUrl, this.opts.startUrl, this.opts.stayOnDomain)) {
                        queue.push({ url: pageUrl, depth: nextDepth });
                        this.depth.markVisited(pageUrl, nextDepth);
                    }
                }
                this.emit('page-done', { url: pageUrl, depth, found: downloadUrls.length });
            }
        }
        this.emit('done', allDownloads);
        return allDownloads;
    }
    stop() {
        this.stopped = true;
    }
    async processPage(url, depth) {
        this.depth.markVisited(url, depth);
        this.pageCount++;
        try {
            const html = await this.fetchPage(url);
            const links = (0, linkExtractor_1.extractLinks)(html, url);
            const downloadUrls = links.filter(l => l.type === 'download' || l.type === 'media').map(l => l.url);
            const pageUrls = links.filter(l => l.type === 'page').map(l => l.url);
            return { pageUrl: url, depth, downloadUrls, pageUrls };
        }
        catch (err) {
            return { pageUrl: url, depth, downloadUrls: [], pageUrls: [], error: err?.message };
        }
    }
    fetchPage(url) {
        return new Promise((resolve, reject) => {
            const parsed = new URL(url);
            const lib = parsed.protocol === 'https:' ? https : http;
            const req = lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers: this.opts.headers }, (res) => {
                // Follow redirects
                if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    resolve(this.fetchPage(new URL(res.headers.location, url).toString()));
                    req.destroy();
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                const ct = res.headers['content-type'] ?? '';
                if (!ct.includes('text/html') && !ct.includes('text/plain')) {
                    reject(new Error('Not HTML'));
                    return;
                }
                let data = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => resolve(data));
                res.on('error', reject);
            });
            req.on('error', reject);
            req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
        });
    }
}
exports.Crawler = Crawler;
