"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useQueueStore = void 0;
var zustand_1 = require("zustand");
var immer_1 = require("zustand/middleware/immer");
exports.useQueueStore = (0, zustand_1.create)()((0, immer_1.immer)(function (set) { return ({
    queues: [],
    stats: null,
    loading: false,
    setQueues: function (q) { return set(function (s) { s.queues = q; }); },
    upsertQueue: function (q) { return set(function (s) {
        var idx = s.queues.findIndex(function (x) { return x.id === q.id; });
        if (idx >= 0)
            s.queues[idx] = q;
        else
            s.queues.push(q);
    }); },
    removeQueue: function (id) { return set(function (s) { s.queues = s.queues.filter(function (q) { return q.id !== id; }); }); },
    setStats: function (stats) { return set(function (s) { s.stats = stats; }); },
    setLoading: function (v) { return set(function (s) { s.loading = v; }); },
}); }));
