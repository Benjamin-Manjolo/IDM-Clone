"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadItem = void 0;
var react_1 = require("react");
var ProgressBar_1 = require("./ProgressBar");
var SpeedIndicator_1 = require("./SpeedIndicator");
var format_1 = require("../utils/format");
var file_1 = require("../utils/file");
var STATUS_BADGE = {
    downloading: { label: 'Downloading', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    queued: { label: 'Queued', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
    paused: { label: 'Paused', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
    completed: { label: 'Done', cls: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    error: { label: 'Error', cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
    merging: { label: 'Merging', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
    checking: { label: 'Checking', cls: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' },
};
exports.DownloadItem = (0, react_1.memo)(function (_a) {
    var _b, _c;
    var item = _a.item, selected = _a.selected, onSelect = _a.onSelect, onPause = _a.onPause, onResume = _a.onResume, onCancel = _a.onCancel, onRemove = _a.onRemove, onOpen = _a.onOpen, onOpenDir = _a.onOpenDir;
    var percent = (0, format_1.formatPercent)(item.downloadedSize, item.totalSize);
    var badge = (_b = STATUS_BADGE[item.status]) !== null && _b !== void 0 ? _b : STATUS_BADGE['queued'];
    var icon = (0, file_1.getFileIcon)(item.filename);
    var isActive = item.status === 'downloading';
    var isDone = item.status === 'completed';
    var isError = item.status === 'error';
    var isPaused = item.status === 'paused';
    var handleClick = (0, react_1.useCallback)(function (e) {
        onSelect(item.id, e.ctrlKey || e.metaKey || e.shiftKey);
    }, [item.id, onSelect]);
    return (<div onClick={handleClick} className={"group flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800\n        cursor-pointer select-none transition-colors\n        ".concat(selected
            ? 'bg-blue-50 dark:bg-blue-950/40'
            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50')}>
      {/* File icon */}
      <div className="text-2xl w-8 flex-shrink-0 text-center">{icon}</div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Filename + badge */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={item.filename}>
            {(0, format_1.truncate)(item.filename, 60)}
          </span>
          <span className={"flex-shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ".concat(badge.cls)}>
            {badge.label}
          </span>
        </div>

        {/* Progress bar */}
        {!isDone && item.totalSize > 0 && (<ProgressBar_1.ProgressBar percent={percent} status={item.status} height={3}/>)}

        {/* Stats row */}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
          <span>{(0, format_1.formatBytes)(item.downloadedSize)}{item.totalSize > 0 ? " / ".concat((0, format_1.formatBytes)(item.totalSize)) : ''}</span>
          {isActive && <SpeedIndicator_1.SpeedIndicator bps={item.speed}/>}
          {isActive && item.timeRemaining > 0 && <span>{(0, format_1.formatTime)(item.timeRemaining)} left</span>}
          {isDone && item.totalSize > 0 && <span className="text-green-500">✓ {(0, format_1.formatBytes)(item.totalSize)}</span>}
          {isError && <span className="text-red-500 truncate">{(_c = item.errorMessage) !== null && _c !== void 0 ? _c : 'Download failed'}</span>}
          <span className="ml-auto">{(0, format_1.formatShortDate)(item.createdAt)}</span>
        </div>

        {/* Segment visualization */}
        {isActive && item.segments.length > 1 && (<div className="flex gap-px mt-1 h-1 rounded overflow-hidden">
            {item.segments.map(function (seg) {
                var pct = seg.end >= seg.start
                    ? (0, format_1.formatPercent)(seg.downloaded, seg.end - seg.start + 1)
                    : 0;
                return (<div key={seg.id} className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-sm overflow-hidden">
                  <div className="h-full bg-blue-400 dark:bg-blue-500" style={{ width: "".concat(pct, "%") }}/>
                </div>);
            })}
          </div>)}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isActive && (<ActionBtn onClick={function () { return onPause(item.id); }} title="Pause">⏸</ActionBtn>)}
        {isPaused && (<ActionBtn onClick={function () { return onResume(item.id); }} title="Resume">▶</ActionBtn>)}
        {isDone && (<>
            <ActionBtn onClick={function () { return onOpen(item.id); }} title="Open file">📂</ActionBtn>
            <ActionBtn onClick={function () { return onOpenDir(item.id); }} title="Show in folder">📁</ActionBtn>
          </>)}
        {isError && (<ActionBtn onClick={function () { return onResume(item.id); }} title="Retry">🔄</ActionBtn>)}
        {!isDone && !isError && (<ActionBtn onClick={function () { return onCancel(item.id); }} title="Cancel" danger>✕</ActionBtn>)}
        {(isDone || isError) && (<ActionBtn onClick={function () { return onRemove(item.id); }} title="Remove" danger>🗑</ActionBtn>)}
      </div>
    </div>);
});
exports.DownloadItem.displayName = 'DownloadItem';
var ActionBtn = function (_a) {
    var onClick = _a.onClick, title = _a.title, danger = _a.danger, children = _a.children;
    return (<button title={title} onClick={function (e) { e.stopPropagation(); onClick(); }} className={"w-7 h-7 flex items-center justify-center rounded text-sm transition-colors\n      ".concat(danger
            ? 'hover:bg-red-100 dark:hover:bg-red-900/40 text-gray-400 hover:text-red-500'
            : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200')}>
    {children}
  </button>);
};
