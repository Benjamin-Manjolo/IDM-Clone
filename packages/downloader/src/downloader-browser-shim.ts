/**
 * packages/downloader/src/browser-shim.ts
 *
 * Browser-safe stub for @idm/downloader.
 * The renderer never uses any downloader classes directly — it talks to the
 * main process via window.idm IPC. All Node.js code (fs, http, net, etc.)
 * lives in the main process only.
 */

export class DownloadManager {}
export class SegmentManager {}
export class ChunkAllocator {
  static detectProtocol(_url: string) { return 'http' as const; }
}
export class ProgressTracker {}
export class ResumeManager {}
export class HttpProtocol {}
export class FtpProtocol {}
export class SpeedLimiter {}

export function parseMagnetUri(_uri: string) { return { infoHash: '', trackers: [], webSeeds: [] }; }
export function isMagnetUri(_url: string) { return false; }
export function withRetry<T>(fn: () => Promise<T>) { return fn(); }
export function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }
export function computeChecksum() { return Promise.resolve(''); }
export function verifyChecksum() { return Promise.resolve(false); }
export function preallocate() {}
export function resolveConflict(_p: string) { return _p; }
export function ensureDir() {}
