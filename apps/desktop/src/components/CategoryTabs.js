"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryTabs = void 0;
var react_1 = require("react");
var TABS = [
    { key: 'all', label: 'All', icon: '📦' },
    { key: 'video', label: 'Video', icon: '🎬' },
    { key: 'audio', label: 'Audio', icon: '🎵' },
    { key: 'documents', label: 'Docs', icon: '📄' },
    { key: 'programs', label: 'Programs', icon: '⚙️' },
    { key: 'compressed', label: 'Archives', icon: '🗜' },
    { key: 'images', label: 'Images', icon: '🖼' },
    { key: 'other', label: 'Other', icon: '📁' },
];
var CategoryTabs = function (_a) {
    var active = _a.active, onChange = _a.onChange, _b = _a.counts, counts = _b === void 0 ? {} : _b;
    return (<div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto flex-shrink-0">
    {TABS.map(function (tab) { return (<button key={tab.key} onClick={function () { return onChange(tab.key); }} className={"flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0\n          ".concat(active === tab.key
                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200')}>
        <span>{tab.icon}</span>
        <span>{tab.label}</span>
        {counts[tab.key] !== undefined && counts[tab.key] > 0 && (<span className={"text-[10px] px-1 rounded-full font-bold\n            ".concat(active === tab.key ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200' : 'bg-gray-200 dark:bg-gray-700 text-gray-500')}>
            {counts[tab.key]}
          </span>)}
      </button>); })}
  </div>);
};
exports.CategoryTabs = CategoryTabs;
