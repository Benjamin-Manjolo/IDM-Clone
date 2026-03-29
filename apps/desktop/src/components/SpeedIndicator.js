"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeedIndicator = void 0;
var react_1 = require("react");
var format_1 = require("../utils/format");
var speed_1 = require("../utils/speed");
var SpeedIndicator = function (_a) {
    var bps = _a.bps, _b = _a.showIcon, showIcon = _b === void 0 ? true : _b, _c = _a.className, className = _c === void 0 ? '' : _c;
    var color = (0, speed_1.speedToColor)(bps);
    return (<span className={"inline-flex items-center gap-1 font-mono text-xs font-medium ".concat(color, " ").concat(className)}>
      {showIcon && bps > 0 && (<span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>)}
      {(0, format_1.formatSpeed)(bps)}
    </span>);
};
exports.SpeedIndicator = SpeedIndicator;
