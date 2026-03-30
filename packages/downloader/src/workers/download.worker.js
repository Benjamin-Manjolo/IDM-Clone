"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Download Worker
 * Runs in a Node.js Worker thread (via worker_threads).
 * Handles a single segment download, reporting progress back to the parent.
 */
const worker_threads_1 = require("worker_threads");
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const { url, destPath, start, end, alreadyDownloaded, headers = {}, cookies, segmentId, } = worker_threads_1.workerData;
function run() {
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const from = start + alreadyDownloaded;
    const reqHeaders = {
        ...headers,
        'Range': `bytes=${from}-${end}`,
        'User-Agent': 'IDM-Clone/1.0',
        ...(cookies ? { 'Cookie': cookies } : {}),
    };
    const req = lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers: reqHeaders }, (res) => {
        if (res.statusCode !== 206 && res.statusCode !== 200) {
            send({ type: 'error', message: `HTTP ${res.statusCode}` });
            req.destroy();
            return;
        }
        let fd;
        try {
            fd = fs.openSync(destPath, 'r+');
        }
        catch {
            fd = fs.openSync(destPath, 'w');
        }
        let position = from;
        res.on('data', (chunk) => {
            fs.writeSync(fd, chunk, 0, chunk.length, position);
            position += chunk.length;
            send({ type: 'progress', bytes: chunk.length });
        });
        res.on('end', () => {
            fs.closeSync(fd);
            send({ type: 'done' });
        });
        res.on('error', (err) => {
            try {
                fs.closeSync(fd);
            }
            catch { }
            send({ type: 'error', message: err.message });
        });
    });
    req.on('error', (err) => send({ type: 'error', message: err.message }));
    req.setTimeout(30000, () => {
        req.destroy();
        send({ type: 'error', message: 'Connection timed out' });
    });
}
function send(msg) {
    worker_threads_1.parentPort?.postMessage(msg);
}
run();
