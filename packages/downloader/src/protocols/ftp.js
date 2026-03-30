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
exports.FtpProtocol = void 0;
const events_1 = require("events");
const net = __importStar(require("net"));
const fs = __importStar(require("fs"));
class FtpProtocol extends events_1.EventEmitter {
    async probe(url) {
        const parsed = new URL(url);
        const filename = parsed.pathname.split('/').pop();
        return new Promise((resolve, reject) => {
            const client = net.createConnection({ host: parsed.hostname, port: parseInt(parsed.port || '21', 10) });
            let contentLength = -1;
            let buffer = '';
            let step = 0;
            const username = parsed.username || 'anonymous';
            const password = parsed.password || 'anonymous@';
            client.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\r\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    const code = parseInt(line.slice(0, 3), 10);
                    if (code === 220 && step === 0) {
                        client.write(`USER ${username}\r\n`);
                        step = 1;
                    }
                    else if (code === 331 && step === 1) {
                        client.write(`PASS ${password}\r\n`);
                        step = 2;
                    }
                    else if (code === 230 && step === 2) {
                        client.write(`TYPE I\r\n`);
                        step = 3;
                    }
                    else if (code === 200 && step === 3) {
                        client.write(`SIZE ${parsed.pathname}\r\n`);
                        step = 4;
                    }
                    else if (code === 213 && step === 4) {
                        contentLength = parseInt(line.slice(4).trim(), 10);
                        client.write('QUIT\r\n');
                        step = 5;
                    }
                    else if (code === 221 && step === 5) {
                        client.destroy();
                        resolve({ contentLength, resumable: true, filename });
                    }
                }
            });
            client.on('error', reject);
            client.setTimeout(15000, () => { client.destroy(); reject(new Error('FTP timeout')); });
        });
    }
    async download(options) {
        const { url, destPath, startByte = 0, onProgress } = options;
        const parsed = new URL(url);
        const username = parsed.username || 'anonymous';
        const password = parsed.password || 'anonymous@';
        return new Promise((resolve, reject) => {
            const control = net.createConnection({ host: parsed.hostname, port: parseInt(parsed.port || '21', 10) });
            let buffer = '';
            let step = 0;
            let pasvHost = '';
            let pasvPort = 0;
            const getPassiveAddr = (pasvLine) => {
                const match = pasvLine.match(/\((\d+),(\d+),(\d+),(\d+),(\d+),(\d+)\)/);
                if (!match)
                    throw new Error('Invalid PASV response');
                const [, h1, h2, h3, h4, p1, p2] = match.map(Number);
                return { host: `${h1}.${h2}.${h3}.${h4}`, port: (p1 * 256) + p2 };
            };
            control.on('data', (data) => {
                buffer += data.toString();
                const lines = buffer.split('\r\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                    const code = parseInt(line.slice(0, 3), 10);
                    if (code === 220 && step === 0) {
                        control.write(`USER ${username}\r\n`);
                        step = 1;
                    }
                    else if (code === 331 && step === 1) {
                        control.write(`PASS ${password}\r\n`);
                        step = 2;
                    }
                    else if (code === 230 && step === 2) {
                        control.write(`TYPE I\r\n`);
                        step = 3;
                    }
                    else if (code === 200 && step === 3) {
                        control.write('PASV\r\n');
                        step = 4;
                    }
                    else if (code === 227 && step === 4) {
                        const addr = getPassiveAddr(line);
                        pasvHost = addr.host;
                        pasvPort = addr.port;
                        if (startByte > 0) {
                            control.write(`REST ${startByte}\r\n`);
                            step = 5;
                        }
                        else {
                            control.write(`RETR ${parsed.pathname}\r\n`);
                            step = 6;
                        }
                    }
                    else if (code === 350 && step === 5) {
                        control.write(`RETR ${parsed.pathname}\r\n`);
                        step = 6;
                    }
                    else if ((code === 150 || code === 125) && step === 6) {
                        const data = net.createConnection({ host: pasvHost, port: pasvPort });
                        const fd = fs.openSync(destPath, startByte > 0 ? 'r+' : 'w');
                        let position = startByte;
                        data.on('data', (chunk) => {
                            fs.writeSync(fd, chunk, 0, chunk.length, position);
                            position += chunk.length;
                            onProgress?.(chunk.length);
                        });
                        data.on('end', () => { fs.closeSync(fd); control.write('QUIT\r\n'); });
                        data.on('error', (err) => { fs.closeSync(fd); reject(err); });
                    }
                    else if (code === 226) {
                        control.destroy();
                        resolve();
                    }
                    else if (code >= 400) {
                        control.destroy();
                        reject(new Error(`FTP error: ${line}`));
                    }
                }
            });
            control.on('error', reject);
        });
    }
}
exports.FtpProtocol = FtpProtocol;
