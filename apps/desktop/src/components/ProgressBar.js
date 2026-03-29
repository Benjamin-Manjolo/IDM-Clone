"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressBar = void 0;
var react_1 = require("react");
var colorMap = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-400',
    gray: 'bg-gray-400',
};
var statusColor = {
    downloading: 'blue',
    completed: 'green',
    error: 'red',
    paused: 'yellow',
    queued: 'gray',
    merging: 'blue',
    checking: 'blue',
};
var ProgressBar = function (_a) {
    var _b;
    var percent = _a.percent, _c = _a.status, status = _c === void 0 ? 'downloading' : _c, _d = _a.animated, animated = _d === void 0 ? true : _d, _e = _a.height, height = _e === void 0 ? 4 : _e, _f = _a.showLabel, showLabel = _f === void 0 ? false : _f, color = _a.color;
    var c = (_b = color !== null && color !== void 0 ? color : statusColor[status]) !== null && _b !== void 0 ? _b : 'blue';
    var barColor = colorMap[c];
    var clamped = Math.max(0, Math.min(100, percent));
    return (<div className="w-full">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden" style={{ height: height }}>
        <div className={"h-full rounded-full transition-all duration-300 ".concat(barColor, " ").concat(animated && status === 'downloading' ? 'relative overflow-hidden' : '')} style={{ width: "".concat(clamped, "%") }}>
          {animated && status === 'downloading' && (<span className="absolute inset-0 block opacity-30" style={{
                background: 'linear-gradient(90deg, transparent 0%, white 50%, transparent 100%)',
                animation: 'shimmer 1.5s infinite',
                backgroundSize: '200% 100%',
            }}/>)}
        </div>
      </div>
      {showLabel && (<span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 block text-right">
          {clamped}%
        </span>)}
    </div>);
};
exports.ProgressBar = ProgressBar;
