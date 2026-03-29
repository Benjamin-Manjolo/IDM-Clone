"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSettingsStore = void 0;
var zustand_1 = require("zustand");
var immer_1 = require("zustand/middleware/immer");
exports.useSettingsStore = (0, zustand_1.create)()((0, immer_1.immer)(function (set) { return ({
    settings: null,
    loaded: false,
    setSettings: function (s) { return set(function (st) {
        st.settings = s;
        st.loaded = true;
    }); },
    patchSettings: function (partial) { return set(function (st) {
        if (!st.settings)
            return;
        Object.assign(st.settings, partial);
    }); },
}); }));
