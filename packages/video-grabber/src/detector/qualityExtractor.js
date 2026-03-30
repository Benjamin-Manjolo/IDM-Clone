"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectHlsVariant = selectHlsVariant;
exports.selectDashRepresentation = selectDashRepresentation;
exports.describeQuality = describeQuality;
function selectHlsVariant(variants, preference = 'best') {
    if (!variants.length)
        return undefined;
    const sorted = [...variants].sort((a, b) => b.bandwidth - a.bandwidth);
    if (preference === 'best')
        return sorted[0];
    if (preference === 'worst')
        return sorted[sorted.length - 1];
    // Pick closest resolution without exceeding
    const maxH = preference;
    const withRes = sorted.filter(v => {
        const h = parseHeight(v.resolution);
        return h !== null && h <= maxH;
    });
    return withRes[0] ?? sorted[sorted.length - 1];
}
function selectDashRepresentation(reprs, preference = 'best') {
    if (!reprs.length)
        return undefined;
    const sorted = [...reprs].sort((a, b) => b.bandwidth - a.bandwidth);
    if (preference === 'best')
        return sorted[0];
    if (preference === 'worst')
        return sorted[sorted.length - 1];
    const maxH = preference;
    const filtered = sorted.filter(r => r.height !== undefined && r.height <= maxH);
    return filtered[0] ?? sorted[sorted.length - 1];
}
function describeQuality(variant) {
    const h = parseHeight(variant.resolution);
    if (h)
        return `${h}p (${formatBitrate(variant.bandwidth)})`;
    return formatBitrate(variant.bandwidth);
}
function parseHeight(resolution) {
    if (!resolution)
        return null;
    const m = resolution.match(/\d+x(\d+)/);
    return m ? parseInt(m[1], 10) : null;
}
function formatBitrate(bps) {
    if (bps >= 1000000)
        return `${(bps / 1000000).toFixed(1)} Mbps`;
    return `${Math.round(bps / 1000)} Kbps`;
}
