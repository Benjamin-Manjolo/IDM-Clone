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
 * Merge Worker
 * Concatenates ordered segment temp files into the final output file.
 * Runs in a worker_thread to avoid blocking the main process during large merges.
 */
const worker_threads_1 = require("worker_threads");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const { segmentPaths, outputPath, deleteSegments = true, bufferSize = 4 * 1024 * 1024, // 4 MB
 } = worker_threads_1.workerData;
function send(msg) {
    worker_threads_1.parentPort?.postMessage(msg);
}
async function run() {
    try {
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        const out = fs.createWriteStream(outputPath);
        const total = segmentPaths.length;
        for (let i = 0; i < segmentPaths.length; i++) {
            const segPath = segmentPaths[i];
            if (!fs.existsSync(segPath)) {
                send({ type: 'error', message: `Segment missing: ${segPath}` });
                return;
            }
            await new Promise((resolve, reject) => {
                const inp = fs.createReadStream(segPath, { highWaterMark: bufferSize });
                inp.pipe(out, { end: false });
                inp.on('end', () => {
                    send({ type: 'progress', merged: i + 1, total });
                    if (deleteSegments) {
                        try {
                            fs.unlinkSync(segPath);
                        }
                        catch { }
                    }
                    resolve();
                });
                inp.on('error', reject);
            });
        }
        await new Promise((resolve, reject) => {
            out.end();
            out.on('finish', resolve);
            out.on('error', reject);
        });
        send({ type: 'done', outputPath });
    }
    catch (err) {
        send({ type: 'error', message: err?.message ?? 'Unknown merge error' });
    }
}
run();
