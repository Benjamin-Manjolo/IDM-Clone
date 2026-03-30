"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownManager = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class ShutdownManager {
    async execute(action) {
        switch (action) {
            case 'shutdown': return this.shutdown();
            case 'hibernate': return this.hibernate();
            case 'sleep': return this.sleep();
            case 'start':
            case 'stop':
                return; // handled by scheduler
        }
    }
    async shutdown() {
        switch (process.platform) {
            case 'win32':
                await execAsync('shutdown /s /t 0');
                break;
            case 'darwin':
                await execAsync('sudo shutdown -h now');
                break;
            default:
                await execAsync('sudo shutdown -h now');
                break;
        }
    }
    async hibernate() {
        switch (process.platform) {
            case 'win32':
                await execAsync('shutdown /h');
                break;
            case 'darwin':
                await execAsync('sudo pmset sleepnow');
                break;
            default:
                await execAsync('sudo systemctl hibernate');
                break;
        }
    }
    async sleep() {
        switch (process.platform) {
            case 'win32':
                await execAsync('rundll32.exe powrprof.dll,SetSuspendState 0,1,0');
                break;
            case 'darwin':
                await execAsync('pmset sleepnow');
                break;
            default:
                await execAsync('sudo systemctl suspend');
                break;
        }
    }
}
exports.ShutdownManager = ShutdownManager;
