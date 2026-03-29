"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Home = void 0;
var react_1 = require("react");
var useDownload_1 = require("../hooks/useDownload");
var DownloadList_1 = require("../components/DownloadList");
var Toolbar_1 = require("../components/Toolbar");
var CategoryTabs_1 = require("../components/CategoryTabs");
var downloads_store_1 = require("../store/downloads.store");
var Home = function () {
    var _a = (0, useDownload_1.useDownload)(), items = _a.items, stats = _a.stats, selected = _a.selected, select = _a.select, clearSelection = _a.clearSelection, add = _a.add, pause = _a.pause, resume = _a.resume, cancel = _a.cancel, remove = _a.remove, open = _a.open, openDir = _a.openDir, pauseAll = _a.pauseAll, resumeAll = _a.resumeAll, setFilterCategory = _a.setFilterCategory, setFilterStatus = _a.setFilterStatus, setSearch = _a.setSearch;
    var _b = (0, downloads_store_1.useDownloadsStore)(), filterCategory = _b.filterCategory, searchQuery = _b.searchQuery, allItems = _b.items;
    // Compute per-category counts
    var counts = react_1.default.useMemo(function () {
        var all = Object.values(allItems);
        var c = { all: all.length };
        all.forEach(function (i) { var _a; c[i.category] = ((_a = c[i.category]) !== null && _a !== void 0 ? _a : 0) + 1; });
        return c;
    }, [allItems]);
    return (<div className="flex flex-col h-full">
      <Toolbar_1.Toolbar stats={stats} onAdd={add} onPauseAll={pauseAll} onResumeAll={resumeAll} searchQuery={searchQuery} onSearch={setSearch}/>
      <CategoryTabs_1.CategoryTabs active={filterCategory} onChange={setFilterCategory} counts={counts}/>
      <DownloadList_1.DownloadList items={items} selectedIds={selected} onSelect={select} onPause={pause} onResume={resume} onCancel={cancel} onRemove={remove} onOpen={open} onOpenDir={openDir}/>
    </div>);
};
exports.Home = Home;
