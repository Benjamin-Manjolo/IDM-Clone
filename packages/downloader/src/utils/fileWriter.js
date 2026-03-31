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
exports.ensureDir = ensureDir;
exports.preallocate = preallocate;
exports.resolveConflict = resolveConflict;
exports.deleteFile = deleteFile;
exports.getFileSize = getFileSize;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}
function preallocate(filePath, size) {
    ensureDir(path.dirname(filePath));
    const fd = fs.openSync(filePath, 'w');
    if (size > 0)
        fs.ftruncateSync(fd, size);
    fs.closeSync(fd);
}
function resolveConflict(filePath, strategy) {
    if (!fs.existsSync(filePath))
        return filePath;
    if (strategy === 'overwrite') {
        fs.unlinkSync(filePath);
        return filePath;
    }
    if (strategy === 'skip')
        return null;
    // rename: add (1), (2), ... suffix
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const base = path.basename(filePath, ext);
    let i = 1;
    while (true) {
        const candidate = path.join(dir, `${base} (${i})${ext}`);
        if (!fs.existsSync(candidate))
            return candidate;
        i++;
    }
}
function deleteFile(filePath) {
    if (fs.existsSync(filePath))
        fs.unlinkSync(filePath);
}
function getFileSize(filePath) {
    try {
        return fs.statSync(filePath).size;
    }
    catch {
        return 0;
    }
}
//# sourceMappingURL=fileWriter.js.map