"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloadList = void 0;
var react_1 = require("react");
var DownloadItem_1 = require("./DownloadItem");
var DownloadList = function (_a) {
    var items = _a.items, selectedIds = _a.selectedIds, onSelect = _a.onSelect, onPause = _a.onPause, onResume = _a.onResume, onCancel = _a.onCancel, onRemove = _a.onRemove, onOpen = _a.onOpen, onOpenDir = _a.onOpenDir;
    if (items.length === 0) {
        return (<div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-3 py-20">
        <span className="text-5xl">📭</span>
        <p className="text-sm font-medium">No downloads yet</p>
        <p className="text-xs">Press Ctrl+N or click Add URL to start downloading</p>
      </div>);
    }
    return (<div className="flex-1 overflow-y-auto">
      {items.map(function (item) { return (<DownloadItem_1.DownloadItem key={item.id} item={item} selected={selectedIds.has(item.id)} onSelect={onSelect} onPause={onPause} onResume={onResume} onCancel={onCancel} onRemove={onRemove} onOpen={onOpen} onOpenDir={onOpenDir}/>); })}
    </div>);
};
exports.DownloadList = DownloadList;
