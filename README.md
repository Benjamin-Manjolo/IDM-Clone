# ⚡ IDM Clone

A cross-platform download manager built with Electron, React, and TypeScript — inspired by [Internet Download Manager](https://www.internetdownloadmanager.com/). Supports HTTP/HTTPS/FTP with dynamic multi-segment acceleration, HLS/DASH video grabbing, site crawling, download scheduling, and a browser extension.

---

## Features

| Feature | Details |
|---|---|
| **Dynamic segmentation** | Splits files into up to 32 parallel segments; dynamically re-splits the largest active segment when a connection becomes available — IDM's core acceleration technique |
| **Download resume** | Persists segment state to disk; survives crashes, power loss, and network drops |
| **Protocol support** | HTTP, HTTPS, FTP (with REST resume), Magnet URIs |
| **Video grabbing** | Detects and downloads HLS (M3U8) and MPEG-DASH streams from any website |
| **Site spider/grabber** | BFS crawler with configurable depth, domain scope, and file-type filters |
| **Scheduler** | Time-based task runner — start/stop downloads at set times, shut down on completion |
| **Download queues** | Organize downloads into named queues with per-queue concurrency and speed limits |
| **Speed limiter** | Token-bucket rate limiting per download and globally |
| **Browser extension** | Chrome MV3 extension intercepts downloads, detects video streams, adds context-menu items |
| **Dark theme** | Full dark/light/system theme support |
| **Categories** | Auto-sorts downloads by type: video, audio, documents, archives, programs, images |
| **Antivirus hook** | Optionally launches a scanner on download completion |
| **Auto-updater** | electron-updater integration for GitHub Releases |

---

## Project Structure

```
idm-clone/
├── apps/
│   ├── desktop/              # Electron + React app
│   │   ├── electron/         # Main process (main.ts, preload.ts, IPC handlers)
│   │   └── src/              # React renderer (components, pages, stores, hooks)
│   └── extension/            # Chrome MV3 browser extension
│
├── packages/
│   ├── shared/               # Types, constants, IPC channel names
│   ├── downloader/           # Core download engine
│   │   ├── core/             # DownloadManager, SegmentManager, ChunkAllocator, ResumeManager
│   │   ├── protocols/        # HTTP, FTP, Magnet
│   │   ├── utils/            # Retry, SpeedLimiter, Checksum, FileWriter
│   │   └── workers/          # download.worker.ts, merge.worker.ts
│   ├── scheduler/            # Scheduler, QueueManager, ShutdownManager
│   ├── video-grabber/        # HLS (M3U8), MPEG-DASH, media detection
│   └── site-grabber/         # BFS crawler, link extractor, filters
│
├── config/                   # tsconfig, vite.config, tailwind, electron-builder
├── scripts/                  # build.js, clean.js, release.js
├── native/                   # Platform-specific helpers (Windows startup/shutdown)
└── assets/                   # Icons, images, sounds
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8

```bash
npm install -g pnpm
```

### Install

```bash
git clone https://github.com/your-username/idm-clone.git
cd idm-clone
pnpm install
```

### Development

```bash
pnpm dev
```

This starts the Vite dev server (port 5173) and Electron simultaneously with hot reload.

### Build

```bash
pnpm build          # Build everything
node scripts/build  # Same, with detailed output
```

### Package for distribution

```bash
node scripts/release --win           # Windows installer
node scripts/release --mac           # macOS DMG
node scripts/release --linux         # AppImage + .deb
node scripts/release --win --publish # Build + upload to GitHub Releases
```

---

## Browser Extension

### Install (Development)

1. Run `pnpm --filter @idm/extension build`
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked** → select `apps/extension/dist/`

The extension connects to the desktop app via WebSocket on port 9182. Start the desktop app first.

---

## Architecture

### Download Acceleration (Dynamic Segmentation)

IDM's speed advantage comes from its dynamic segmentation algorithm, implemented in `packages/downloader/src/core/chunkAllocator.ts`:

1. When a download starts, the file is split into N initial segments and pre-allocated on disk
2. Each segment is downloaded in parallel via range requests (`Range: bytes=X-Y`)
3. When a connection becomes available, the **largest remaining segment** is found and split exactly in half — the new connection starts from the midpoint
4. This continues until `maxConnections` are all busy or all segments are too small to split

This approach ensures all connections stay busy and no time is wasted negotiating new connections.

### IPC Architecture

```
Browser Extension
      │ WebSocket :9182
      ▼
Electron Main Process
  DownloadManager ──── SegmentManager × N
  Scheduler                  │ worker_threads
  QueueManager          download.worker.ts
      │ contextBridge
      ▼
React Renderer (Zustand stores)
  useDownload → downloads.store
  useQueue    → queue.store
  useScheduler→ scheduler.store
```

---

## Configuration

Copy `.env` and edit:

```env
DEFAULT_MAX_CONNECTIONS=8
DEFAULT_CONCURRENT_DOWNLOADS=3
DEFAULT_SPEED_LIMIT=0          # bytes/sec, 0 = unlimited
EXTENSION_PORT=9182
```

Settings are also managed via the in-app Settings page and persisted to `userData/settings.json`.

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © 2024 — IDM Clone contributors
