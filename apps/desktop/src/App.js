"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var Sidebar_1 = require("./components/Sidebar");
var Home_1 = require("./pages/Home");
var Queue_1 = require("./pages/Queue");
var Scheduler_1 = require("./pages/Scheduler");
var Grabber_1 = require("./pages/Grabber");
var Categories_1 = require("./pages/Categories");
var Settings_1 = require("./pages/Settings");
var settings_store_1 = require("./store/settings.store");
var AppInner = function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var settings = (0, settings_store_1.useSettingsStore)().settings;
    // Apply theme
    (0, react_1.useEffect)(function () {
        var _a;
        var root = document.documentElement;
        var theme = (_a = settings === null || settings === void 0 ? void 0 : settings.theme) !== null && _a !== void 0 ? _a : 'system';
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var useDark = theme === 'dark' || (theme === 'system' && prefersDark);
        root.classList.toggle('dark', useDark);
    }, [settings === null || settings === void 0 ? void 0 : settings.theme]);
    // Listen for menu navigation events from main process
    (0, react_1.useEffect)(function () {
        var off = window.idm.on('ui:nav', function (path) { return navigate(path); });
        return off;
    }, [navigate]);
    return (<div className="flex h-screen overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar_1.Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <react_router_dom_1.Routes>
          <react_router_dom_1.Route path="/" element={<Home_1.Home />}/>
          <react_router_dom_1.Route path="/queue" element={<Queue_1.Queue />}/>
          <react_router_dom_1.Route path="/scheduler" element={<Scheduler_1.Scheduler />}/>
          <react_router_dom_1.Route path="/grabber" element={<Grabber_1.Grabber />}/>
          <react_router_dom_1.Route path="/categories" element={<Categories_1.Categories />}/>
          <react_router_dom_1.Route path="/settings" element={<Settings_1.Settings />}/>
        </react_router_dom_1.Routes>
      </main>
    </div>);
};
var App = function () { return (<react_router_dom_1.MemoryRouter>
    <AppInner />
  </react_router_dom_1.MemoryRouter>); };
exports.default = App;
