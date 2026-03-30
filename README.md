# IDM Clone — Fix Package

## What to do

1. Extract this zip and copy every file into your project at the matching path, replacing existing files.
2. Run:

```bash
pnpm dev
```

That's it. The root `dev` script now builds all packages in the correct order before starting Electron + Vite.

---

## Files changed and why

### `packages/*/tsconfig.json` (all packages)
**Root cause of the `TS6059 not under rootDir` error:**  
Previously, `paths` pointed to `../shared/src/index.ts` — a raw `.ts` source file. TypeScript pulled that file (and all its transitive imports) into the compilation, which violated `rootDir: ./src`.

**Fix:** Point `paths` to `../shared/dist/index.d.ts` instead. TypeScript uses `.d.ts` files as ambient type declarations — it reads them for type info but does **not** treat them as source files to compile, so `rootDir` is never violated.

This requires `@idm/shared` to be built first (so `dist/index.d.ts` exists), which is guaranteed by the ordered `build:packages` script.

### `packages/*/package.json` (all packages)
- `"main"` changed from `./src/index.ts` → `./dist/index.js`  
- `"types"` added pointing to `./dist/index.d.ts`  
- `"build"` script added: `tsc -p tsconfig.json`

At runtime, Node/Electron resolves `require('@idm/shared')` via the pnpm workspace symlink → `packages/shared` → `main: ./dist/index.js`. This is what makes Electron actually load the compiled JS instead of failing on raw TypeScript.

### `packages/downloader/src/core/downloadManager.ts`
- **TS2367** (`status` comparison): After an `await`, the item's status may have been changed externally (e.g. paused). The fix re-reads status from the Map instead of using the stale local reference.
- **TS18046** (`exts` is unknown): Cast `exts as string[]` when calling `.includes()` since `Object.entries()` types values as `unknown`.

### `packages/scheduler/src/queueManager.ts`
- **TS7006**: Added explicit `: string` type annotation to the `id` parameter in the `.filter()` callback.

### `packages/scheduler/src/timeParser.ts`
- **TS7006**: Added explicit `: number` type annotation to the `d` parameter in the `.map()` callback.

### `config/vite.config.ts`
- Added `extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']`  
  Vite's default order puts `.js` before `.tsx`. Since compiled `.js` files exist alongside `.tsx` sources in `src/`, Vite was picking up the CJS-compiled files containing JSX syntax and crashing. Putting `.tsx` first fixes this.

### `apps/desktop/tsconfig.electron.json`
- `paths` now point to `dist/index.d.ts` for all workspace packages (same fix as above).
- `outDir` set to `dist/electron`, `rootDir` set to `.` to cover the `electron/` subfolder.

### `apps/desktop/package.json`
- `"main"` corrected to `dist/electron/electron/main.js` (matches the `outDir` + source path).

### `package.json` (root)
- Added `build:packages` script that builds workspace packages in dependency order.
- `dev` now runs `build:packages` first so all `dist/` folders exist before Electron or Vite start.
