/**
 * packages/video-grabber/src/browser-shim.ts
 *
 * Browser-safe stub for @idm/video-grabber.
 */

export function parseM3U8(_content: string, _baseUrl: string) {
  return { isMedia: false, isMaster: false, segments: [], variants: [], targetDuration: 0, mediaSequence: 0, endList: false, baseUrl: _baseUrl };
}
export function downloadHlsSegment() { return Promise.resolve(); }
export function mergeHlsSegments() { return Promise.resolve(); }
export function getTempSegmentPath(_base: string, _id: string, _seq: number) { return ''; }
export function parseMPD(_xml: string, baseUrl: string) { return { type: 'static' as const, adaptationSets: [], baseUrl }; }
export function getBestRepresentation() { return undefined; }
export function buildSegmentUrls() { return []; }
export class DashDownloader {}
export class MediaDetector {}
export function selectHlsVariant() { return undefined; }
export function selectDashRepresentation() { return undefined; }
export function describeQuality() { return ''; }
