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
exports.Toolbar = void 0;
var react_1 = require("react");
var format_1 = require("../utils/format");
var file_1 = require("../utils/file");
var Toolbar = function (_a) {
    var stats = _a.stats, onAdd = _a.onAdd, onPauseAll = _a.onPauseAll, onResumeAll = _a.onResumeAll, searchQuery = _a.searchQuery, onSearch = _a.onSearch;
    var _b = (0, react_1.useState)(false), showAddModal = _b[0], setShowAddModal = _b[1];
    // Listen for menu/tray events
    (0, react_1.useEffect)(function () {
        var off1 = window.idm.on('ui:add-url', function () { return setShowAddModal(true); });
        var off2 = window.idm.on('ui:pause-all', onPauseAll);
        var off3 = window.idm.on('ui:resume-all', onResumeAll);
        return function () { off1(); off2(); off3(); };
    }, []);
    return (<>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex-shrink-0">
        {/* Add button */}
        <button onClick={function () { return setShowAddModal(true); }} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
          <span className="text-base leading-none">+</span>
          Add URL
        </button>

        {/* Pause / Resume all */}
        <button onClick={onPauseAll} disabled={stats.active === 0} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm transition-colors disabled:opacity-40" title="Pause all">
          ⏸ Pause All
        </button>
        <button onClick={onResumeAll} className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-sm transition-colors" title="Resume all">
          ▶ Resume All
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1"/>

        {/* Search */}
        <input type="text" placeholder="Search downloads..." value={searchQuery} onChange={function (e) { return onSearch(e.target.value); }} className="flex-1 max-w-xs px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"/>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          {stats.active > 0 && (<span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"/>
              {stats.active} active · {(0, format_1.formatSpeed)(stats.speed)}
            </span>)}
          <span>{stats.total} total · {stats.completed} done</span>
        </div>
      </div>

      {showAddModal && (<AddUrlModal onAdd={function (opts) { onAdd(opts); setShowAddModal(false); }} onClose={function () { return setShowAddModal(false); }}/>)}
    </>);
};
exports.Toolbar = Toolbar;
var AddUrlModal = function (_a) {
    var onAdd = _a.onAdd, onClose = _a.onClose;
    var _b = (0, react_1.useState)(''), url = _b[0], setUrl = _b[1];
    var _c = (0, react_1.useState)(''), savePath = _c[0], setSavePath = _c[1];
    var _d = (0, react_1.useState)(8), maxConn = _d[0], setMaxConn = _d[1];
    var _e = (0, react_1.useState)(false), advanced = _e[0], setAdvanced = _e[1];
    var inputRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus();
        // Try to pre-fill from clipboard
        navigator.clipboard.readText().then(function (text) {
            if ((0, file_1.isValidUrl)(text.trim()))
                setUrl(text.trim());
        }).catch(function () { });
    }, []);
    var handleSubmit = function (e) {
        e.preventDefault();
        if (!(0, file_1.isValidUrl)(url.trim()))
            return;
        onAdd({ url: url.trim(), savePath: savePath || undefined, maxConnections: maxConn });
    };
    var browseSavePath = function () { return __awaiter(void 0, void 0, void 0, function () {
        var dir;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, window.idm.system.openDir()];
                case 1:
                    dir = _a.sent();
                    if (dir)
                        setSavePath(dir);
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Add Download</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL</label>
            <input ref={inputRef} type="text" value={url} onChange={function (e) { return setUrl(e.target.value); }} placeholder="https://, ftp://, or magnet:..." className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {url && !(0, file_1.isValidUrl)(url) && (<p className="text-xs text-red-500 mt-1">Please enter a valid URL</p>)}
          </div>

          {/* Advanced toggle */}
          <button type="button" onClick={function () { return setAdvanced(function (a) { return !a; }); }} className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
            {advanced ? '▲ Hide' : '▼ Show'} advanced options
          </button>

          {advanced && (<div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {/* Save path */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Save to folder</label>
                <div className="flex gap-2">
                  <input type="text" value={savePath} onChange={function (e) { return setSavePath(e.target.value); }} placeholder="Default downloads folder" className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <button type="button" onClick={browseSavePath} className="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-xs hover:bg-gray-100 dark:hover:bg-gray-700">Browse</button>
                </div>
              </div>

              {/* Connections */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Parallel connections: {maxConn}
                </label>
                <input type="range" min={1} max={32} value={maxConn} onChange={function (e) { return setMaxConn(parseInt(e.target.value)); }} className="w-full accent-blue-600"/>
              </div>
            </div>)}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={!(0, file_1.isValidUrl)(url.trim())} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg font-medium transition-colors">
              Download
            </button>
          </div>
        </form>
      </div>
    </div>);
};
