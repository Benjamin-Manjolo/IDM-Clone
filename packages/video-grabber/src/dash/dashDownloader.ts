import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { parseMPD, getBestRepresentation, buildSegmentUrls } from './mpdParser';
import type { DashManifest, DashRepresentation } from './mpdParser';

export interface DashDownloadOptions {
  mpdUrl: string;
  outputPath: string;
  maxBandwidth?: number;
  headers?: Record<string, string>;
  onProgress?: (downloaded: number, total: number) => void;
}

export class DashDownloader {
  async download(opts: DashDownloadOptions): Promise<void> {
    const { mpdUrl, outputPath, maxBandwidth, headers = {}, onProgress } = opts;

    // Fetch and parse manifest
    const mpdContent = await this.fetch(mpdUrl, headers);
    const manifest = parseMPD(mpdContent, mpdUrl);

    const videoAdapt = manifest.adaptationSets.find(a => a.contentType === 'video');
    const audioAdapt = manifest.adaptationSets.find(a => a.contentType === 'audio');

    if (!videoAdapt) throw new Error('No video adaptation set found in MPD');

    const videoRepr = getBestRepresentation(videoAdapt, maxBandwidth);
    if (!videoRepr) throw new Error('No suitable video representation found');

    const totalDur = manifest.mediaPresentationDuration ?? 0;
    const videoSegments = buildSegmentUrls(videoRepr, totalDur, manifest.baseUrl ?? mpdUrl);

    const tmpDir = path.join(path.dirname(outputPath), '.dash-tmp');
    fs.mkdirSync(tmpDir, { recursive: true });

    // Download initialization segment
    if (videoRepr.initialization) {
      const initPath = path.join(tmpDir, 'init.mp4');
      await this.downloadSegment(videoRepr.initialization, initPath, headers);
    }

    let downloaded = 0;
    const total = videoSegments.length;

    for (let i = 0; i < videoSegments.length; i++) {
      const segPath = path.join(tmpDir, `seg-${String(i).padStart(6, '0')}.m4s`);
      await this.downloadSegment(videoSegments[i]!, segPath, headers);
      downloaded++;
      onProgress?.(downloaded, total);
    }

    // Concatenate init + segments
    await this.concatenate(tmpDir, outputPath);

    // Cleanup
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }

  private fetch(url: string, headers: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data));
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  private downloadSegment(url: string, destPath: string, headers: Record<string, string>): Promise<void> {
    return new Promise((resolve, reject) => {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      lib.get({ hostname: parsed.hostname, port: parsed.port, path: parsed.pathname + parsed.search, headers }, (res) => {
        const stream = fs.createWriteStream(destPath);
        res.pipe(stream);
        stream.on('finish', resolve);
        stream.on('error', reject);
        res.on('error', reject);
      }).on('error', reject);
    });
  }

  private async concatenate(tmpDir: string, outputPath: string): Promise<void> {
    const files = fs.readdirSync(tmpDir).sort().map(f => path.join(tmpDir, f));
    const out = fs.createWriteStream(outputPath);
    for (const file of files) {
      await new Promise<void>((resolve, reject) => {
        const inp = fs.createReadStream(file);
        inp.pipe(out, { end: false });
        inp.on('end', resolve);
        inp.on('error', reject);
      });
    }
    await new Promise<void>((resolve, reject) => {
      out.end();
      out.on('finish', resolve);
      out.on('error', reject);
    });
  }
}