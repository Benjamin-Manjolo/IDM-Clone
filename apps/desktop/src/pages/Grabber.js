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
exports.Grabber = void 0;
var react_1 = require("react");
var file_1 = require("../utils/file");
var useDownload_1 = require("../hooks/useDownload");
var Grabber = function () {
    var add = (0, useDownload_1.useDownload)().add;
    var _a = (0, react_1.useState)(''), siteUrl = _a[0], setSiteUrl = _a[1];
    var _b = (0, react_1.useState)(2), maxDepth = _b[0], setMaxDepth = _b[1];
    var _c = (0, react_1.useState)(true), stayOnDomain = _c[0], setStayOnDomain = _c[1];
    var _d = (0, react_1.useState)(''), includeExt = _d[0], setIncludeExt = _d[1];
    var _e = (0, react_1.useState)(''), excludeExt = _e[0], setExcludeExt = _e[1];
    var _f = (0, react_1.useState)(false), running = _f[0], setRunning = _f[1];
    var _g = (0, react_1.useState)([]), results = _g[0], setResults = _g[1];
    var _h = (0, react_1.useState)([]), log = _h[0], setLog = _h[1];
    var _j = (0, react_1.useState)(0), pagesVisited = _j[0], setPagesVisited = _j[1];
    var logRef = (0, react_1.useRef)(null);
    var appendLog = function (msg) {
        setLog(function (l) { return __spreadArray(__spreadArray([], l.slice(-99), true), [msg], false); });
        setTimeout(function () { var _a; return (_a = logRef.current) === null || _a === void 0 ? void 0 : _a.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
    };
    var handleGrab = function () { return __awaiter(void 0, void 0, void 0, function () {
        var demo, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(0, file_1.isValidUrl)(siteUrl))
                        return [2 /*return*/];
                    setRunning(true);
                    setResults([]);
                    setLog([]);
                    setPagesVisited(0);
                    appendLog("Starting crawl: ".concat(siteUrl));
                    appendLog("Max depth: ".concat(maxDepth, " | Stay on domain: ").concat(stayOnDomain));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    // We call the downloader through the IPC bridge.
                    // In production, the main process runs the actual Crawler — here we simulate progress.
                    // Integrate window.idm.grabber.start() once the IPC handler is added.
                    appendLog('Crawling... (connect to main process grabber IPC for real results)');
                    // Simulate found files for demo
                    return [4 /*yield*/, new Promise(function (r) { return setTimeout(r, 800); })];
                case 2:
                    // Simulate found files for demo
                    _a.sent();
                    demo = [
                        { url: "".concat(siteUrl.replace(/\/$/, ''), "/file1.zip"), selected: true },
                        { url: "".concat(siteUrl.replace(/\/$/, ''), "/video.mp4"), selected: true },
                        { url: "".concat(siteUrl.replace(/\/$/, ''), "/docs/manual.pdf"), selected: false },
                    ].filter(function (f) {
                        var _a, _b;
                        var ext = (_b = (_a = f.url.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) !== null && _b !== void 0 ? _b : '';
                        if (includeExt.trim())
                            return includeExt.split(',').map(function (e) { return e.trim(); }).includes(ext);
                        if (excludeExt.trim())
                            return !excludeExt.split(',').map(function (e) { return e.trim(); }).includes(ext);
                        return true;
                    });
                    setResults(demo);
                    setPagesVisited(3);
                    appendLog("Crawl complete. ".concat(demo.length, " files found across 3 pages."));
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    appendLog("Error: ".concat(err_1.message));
                    return [3 /*break*/, 5];
                case 4:
                    setRunning(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var toggleResult = function (url) {
        return setResults(function (r) { return r.map(function (x) { return x.url === url ? __assign(__assign({}, x), { selected: !x.selected }) : x; }); });
    };
    var toggleAll = function () {
        var allSelected = results.every(function (r) { return r.selected; });
        setResults(function (r) { return r.map(function (x) { return (__assign(__assign({}, x), { selected: !allSelected })); }); });
    };
    var downloadSelected = function () { return __awaiter(void 0, void 0, void 0, function () {
        var selected, _i, selected_1, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    selected = results.filter(function (r) { return r.selected; });
                    _i = 0, selected_1 = selected;
                    _a.label = 1;
                case 1:
                    if (!(_i < selected_1.length)) return [3 /*break*/, 4];
                    r = selected_1[_i];
                    return [4 /*yield*/, add({ url: r.url })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    appendLog("Added ".concat(selected.length, " files to download queue."));
                    return [2 /*return*/];
            }
        });
    }); };
    return (<div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900 dark:text-white">Site Grabber</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Crawl a website and download all matching files</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: config */}
        <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Website URL</label>
            <input type="text" value={siteUrl} onChange={function (e) { return setSiteUrl(e.target.value); }} placeholder="https://example.com" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Crawl depth: {maxDepth}</label>
            <input type="range" min={1} max={8} value={maxDepth} onChange={function (e) { return setMaxDepth(+e.target.value); }} className="w-full accent-blue-600"/>
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5"><span>Shallow</span><span>Deep</span></div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={stayOnDomain} onChange={function (e) { return setStayOnDomain(e.target.checked); }} className="w-4 h-4 accent-blue-600 rounded"/>
            <span className="text-xs text-gray-700 dark:text-gray-300">Stay on same domain</span>
          </label>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Include extensions</label>
            <input type="text" value={includeExt} onChange={function (e) { return setIncludeExt(e.target.value); }} placeholder="zip, mp4, pdf  (empty = all)" className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">Exclude extensions</label>
            <input type="text" value={excludeExt} onChange={function (e) { return setExcludeExt(e.target.value); }} placeholder="css, js, png" className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"/>
          </div>

          <button onClick={handleGrab} disabled={running || !(0, file_1.isValidUrl)(siteUrl)} className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {running ? <><span className="animate-spin">⟳</span> Crawling…</> : '🕸 Start Grabbing'}
          </button>

          {pagesVisited > 0 && (<p className="text-xs text-center text-gray-500 dark:text-gray-400">{pagesVisited} pages visited</p>)}
        </div>

        {/* Right: results + log */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {results.length > 0 && (<div className="border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={results.every(function (r) { return r.selected; })} onChange={toggleAll} className="accent-blue-600"/>
                  {results.filter(function (r) { return r.selected; }).length} / {results.length} selected
                </label>
                <button onClick={downloadSelected} disabled={!results.some(function (r) { return r.selected; })} className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-md font-medium">
                  ⬇ Download Selected
                </button>
              </div>)}
            {results.map(function (r) { return (<label key={r.url} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
                <input type="checkbox" checked={r.selected} onChange={function () { return toggleResult(r.url); }} className="accent-blue-600 w-4 h-4 flex-shrink-0"/>
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono text-xs">{r.url}</span>
              </label>); })}
            {!running && results.length === 0 && log.length === 0 && (<div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-600 gap-3 py-20">
                <span className="text-5xl">🕸</span>
                <p className="text-sm font-medium">Enter a URL and click Start Grabbing</p>
                <p className="text-xs">IDM will crawl the site and find all downloadable files</p>
              </div>)}
          </div>

          {/* Log */}
          {log.length > 0 && (<div ref={logRef} className="h-32 flex-shrink-0 overflow-y-auto bg-gray-950 p-3 font-mono text-xs text-green-400 border-t border-gray-700">
              {log.map(function (line, i) { return <div key={i}><span className="text-gray-600 select-none">[{String(i + 1).padStart(3, '0')}] </span>{line}</div>; })}
            </div>)}
        </div>
      </div>
    </div>);
};
exports.Grabber = Grabber;
