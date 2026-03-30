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
exports.mergeHlsSegments = mergeHlsSegments;
exports.getTempSegmentPath = getTempSegmentPath;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const shared_1 = require("@idm/shared");
async function mergeHlsSegments(opts) {
    const { segmentPaths, outputPath, onProgress, deleteSegments = true } = opts;
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const out = fs.createWriteStream(outputPath);
    let merged = 0;
    const total = segmentPaths.length;
    for (const segPath of segmentPaths) {
        await new Promise((resolve, reject) => {
            const inp = fs.createReadStream(segPath, { highWaterMark: shared_1.MERGE_BUFFER_SIZE });
            inp.on('data', (chunk) => out.write(chunk));
            inp.on('end', () => {
                merged++;
                onProgress?.(merged, total);
                resolve();
            });
            inp.on('error', reject);
        });
        if (deleteSegments) {
            try {
                fs.unlinkSync(segPath);
            }
            catch { }
        }
    }
    await new Promise((resolve, reject) => {
        out.end();
        out.on('finish', resolve);
        out.on('error', reject);
    });
}
function getTempSegmentPath(baseDir, downloadId, seq) {
    const dir = path.join(baseDir, '.hls-segments', downloadId);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `seg-${String(seq).padStart(6, '0')}.ts`);
}
