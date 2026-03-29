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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
var react_1 = require("react");
var settings_store_1 = require("../store/settings.store");
var TABS = [
    { key: 'general', icon: '⚙️', label: 'General' },
    { key: 'connection', icon: '🔗', label: 'Connection' },
    { key: 'save', icon: '💾', label: 'Save Paths' },
    { key: 'integration', icon: '🧩', label: 'Integration' },
    { key: 'notifications', icon: '🔔', label: 'Notifications' },
    { key: 'antivirus', icon: '🛡', label: 'Antivirus' },
];
var Settings = function () {
    var _a, _b, _c, _d;
    var _e = (0, settings_store_1.useSettingsStore)(), settings = _e.settings, setSettings = _e.setSettings, patchSettings = _e.patchSettings;
    var _f = (0, react_1.useState)('general'), activeTab = _f[0], setActiveTab = _f[1];
    var _g = (0, react_1.useState)(false), saved = _g[0], setSaved = _g[1];
    (0, react_1.useEffect)(function () {
        window.idm.settings.get().then(function (s) { return setSettings(s); });
    }, []);
    var patch = function (partial) { return __awaiter(void 0, void 0, void 0, function () {
        var updated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    patchSettings(partial);
                    return [4 /*yield*/, window.idm.settings.set(partial)];
                case 1:
                    updated = _a.sent();
                    setSettings(updated);
                    setSaved(true);
                    setTimeout(function () { return setSaved(false); }, 1500);
                    return [2 /*return*/];
            }
        });
    }); };
    if (!settings)
        return <div className="flex items-center justify-center h-full text-gray-400">Loading settings…</div>;
    var s = settings;
    return (<div className="flex h-full bg-white dark:bg-gray-900">
      {/* Tab sidebar */}
      <div className="w-44 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5">
        <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-600">Settings</p>
        {TABS.map(function (tab) { return (<button key={tab.key} onClick={function () { return setActiveTab(tab.key); }} className={"w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ".concat(activeTab === tab.key ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800')}>
            <span>{tab.icon}</span>{tab.label}
          </button>); })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg">
          {saved && (<div className="mb-4 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800">
              ✓ Settings saved
            </div>)}

          {/* ── General ── */}
          {activeTab === 'general' && (<Section title="General">
              <Row label="Theme">
                <select value={s.theme} onChange={function (e) { return patch({ theme: e.target.value }); }} className={sel}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </Row>
              <Toggle label="Start minimized to tray" checked={s.startMinimized} onChange={function (v) { return patch({ startMinimized: v }); }}/>
              <Toggle label="Minimize to tray on close" checked={s.minimizeToTray} onChange={function (v) { return patch({ minimizeToTray: v }); }}/>
              <Toggle label="Show speed in tray" checked={s.showSpeedInTray} onChange={function (v) { return patch({ showSpeedInTray: v }); }}/>
              <Toggle label="Check for updates automatically" checked={s.checkForUpdates} onChange={function (v) { return patch({ checkForUpdates: v }); }}/>
            </Section>)}

          {/* ── Connection ── */}
          {activeTab === 'connection' && (<Section title="Connection">
              <Row label={"Max connections per download: ".concat(s.connection.maxConnections)}>
                <input type="range" min={1} max={32} value={s.connection.maxConnections} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { maxConnections: +e.target.value }) }); }} className="w-full accent-blue-600"/>
              </Row>
              <Row label={"Max concurrent downloads: ".concat(s.connection.maxConcurrentDownloads)}>
                <input type="range" min={1} max={10} value={s.connection.maxConcurrentDownloads} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { maxConcurrentDownloads: +e.target.value }) }); }} className="w-full accent-blue-600"/>
              </Row>
              <Row label="Global speed limit (KB/s, 0 = unlimited)">
                <input type="number" min={0} value={Math.round(s.connection.globalSpeedLimit / 1024)} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { globalSpeedLimit: +e.target.value * 1024 }) }); }} className={inp}/>
              </Row>
              <Row label="Connection timeout (seconds)">
                <input type="number" min={5} max={120} value={Math.round(s.connection.connectionTimeout / 1000)} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { connectionTimeout: +e.target.value * 1000 }) }); }} className={inp}/>
              </Row>
              <Row label="Retry count">
                <input type="number" min={0} max={20} value={s.connection.retryCount} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { retryCount: +e.target.value }) }); }} className={inp}/>
              </Row>

              <Toggle label="Use proxy" checked={s.connection.useProxy} onChange={function (v) { return patch({ connection: __assign(__assign({}, s.connection), { useProxy: v }) }); }}/>
              {s.connection.useProxy && (<div className="ml-4 space-y-3 mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Row label="Proxy type">
                    <select value={s.connection.proxyType} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { proxyType: e.target.value }) }); }} className={sel}>
                      <option value="http">HTTP</option>
                      <option value="socks4">SOCKS4</option>
                      <option value="socks5">SOCKS5</option>
                    </select>
                  </Row>
                  <Row label="Host">
                    <input type="text" value={(_a = s.connection.proxyHost) !== null && _a !== void 0 ? _a : ''} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { proxyHost: e.target.value }) }); }} className={inp} placeholder="proxy.example.com"/>
                  </Row>
                  <Row label="Port">
                    <input type="number" value={(_b = s.connection.proxyPort) !== null && _b !== void 0 ? _b : 8080} onChange={function (e) { return patch({ connection: __assign(__assign({}, s.connection), { proxyPort: +e.target.value }) }); }} className={inp}/>
                  </Row>
                </div>)}
            </Section>)}

          {/* ── Save paths ── */}
          {activeTab === 'save' && (<Section title="Save Paths">
              <Row label="Default download folder">
                <div className="flex gap-2">
                  <input type="text" value={s.save.defaultDownloadDir} onChange={function (e) { return patch({ save: __assign(__assign({}, s.save), { defaultDownloadDir: e.target.value }) }); }} className={"".concat(inp, " flex-1")}/>
                  <button onClick={function () { return __awaiter(void 0, void 0, void 0, function () {
                var dir;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, window.idm.system.openDir()];
                        case 1:
                            dir = _a.sent();
                            if (dir)
                                patch({ save: __assign(__assign({}, s.save), { defaultDownloadDir: dir }) });
                            return [2 /*return*/];
                    }
                });
            }); }} className={browseBtn}>Browse</button>
                </div>
              </Row>
              <Row label="Temp folder">
                <div className="flex gap-2">
                  <input type="text" value={s.save.tempDir} onChange={function (e) { return patch({ save: __assign(__assign({}, s.save), { tempDir: e.target.value }) }); }} className={"".concat(inp, " flex-1")}/>
                  <button onClick={function () { return __awaiter(void 0, void 0, void 0, function () {
                var dir;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, window.idm.system.openDir()];
                        case 1:
                            dir = _a.sent();
                            if (dir)
                                patch({ save: __assign(__assign({}, s.save), { tempDir: dir }) });
                            return [2 /*return*/];
                    }
                });
            }); }} className={browseBtn}>Browse</button>
                </div>
              </Row>
              <Row label="Filename conflict">
                <select value={s.save.filenameConflict} onChange={function (e) { return patch({ save: __assign(__assign({}, s.save), { filenameConflict: e.target.value }) }); }} className={sel}>
                  <option value="rename">Auto rename</option>
                  <option value="overwrite">Overwrite</option>
                  <option value="skip">Skip</option>
                  <option value="ask">Ask each time</option>
                </select>
              </Row>
              <Toggle label="Create category subfolders" checked={s.save.createCategoryDirs} onChange={function (v) { return patch({ save: __assign(__assign({}, s.save), { createCategoryDirs: v }) }); }}/>
              <Toggle label="Delete incomplete files on cancel" checked={s.save.deleteIncomplete} onChange={function (v) { return patch({ save: __assign(__assign({}, s.save), { deleteIncomplete: v }) }); }}/>
            </Section>)}

          {/* ── Integration ── */}
          {activeTab === 'integration' && (<Section title="Browser Integration">
              <Toggle label="Enable browser extension integration" checked={s.integration.browserExtensionEnabled} onChange={function (v) { return patch({ integration: __assign(__assign({}, s.integration), { browserExtensionEnabled: v }) }); }}/>
              <Toggle label="Catch all downloads automatically" checked={s.integration.catchAllDownloads} onChange={function (v) { return patch({ integration: __assign(__assign({}, s.integration), { catchAllDownloads: v }) }); }}/>
              <Toggle label="Monitor clipboard for URLs" checked={s.integration.monitorClipboard} onChange={function (v) { return patch({ integration: __assign(__assign({}, s.integration), { monitorClipboard: v }) }); }}/>
              <Row label="Extension port">
                <input type="number" value={s.integration.extensionPort} onChange={function (e) { return patch({ integration: __assign(__assign({}, s.integration), { extensionPort: +e.target.value }) }); }} className={inp}/>
              </Row>
              <Row label="Min file size to intercept (KB)">
                <input type="number" min={0} value={Math.round(s.integration.minFileSizeToCatch / 1024)} onChange={function (e) { return patch({ integration: __assign(__assign({}, s.integration), { minFileSizeToCatch: +e.target.value * 1024 }) }); }} className={inp}/>
              </Row>
            </Section>)}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (<Section title="Notifications">
              <Toggle label="Play sound on download complete" checked={s.notifications.soundOnComplete} onChange={function (v) { return patch({ notifications: __assign(__assign({}, s.notifications), { soundOnComplete: v }) }); }}/>
              <Toggle label="Play sound on error" checked={s.notifications.soundOnError} onChange={function (v) { return patch({ notifications: __assign(__assign({}, s.notifications), { soundOnError: v }) }); }}/>
              <Toggle label="Show desktop notifications" checked={s.notifications.showDesktopNotification} onChange={function (v) { return patch({ notifications: __assign(__assign({}, s.notifications), { showDesktopNotification: v }) }); }}/>
            </Section>)}

          {/* ── Antivirus ── */}
          {activeTab === 'antivirus' && (<Section title="Antivirus Scanning">
              <Toggle label="Scan downloaded files automatically" checked={s.antivirus.enabled} onChange={function (v) { return patch({ antivirus: __assign(__assign({}, s.antivirus), { enabled: v }) }); }}/>
              {s.antivirus.enabled && (<div className="space-y-3 mt-2">
                  <Row label="Scanner executable path">
                    <div className="flex gap-2">
                      <input type="text" value={(_c = s.antivirus.scannerPath) !== null && _c !== void 0 ? _c : ''} onChange={function (e) { return patch({ antivirus: __assign(__assign({}, s.antivirus), { scannerPath: e.target.value }) }); }} className={"".concat(inp, " flex-1")} placeholder="/usr/bin/clamscan"/>
                      <button onClick={function () { return __awaiter(void 0, void 0, void 0, function () {
                    var f;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, window.idm.system.saveFile('')];
                            case 1:
                                f = _a.sent();
                                if (f)
                                    patch({ antivirus: __assign(__assign({}, s.antivirus), { scannerPath: f }) });
                                return [2 /*return*/];
                        }
                    });
                }); }} className={browseBtn}>Browse</button>
                    </div>
                  </Row>
                  <Row label="Scanner arguments">
                    <input type="text" value={(_d = s.antivirus.scannerArgs) !== null && _d !== void 0 ? _d : ''} onChange={function (e) { return patch({ antivirus: __assign(__assign({}, s.antivirus), { scannerArgs: e.target.value }) }); }} className={inp} placeholder="%f"/>
                  </Row>
                </div>)}
            </Section>)}
        </div>
      </div>
    </div>);
};
exports.Settings = Settings;
// ── Helpers ────────────────────────────────────────────────────────────────────
var sel = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
var inp = 'w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
var browseBtn = 'px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0';
var Section = function (_a) {
    var title = _a.title, children = _a.children;
    return (<div className="space-y-4">
    <h2 className="text-sm font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">{title}</h2>
    {children}
  </div>);
};
var Row = function (_a) {
    var label = _a.label, children = _a.children;
    return (<div className="space-y-1">
    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block">{label}</label>
    {children}
  </div>);
};
var Toggle = function (_a) {
    var label = _a.label, checked = _a.checked, onChange = _a.onChange;
    return (<label className="flex items-center justify-between py-1 cursor-pointer group">
    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
    <div onClick={function () { return onChange(!checked); }} className={"relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ".concat(checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600')}>
      <div className={"absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ".concat(checked ? 'translate-x-4' : '')}/>
    </div>
  </label>);
};
