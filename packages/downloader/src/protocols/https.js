"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpsProtocol = void 0;
// HTTPS uses the same logic as HTTP — Node's https module is used automatically
// based on URL protocol detection in HttpProtocol. This re-exports for explicit use.
var http_1 = require("./http");
Object.defineProperty(exports, "HttpsProtocol", { enumerable: true, get: function () { return http_1.HttpProtocol; } });
