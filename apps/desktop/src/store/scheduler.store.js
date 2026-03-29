"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSchedulerStore = void 0;
var zustand_1 = require("zustand");
var immer_1 = require("zustand/middleware/immer");
exports.useSchedulerStore = (0, zustand_1.create)()((0, immer_1.immer)(function (set) { return ({
    tasks: [],
    enabled: false,
    setTasks: function (tasks) { return set(function (s) { s.tasks = tasks; }); },
    upsertTask: function (task) { return set(function (s) {
        var idx = s.tasks.findIndex(function (t) { return t.id === task.id; });
        if (idx >= 0)
            s.tasks[idx] = task;
        else
            s.tasks.push(task);
    }); },
    removeTask: function (id) { return set(function (s) { s.tasks = s.tasks.filter(function (t) { return t.id !== id; }); }); },
    setEnabled: function (v) { return set(function (s) { s.enabled = v; }); },
}); }));
