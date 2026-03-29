"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
var react_1 = require("react");
var useScheduler_1 = require("../hooks/useScheduler");
var scheduler_1 = require("@idm/scheduler");
var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
var defaultTask = function () { return ({
    name: '',
    repeat: 'once',
    onStart: 'start',
    onStop: 'stop',
    enabled: true,
    daysOfWeek: [],
}); };
var Scheduler = function () {
    var _a;
    var _b = (0, useScheduler_1.useScheduler)(), tasks = _b.tasks, create = _b.create, update = _b.update, remove = _b.remove, toggle = _b.toggle;
    var _c = (0, react_1.useState)(false), showForm = _c[0], setShowForm = _c[1];
    var _d = (0, react_1.useState)(defaultTask()), form = _d[0], setForm = _d[1];
    var _e = (0, react_1.useState)(''), startDate = _e[0], setStartDate = _e[1];
    var _f = (0, react_1.useState)('08:00'), startTime = _f[0], setStartTime = _f[1];
    var patch = function (p) { return setForm(function (f) { return (__assign(__assign({}, f), p)); }); };
    var handleSubmit = function (e) { return __awaiter(void 0, void 0, void 0, function () {
        var startTimestamp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!form.name.trim())
                        return [2 /*return*/];
                    if (startDate) {
                        startTimestamp = new Date("".concat(startDate, "T").concat(startTime)).getTime();
                    }
                    return [4 /*yield*/, create(__assign(__assign({}, form), { startTime: startTimestamp }))];
                case 1:
                    _a.sent();
                    setForm(defaultTask());
                    setStartDate('');
                    setStartTime('08:00');
                    setShowForm(false);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div>
          <h1 className="text-base font-semibold text-gray-900 dark:text-white">Scheduler</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Schedule downloads to start, stop, or shutdown at specific times
          </p>
        </div>
        <button onClick={function () { return setShowForm(true); }} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          + New Task
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 && !showForm && (<div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600 gap-3">
            <span className="text-5xl">🕐</span>
            <p className="text-sm font-medium">No scheduled tasks</p>
            <p className="text-xs">Automate downloads — start at night, shutdown when done</p>
          </div>)}

        {tasks.map(function (task) { return (<TaskCard key={task.id} task={task} onToggle={toggle} onRemove={remove}/>); })}

        {showForm && (<div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 bg-blue-50 dark:bg-blue-950/30">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">New Scheduled Task</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input autoFocus type="text" value={form.name} onChange={function (e) { return patch({ name: e.target.value }); }} placeholder="Task name..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>

              <div className="grid grid-cols-2 gap-3">
                {/* Repeat */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Repeat</label>
                  <select value={form.repeat} onChange={function (e) { return patch({ repeat: e.target.value }); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom interval</option>
                  </select>
                </div>
                {/* On start action */}
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">On start</label>
                  <select value={form.onStart} onChange={function (e) { return patch({ onStart: e.target.value }); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="start">Start downloads</option>
                    <option value="stop">Stop downloads</option>
                  </select>
                </div>
              </div>

              {/* Weekly days */}
              {form.repeat === 'weekly' && (<div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Days of week</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS.map(function (d, i) {
                    var _a;
                    return (<button key={d} type="button" onClick={function () {
                            var _a;
                            var days = (_a = form.daysOfWeek) !== null && _a !== void 0 ? _a : [];
                            patch({ daysOfWeek: days.includes(i) ? days.filter(function (x) { return x !== i; }) : __spreadArray(__spreadArray([], days, true), [i], false) });
                        }} className={"px-2 py-1 text-xs rounded-md border font-medium transition-colors ".concat(((_a = form.daysOfWeek) !== null && _a !== void 0 ? _a : []).includes(i)
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700')}>{d}</button>);
                })}
                  </div>
                </div>)}

              {/* Custom interval */}
              {form.repeat === 'custom' && (<div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Interval (minutes)</label>
                  <input type="number" min={1} defaultValue={60} onChange={function (e) { return patch({ intervalMs: +e.target.value * 60000 }); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>)}

              {/* Date + time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                    {form.repeat === 'once' ? 'Date' : 'Start date (optional)'}
                  </label>
                  <input type="date" value={startDate} onChange={function (e) { return setStartDate(e.target.value); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Time</label>
                  <input type="time" value={startTime} onChange={function (e) { return setStartTime(e.target.value); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>

              {/* On stop action */}
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">When done (optional)</label>
                <select value={(_a = form.onStop) !== null && _a !== void 0 ? _a : ''} onChange={function (e) { return patch({ onStop: e.target.value || undefined }); }} className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Do nothing</option>
                  <option value="stop">Stop downloads</option>
                  <option value="shutdown">Shutdown computer</option>
                  <option value="hibernate">Hibernate</option>
                  <option value="sleep">Sleep</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button type="button" onClick={function () { setShowForm(false); setForm(defaultTask()); }} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">Cancel</button>
                <button type="submit" disabled={!form.name.trim()} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium">Create Task</button>
              </div>
            </form>
          </div>)}
      </div>
    </div>);
};
exports.Scheduler = Scheduler;
var TaskCard = function (_a) {
    var task = _a.task, onToggle = _a.onToggle, onRemove = _a.onRemove;
    return (<div className={"border rounded-xl p-4 ".concat(task.enabled ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60')}>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{task.name}</h3>
          <span className={"text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0 ".concat(task.enabled ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400')}>
            {task.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{(0, scheduler_1.formatScheduleDescription)(task)}</p>
        {task.nextRunAt && <p className="text-xs text-blue-500 dark:text-blue-400 mt-0.5">Next: {new Date(task.nextRunAt).toLocaleString()}</p>}
        {task.onStop && <p className="text-xs text-orange-500 dark:text-orange-400 mt-0.5">After: {task.onStop}</p>}
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button onClick={function () { return onToggle(task.id); }} className="px-2.5 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          {task.enabled ? 'Disable' : 'Enable'}
        </button>
        <button onClick={function () { return onRemove(task.id); }} className="px-2.5 py-1 text-xs border border-red-200 dark:border-red-900 text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30">
          Remove
        </button>
      </div>
    </div>
  </div>);
};
