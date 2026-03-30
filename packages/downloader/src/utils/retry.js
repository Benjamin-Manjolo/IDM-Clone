"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withRetry = withRetry;
exports.sleep = sleep;
async function withRetry(fn, opts = {}) {
    const { maxAttempts = 5, baseDelayMs = 1000, maxDelayMs = 30000, factor = 2, onRetry } = opts;
    let lastError = new Error('Unknown error');
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt === maxAttempts)
                break;
            const delay = Math.min(baseDelayMs * Math.pow(factor, attempt - 1), maxDelayMs);
            // Add jitter ±20%
            const jittered = delay * (0.8 + Math.random() * 0.4);
            onRetry?.(attempt, lastError);
            await sleep(jittered);
        }
    }
    throw lastError;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
