"use strict";
/**
 * Magnet link handler.
 * Full BitTorrent implementation would require a DHT + peer-wire protocol stack.
 * This module parses magnet URIs and provides metadata extraction.
 * For actual torrent downloading, integrate a library like webtorrent.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseMagnetUri = parseMagnetUri;
exports.isMagnetUri = isMagnetUri;
function parseMagnetUri(uri) {
    const url = new URL(uri);
    if (url.protocol !== 'magnet:')
        throw new Error('Not a magnet URI');
    const params = new URLSearchParams(url.search);
    const xt = params.get('xt') ?? '';
    const infoHash = xt.replace('urn:btih:', '').toLowerCase();
    const displayName = params.get('dn') ?? undefined;
    const trackers = params.getAll('tr');
    const webSeeds = params.getAll('ws');
    return { infoHash, displayName, trackers, webSeeds };
}
function isMagnetUri(url) {
    try {
        return new URL(url).protocol === 'magnet:';
    }
    catch {
        return false;
    }
}
