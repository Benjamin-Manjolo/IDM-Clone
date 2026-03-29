"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RollingAverage = void 0;
exports.speedToColor = speedToColor;
exports.speedToBarWidth = speedToBarWidth;
function speedToColor(bps) {
    if (bps <= 0)
        return 'text-gray-400';
    if (bps < 100 * 1024)
        return 'text-red-400'; // < 100 KB/s
    if (bps < 1024 * 1024)
        return 'text-yellow-400'; // < 1 MB/s
    if (bps < 10 * 1024 * 1024)
        return 'text-green-400'; // < 10 MB/s
    return 'text-blue-400'; // 10+ MB/s
}
function speedToBarWidth(bps, maxBps) {
    if (maxBps <= 0 || bps <= 0)
        return 0;
    return Math.min(100, (bps / maxBps) * 100);
}
/** Rolling average over a sliding window of samples */
var RollingAverage = /** @class */ (function () {
    function RollingAverage(windowSize) {
        this.windowSize = windowSize;
        this.samples = [];
    }
    RollingAverage.prototype.push = function (value) {
        this.samples.push(value);
        if (this.samples.length > this.windowSize)
            this.samples.shift();
    };
    RollingAverage.prototype.get = function () {
        if (!this.samples.length)
            return 0;
        return this.samples.reduce(function (a, b) { return a + b; }, 0) / this.samples.length;
    };
    RollingAverage.prototype.reset = function () { this.samples = []; };
    return RollingAverage;
}());
exports.RollingAverage = RollingAverage;
