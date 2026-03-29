"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Categories = void 0;
var react_1 = require("react");
var downloads_store_1 = require("../store/downloads.store");
var format_1 = require("../utils/format");
var shared_1 = require("@idm/shared");
var CATEGORY_META = {
    video: { icon: '🎬', label: 'Video', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    audio: { icon: '🎵', label: 'Audio', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
    documents: { icon: '📄', label: 'Documents', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    compressed: { icon: '🗜', label: 'Archives', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
    programs: { icon: '⚙️', label: 'Programs', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
    images: { icon: '🖼', label: 'Images', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
    general: { icon: '📦', label: 'General', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
    other: { icon: '📁', label: 'Other', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' },
};
var Categories = function () {
    var _a = (0, downloads_store_1.useDownloadsStore)(), items = _a.items, setFilterCategory = _a.setFilterCategory;
    var all = Object.values(items);
    var byCategory = Object.keys(CATEGORY_META).map(function (cat) {
        var downloads = all.filter(function (d) { return d.category === cat; });
        var totalSize = downloads.reduce(function (s, d) { return s + Math.max(0, d.totalSize); }, 0);
        var completed = downloads.filter(function (d) { return d.status === 'completed'; }).length;
        return { cat: cat, downloads: downloads, totalSize: totalSize, completed: completed };
    }).filter(function (c) { return c.downloads.length > 0; });
    return (<div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Categories</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Downloads organized by file type</p>
      </div>

      {byCategory.length === 0 ? (<div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-3 py-20">
          <span className="text-5xl">🗂</span>
          <p className="text-sm font-medium">No downloads yet</p>
          <p className="text-xs">Downloads will appear here grouped by type</p>
        </div>) : (<div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {byCategory.map(function (_a) {
                var _b, _c;
                var cat = _a.cat, downloads = _a.downloads, totalSize = _a.totalSize, completed = _a.completed;
                var meta = (_b = CATEGORY_META[cat]) !== null && _b !== void 0 ? _b : CATEGORY_META['other'];
                return (<button key={cat} onClick={function () { return setFilterCategory(cat); }} className="text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all bg-white dark:bg-gray-800/50 group">
                  <div className={"inline-flex items-center justify-center w-10 h-10 rounded-lg text-xl mb-3 ".concat(meta.color)}>
                    {meta.icon}
                  </div>
                  <div className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">{meta.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {downloads.length} file{downloads.length !== 1 ? 's' : ''}
                    {totalSize > 0 && " \u00B7 ".concat((0, format_1.formatBytes)(totalSize))}
                  </div>
                  {completed > 0 && (<div className="text-xs text-green-500 dark:text-green-400 mt-0.5">{completed} completed</div>)}
                  <div className="mt-2 text-[10px] text-gray-400 dark:text-gray-600 group-hover:text-blue-500 transition-colors">
                    {((_c = shared_1.CATEGORY_EXTENSIONS[cat]) !== null && _c !== void 0 ? _c : []).slice(0, 5).join(', ')}…
                  </div>
                </button>);
            })}
          </div>
        </div>)}
    </div>);
};
exports.Categories = Categories;
