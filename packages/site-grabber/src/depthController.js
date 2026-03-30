"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepthController = void 0;
class DepthController {
    constructor(maxDepth) {
        this.maxDepth = maxDepth;
        this.visited = new Map(); // url -> depth reached
    }
    canVisit(url, currentDepth) {
        if (currentDepth > this.maxDepth)
            return false;
        const prev = this.visited.get(url);
        if (prev !== undefined && prev <= currentDepth)
            return false;
        return true;
    }
    markVisited(url, depth) {
        this.visited.set(url, depth);
    }
    isVisited(url) {
        return this.visited.has(url);
    }
    getVisitedCount() {
        return this.visited.size;
    }
    reset() {
        this.visited.clear();
    }
    shouldFollowLink(linkUrl, baseUrl, stayOnDomain) {
        if (!stayOnDomain)
            return true;
        try {
            return new URL(linkUrl).hostname === new URL(baseUrl).hostname;
        }
        catch {
            return false;
        }
    }
}
exports.DepthController = DepthController;
