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
exports.ResumeManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ResumeManager {
    constructor(baseDir) {
        this.resumeDir = path.join(baseDir, '.idm-resume');
        fs.mkdirSync(this.resumeDir, { recursive: true });
    }
    filePath(id) {
        return path.join(this.resumeDir, `${id}.json`);
    }
    save(data) {
        const updated = { ...data, updatedAt: Date.now() };
        fs.writeFileSync(this.filePath(data.id), JSON.stringify(updated, null, 2), 'utf8');
    }
    load(id) {
        const fp = this.filePath(id);
        if (!fs.existsSync(fp))
            return null;
        try {
            return JSON.parse(fs.readFileSync(fp, 'utf8'));
        }
        catch {
            return null;
        }
    }
    delete(id) {
        const fp = this.filePath(id);
        if (fs.existsSync(fp))
            fs.unlinkSync(fp);
    }
    listAll() {
        try {
            return fs.readdirSync(this.resumeDir)
                .filter(f => f.endsWith('.json'))
                .map(f => {
                try {
                    return JSON.parse(fs.readFileSync(path.join(this.resumeDir, f), 'utf8'));
                }
                catch {
                    return null;
                }
            })
                .filter(Boolean);
        }
        catch {
            return [];
        }
    }
    /**
     * Update only the segment state — called frequently during download.
     */
    updateSegments(id, segments, downloadedSize) {
        const existing = this.load(id);
        if (!existing)
            return;
        this.save({ ...existing, segments, downloadedSize });
    }
}
exports.ResumeManager = ResumeManager;
//# sourceMappingURL=resumeManager.js.map