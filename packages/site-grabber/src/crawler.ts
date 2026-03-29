import { EventEmitter } from 'events';
import * as https from 'https';
import * as http from 'http';
import { extractLinks } from './linkExtractor';
import { DepthController } from './depthController';
import { passesFilter } from './filter';
import type { GrabFilter } from './filter';

export interface CrawlerOptions {
  startUrl: string;
  maxDepth?: number;
  maxPages?: number;
  stayOnDomain?: boolean;
  filter?: GrabFilter;
  concurrency?: number;
  headers?: Record<string, string>;
}

export interface CrawlResult {
  pageUrl: string;
  depth: number;
  downloadUrls: string[];
  pageUrls: string[];
  error?: string;
}

export class Crawler extends EventEmitter {
  private depth: DepthController;
  private opts: Required<CrawlerOptions>;
  private stopped = false;
  private pageCount = 0;

  constructor(opts: CrawlerOptions) {
    super();
    this.opts = {
      startUrl: opts.startUrl,
      maxDepth: opts.maxDepth ?? 3,
      maxPages: opts.maxPages ?? 500,
      stayOnDomain: opts.stayOnDomain ?? true,
      filter: opts.filter ?? {},
      concurrency: opts.concurrency ?? 4,
      headers: opts.headers ?? { 'User-Agent': 'IDM-Clone-Grabber/1.0' },
    };
    this.depth = new DepthController(this.opts.maxDepth);
  }

  async crawl(): Promise<string[]> {
    const allDownloads: string[] = [];
    const queue: Array<{ url: string; depth: number }> = [{ url: this.opts.startUrl, depth: 0 }];

    while (queue.length > 0 && !this.stopped) {
      if (this.pageCount >= this.opts.maxPages) break;

      // Process up to `concurrency` pages in parallel
      const batch = queue.splice(0, this.opts.concurrency);
      const results = await Promise.allSettled(batch.map(({ url, depth }) => this.processPage(url, depth)));

      for (const result of results) {
        if (result.status !== 'fulfilled') continue;
        const { downloadUrls, pageUrls, depth, pageUrl } = result.value;

        for (const dl of downloadUrls) {
          if (passesFilter(dl, this.opts.filter)) {
            allDownloads.push(dl);
            this.emit('download-found', dl);
          }
        }

        for (const pageUrl of pageUrls) {
          const nextDepth = depth + 1;
          if (
            nextDepth <= this.opts.maxDepth &&
            this.depth.canVisit(pageUrl, nextDepth) &&
            this.depth.shouldFollowLink(pageUrl, this.opts.startUrl, this.opts.stayOnDomain)
          ) {
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

  stop(): void {
    this.stopped = true;
  }

  private async processPage(url: string, depth: number): Promise<CrawlResult> {
    this.depth.markVisited(url, depth);
    this.pageCount++;

    try {
      const html = await this.fetchPage(url);
      const links = extractLinks(html, url);
      const downloadUrls = links.filter(l => l.type === 'download' || l.type === 'media').map(l => l.url);
      const pageUrls = links.filter(l => l.type === 'page').map(l => l.url);
      return { pageUrl: url, depth, downloadUrls, pageUrls };
    } catch (err: any) {
      return { pageUrl: url, depth, downloadUrls: [], pageUrls: [], error: err?.message };
    }
  }

  private fetchPage(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(
        { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers: this.opts.headers },
        (res) => {
          // Follow redirects
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            resolve(this.fetchPage(new URL(res.headers.location, url).toString()));
            req.destroy();
            return;
          }
          if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
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
        }
      );
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    });
  }
}