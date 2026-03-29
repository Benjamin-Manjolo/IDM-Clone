/**
 * Merge Worker
 * Concatenates ordered segment temp files into the final output file.
 * Runs in a worker_thread to avoid blocking the main process during large merges.
 */
import { parentPort, workerData } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';

export interface MergeWorkerInput {
  segmentPaths: string[];   // ordered list of temp segment files
  outputPath: string;
  deleteSegments?: boolean;
  bufferSize?: number;
}

export type MergeWorkerMessage =
  | { type: 'progress'; merged: number; total: number }
  | { type: 'done'; outputPath: string }
  | { type: 'error'; message: string };

const {
  segmentPaths,
  outputPath,
  deleteSegments = true,
  bufferSize = 4 * 1024 * 1024, // 4 MB
}: MergeWorkerInput = workerData;

function send(msg: MergeWorkerMessage): void {
  parentPort?.postMessage(msg);
}

async function run(): Promise<void> {
  try {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    const out = fs.createWriteStream(outputPath);
    const total = segmentPaths.length;

    for (let i = 0; i < segmentPaths.length; i++) {
      const segPath = segmentPaths[i]!;

      if (!fs.existsSync(segPath)) {
        send({ type: 'error', message: `Segment missing: ${segPath}` });
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const inp = fs.createReadStream(segPath, { highWaterMark: bufferSize });
        inp.pipe(out, { end: false });
        inp.on('end', () => {
          send({ type: 'progress', merged: i + 1, total });
          if (deleteSegments) {
            try { fs.unlinkSync(segPath); } catch {}
          }
          resolve();
        });
        inp.on('error', reject);
      });
    }

    await new Promise<void>((resolve, reject) => {
      out.end();
      out.on('finish', resolve);
      out.on('error', reject);
    });

    send({ type: 'done', outputPath });
  } catch (err: any) {
    send({ type: 'error', message: err?.message ?? 'Unknown merge error' });
  }
}

run();
