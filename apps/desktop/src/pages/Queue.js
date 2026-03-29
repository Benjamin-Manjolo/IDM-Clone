"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Queue = void 0;
var react_1 = require("react");
var useQueue_1 = require("../hooks/useQueue");
var format_1 = require("../utils/format");
var Queue = function () {
    var _a = (0, useQueue_1.useQueue)(), queues = _a.queues, stats = _a.stats, loading = _a.loading, create = _a.create, update = _a.update, remove = _a.remove, start = _a.start, stop = _a.stop;
    var _b = (0, react_1.useState)(false), showCreate = _b[0], setShowCreate = _b[1];
    var _c = (0, react_1.useState)(''), newName = _c[0], setNewName = _c[1];
    var _d = (0, react_1.useState)(3), newConcurrent = _d[0], setNewConcurrent = _d[1];
    var _e = (0, react_1.useState)(0), newSpeedLimit = _e[0], setNewSpeedLimit = _e[1];
    var handleCreate = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!newName.trim())
                        return [2 /*return*/];
                    return [4 /*yield*/, create(newName.trim(), { maxConcurrent: newConcurrent, speedLimit: newSpeedLimit * 1024 })];
                case 1:
                    _a.sent();
                    setNewName('');
                    setNewConcurrent(3);
                    setNewSpeedLimit(0);
                    setShowCreate(false);
                    return [2 /*return*/];
            }
        });
    }); };
    if (loading)
        return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
    return (<div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Download Queues</h1>
          {stats && (<p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {stats.active} active · {stats.total} total · {(0, format_1.formatBytes)(stats.downloadedBytes)} / {(0, format_1.formatBytes)(stats.totalBytes)}
            </p>)}
        </div>
        <button onClick={function () { return setShowCreate(true); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Queue
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {queues.length === 0 && !showCreate && (<div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
            <span className="text-5xl">📋</span>
            <p className="text-sm font-medium">No queues yet</p>
            <p className="text-xs">Create a queue to organize and schedule batches of downloads</p>
          </div>)}

        {queues.map(function (queue) { return (<QueueCard key={queue.id} queue={queue} onStart={start} onStop={stop} onRemove={remove} onUpdate={update}/>); })}

        {/* Create queue form */}
        {showCreate && (<div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-950/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Queue</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input autoFocus type="text" value={newName} onChange={function (e) { return setNewName(e.target.value); }} placeholder="Queue name..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Max concurrent: {newConcurrent}</label>
                  <input type="range" min={1} max={16} value={newConcurrent} onChange={function (e) { return setNewConcurrent(+e.target.value); }} className="w-full accent-blue-600"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Speed limit (KB/s, 0=unlimited)</label>
                  <input type="number" min={0} value={newSpeedLimit} onChange={function (e) { return setNewSpeedLimit(+e.target.value); }} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={function () { return setShowCreate(false); }} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={!newName.trim()} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium">Create</button>
              </div>
            </form>
          </div>)}
      </div>
    </div>);
};
exports.Queue = Queue;
var QueueCard = function (_a) {
    var queue = _a.queue, onStart = _a.onStart, onStop = _a.onStop, onRemove = _a.onRemove, onUpdate = _a.onUpdate;
    return (<div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white dark:bg-gray-800/50">
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{queue.name}</h3>
          <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ".concat(queue.active ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400')}>
            {queue.active ? 'Active' : 'Stopped'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {queue.downloadIds.length} downloads · Max {queue.maxConcurrent} concurrent
          {queue.speedLimit > 0 && " \u00B7 ".concat((0, format_1.formatBytes)(queue.speedLimit), "/s limit")}
        </p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {queue.active
            ? <button onClick={function () { return onStop(queue.id); }} className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">⏸ Stop</button>
            : <button onClick={function () { return onStart(queue.id); }} className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md">▶ Start</button>}
        <button onClick={function () { return onRemove(queue.id); }} className="px-2.5 py-1 text-xs border border-red-200 dark:border-red-900 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
          Remove
        </button>
      </div>
    </div>
  </div>);
};
