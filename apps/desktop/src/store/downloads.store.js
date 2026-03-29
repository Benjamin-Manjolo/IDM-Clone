"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDownloadsStore = void 0;
var zustand_1 = require("zustand");
var immer_1 = require("zustand/middleware/immer");
exports.useDownloadsStore = (0, zustand_1.create)()((0, immer_1.immer)(function (set, get) { return ({
    items: {},
    selectedIds: new Set(),
    filterCategory: 'all',
    filterStatus: 'all',
    searchQuery: '',
    setItems: function (items) { return set(function (s) {
        s.items = {};
        items.forEach(function (i) { s.items[i.id] = i; });
    }); },
    upsert: function (item) { return set(function (s) { s.items[item.id] = item; }); },
    applyProgress: function (p) { return set(function (s) {
        var item = s.items[p.id];
        if (!item)
            return;
        item.downloadedSize = p.downloadedSize;
        item.speed = p.speed;
        item.timeRemaining = p.timeRemaining;
        item.segments = p.segments;
        item.status = p.status;
    }); },
    remove: function (id) { return set(function (s) {
        delete s.items[id];
        s.selectedIds.delete(id);
    }); },
    select: function (id, multi) {
        if (multi === void 0) { multi = false; }
        return set(function (s) {
            if (!multi) {
                s.selectedIds = new Set([id]);
            }
            else {
                if (s.selectedIds.has(id))
                    s.selectedIds.delete(id);
                else
                    s.selectedIds.add(id);
            }
        });
    },
    clearSelection: function () { return set(function (s) { s.selectedIds = new Set(); }); },
    setFilterCategory: function (c) { return set(function (s) { s.filterCategory = c; }); },
    setFilterStatus: function (s2) { return set(function (s) { s.filterStatus = s2; }); },
    setSearch: function (q) { return set(function (s) { s.searchQuery = q; }); },
    filtered: function () {
        var _a = get(), items = _a.items, filterCategory = _a.filterCategory, filterStatus = _a.filterStatus, searchQuery = _a.searchQuery;
        return Object.values(items).filter(function (item) {
            if (filterCategory !== 'all' && item.category !== filterCategory)
                return false;
            if (filterStatus !== 'all' && item.status !== filterStatus)
                return false;
            if (searchQuery && !item.filename.toLowerCase().includes(searchQuery.toLowerCase()))
                return false;
            return true;
        }).sort(function (a, b) { return b.createdAt - a.createdAt; });
    },
    stats: function () {
        var all = Object.values(get().items);
        return {
            total: all.length,
            active: all.filter(function (i) { return i.status === 'downloading'; }).length,
            completed: all.filter(function (i) { return i.status === 'completed'; }).length,
            speed: all.filter(function (i) { return i.status === 'downloading'; }).reduce(function (s, i) { return s + i.speed; }, 0),
        };
    },
}); }));
