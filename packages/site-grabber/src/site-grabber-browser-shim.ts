/**
 * packages/site-grabber/src/browser-shim.ts
 *
 * Browser-safe stub for @idm/site-grabber.
 */

export class Crawler {}
export class DepthController {}
export function extractLinks(_html: string, _base: string) { return []; }
export function passesFilter(_url: string) { return true; }
export function buildFilterFromStrings() { return {}; }
