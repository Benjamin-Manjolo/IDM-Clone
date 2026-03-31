# Fix: Blank UI in Electron Dev Mode

## Root Cause

Two things go wrong when you run `pnpm dev` or `electron` directly:

1. **Electron launches before Vite is ready** — `main.ts` tries to load
   `http://localhost:5173` but nothing is listening yet, so the window stays blank.

2. **`preload.js` is missing** — The compiled `preload.js` doesn't exist in
   `dist/electron/electron/`, so `contextBridge` never runs, `window.idm` is
   undefined, and the renderer crashes silently.

3. **`tsconfig.electron.json` is missing** — The desktop app has no dedicated
   tsconfig for compiling the Electron main + preload files.

---

## Fix — Step by Step

### 1. Add `tsconfig.electron.json`

Copy `tsconfig.electron.json` (provided) into `apps/desktop/`:

```
apps/desktop/tsconfig.electron.json   ← place here
```

### 2. Add the dev launcher

Copy `dev.js` (provided) into your **repo root**:

```
dev.js   ← place in repo root (same level as package.json)
```

### 3. Build packages once

```bash
pnpm --filter @idm/shared build
pnpm --filter @idm/downloader build
pnpm --filter @idm/scheduler build
pnpm --filter @idm/video-grabber build
pnpm --filter @idm/site-grabber build
```

### 4. Run the fixed dev launcher

```bash
node dev.js
```

This script:
- Builds all packages
- Compiles `electron/main.ts` + `electron/preload.ts` → `dist/electron/electron/`
- Starts Vite on port 5173
- **Waits** until Vite responds before launching Electron
- Launches Electron with `NODE_ENV=development`

---

## Why the old `pnpm dev` command was broken

The script in `apps/desktop/package.json` was:

```json
"dev": "concurrently \"vite ...\" \"tsc ... && electron dist/.../main.js\""
```

`concurrently` starts both processes at the same time. The `tsc && electron`
side finishes compiling and launches Electron in ~2–3 seconds, but Vite often
takes 5–10 seconds to start. Electron calls `win.loadURL('http://localhost:5173')`
when nothing is there yet → blank screen.

The new `dev.js` uses an HTTP poll loop to wait for Vite before launching
Electron, which eliminates the race condition.

---

## Optional: update `package.json` scripts

You can replace the broken dev script in `apps/desktop/package.json`:

```json
"dev": "node ../../dev.js"
```

Or just always run `node dev.js` from the repo root.

---

## Quick sanity checklist

| Check | Command |
|-------|---------|
| Packages built? | `ls packages/shared/dist/index.js` |
| Electron compiled? | `ls apps/desktop/dist/electron/electron/main.js` |
| Preload compiled? | `ls apps/desktop/dist/electron/electron/preload.js` |
| Vite running? | `curl http://localhost:5173` |
