import type { IpcMain } from 'electron';
import { Crawler, buildFilterFromStrings } from '@idm/site-grabber';

interface GrabberStartArgs {
  url: string;
  maxDepth?: number;
  stayOnDomain?: boolean;
  includeExt?: string;
  excludeExt?: string;
}

export function setupGrabberIpc(ipc: IpcMain): void {
  ipc.handle('grabber:start', async (event, args: GrabberStartArgs) => {
    const { includeExtensions, excludeExtensions } = buildFilterFromStrings(
      args.includeExt ?? '',
      args.excludeExt ?? ''
    );

    const crawler = new Crawler({
      startUrl: args.url,
      maxDepth: args.maxDepth ?? 2,
      stayOnDomain: args.stayOnDomain ?? true,
      filter: { includeExtensions, excludeExtensions },
      concurrency: 4,
    });

    let pagesVisited = 0;
    crawler.on('page-done', (payload) => {
      pagesVisited += 1;
      event.sender.send('grabber:progress', {
        pagesVisited,
        pageUrl: payload.url,
        depth: payload.depth,
        found: payload.found,
      });
    });
    crawler.on('download-found', (url: string) => {
      event.sender.send('grabber:found', { url });
    });

    const urls = await crawler.crawl();
    return {
      pagesVisited,
      urls: Array.from(new Set(urls)),
    };
  });
}

