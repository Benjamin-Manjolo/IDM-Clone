"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.passesFilter = passesFilter;
exports.buildFilterFromStrings = buildFilterFromStrings;
function passesFilter(url, filter, sizeBytes) {
    const ext = url.split('.').pop()?.toLowerCase().split('?')[0] ?? '';
    if (filter.includeExtensions?.length && !filter.includeExtensions.includes(ext))
        return false;
    if (filter.excludeExtensions?.includes(ext))
        return false;
    if (filter.includePatterns?.length && !filter.includePatterns.some(p => p.test(url)))
        return false;
    if (filter.excludePatterns?.some(p => p.test(url)))
        return false;
    if (sizeBytes !== undefined) {
        if (filter.minSizeBytes !== undefined && sizeBytes < filter.minSizeBytes)
            return false;
        if (filter.maxSizeBytes !== undefined && sizeBytes > filter.maxSizeBytes)
            return false;
    }
    return true;
}
function buildFilterFromStrings(include, exclude) {
    const parse = (s) => s.split(/[,;\s]+/).map(e => e.trim().replace(/^\./, '').toLowerCase()).filter(Boolean);
    return {
        includeExtensions: parse(include),
        excludeExtensions: parse(exclude),
    };
}
