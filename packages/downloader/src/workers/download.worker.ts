/**
 * Download Worker
 * Runs in a Node.js Worker thread (via worker_threads).
 * Handles a single segment download, reporting progress back to the parent.
 */
import { parentPort, workerData } from 'worker_threads';
import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';

export interface DownloadWorkerInput {
  url: string;
  destPath: string;
  start: number;
  end: number;
  alreadyDownloaded: number;
  headers?: Record<string, string>;
  cookies?: string;
  segmentId: number;
}

export type DownloadWorkerMessage =
  | { type: 'progress'; bytes: number }
  | { type: 'done' }
  | { type: 'error'; message: string };

const {
  url, destPath, start, end, alreadyDownloaded,
  headers = {}, cookies, segmentId,
}: DownloadWorkerInput = workerData;

function run(): void {
  const parsed = new URL(url);
  const lib = parsed.protocol === 'https:' ? https : http;
  const from = start + alreadyDownloaded;

  const reqHeaders: Record<string, string> = {
    ...headers,
    'Range': `bytes=${from}-${end}`,
    'User-Agent': 'IDM-Clone/1.0',
    ...(cookies ? { 'Cookie': cookies } : {}),
  };

  const req = lib.get(
    { hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers: reqHeaders },
    (res) => {
      if (res.statusCode !== 206 && res.statusCode !== 200) {
        send({ type: 'error', message: `HTTP ${res.statusCode}` });
        req.destroy();
        return;
      }

      let fd: number;
      try {
        fd = fs.openSync(destPath, 'r+');
      } catch {
        fd = fs.openSync(destPath, 'w');
      }

      let position = from;

      res.on('data', (chunk: Buffer) => {
        fs.writeSync(fd, chunk, 0, chunk.length, position);
        position += chunk.length;
        send({ type: 'progress', bytes: chunk.length });
      });

      res.on('end', () => {
        fs.closeSync(fd);
        send({ type: 'done' });
      });

      res.on('error', (err) => {
        try { fs.closeSync(fd); } catch {}
        send({ type: 'error', message: err.message });
      });
    }
  );

  req.on('error', (err) => send({ type: 'error', message: err.message }));
  req.setTimeout(30000, () => {
    req.destroy();
    send({ type: 'error', message: 'Connection timed out' });
  });
}

function send(msg: DownloadWorkerMessage): void {
  parentPort?.postMessage(msg);
}

run();
