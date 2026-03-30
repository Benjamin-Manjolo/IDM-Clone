# IDM Clone - Fix Instructions

## Files to copy into your project

Copy each file from this zip into your project at the matching path.
All existing files at those paths should be REPLACED.

## After copying files, run:

```bash
# 1. Build shared package first (others depend on it)
pnpm --filter @idm/shared build

# 2. Build remaining packages
pnpm --filter @idm/downloader build
pnpm --filter @idm/scheduler build
pnpm --filter @idm/video-grabber build
pnpm --filter @idm/site-grabber build

# 3. Start dev
pnpm --filter @idm/desktop dev
```

Or use the new root script:
```bash
pnpm dev
```

## What was fixed

### 1. All packages/*/package.json
- Changed `"main"` from `./src/index.ts` to `./dist/index.js`
- Added `"types"` pointing to `./dist/index.d.ts`
- Added `"build"` script using `tsc -p tsconfig.json`

### 2. All packages/*/tsconfig.json (NEW FILES)
- Each package now has its own tsconfig
- `"module": "CommonJS"` so Node.js (Electron) can require() the output
- `"paths"` mapping `@idm/shared` to the shared source for compilation

### 3. packages/downloader/src/core/downloadManager.ts
- Fixed TS2367: status comparison - read status from map after async operations
- Fixed TS18046: cast `exts` to `string[]` in detectCategory()

### 4. packages/scheduler/src/queueManager.ts
- Fixed TS7006: added explicit `: string` type to `id` parameter in filter callback

### 5. packages/scheduler/src/timeParser.ts
- Fixed TS7006: added explicit `: number` type to `d` parameter in map callback

### 6. config/vite.config.ts
- Added `extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']`
- This ensures Vite picks up .tsx SOURCE files instead of compiled .js files in src/

### 7. apps/desktop/tsconfig.electron.json
- Fixed paths to correctly point to package sources for compilation
- Set `"outDir": "dist/electron"` and `"rootDir": "."`

### 8. apps/desktop/package.json
- Fixed dev script path to compiled electron main

### 9. apps/desktop/electron/preload.ts
- Added UI event channels to allowed list
- Fixed event handler typing

### 10. package.json (root)
- Added `build:packages` script that builds all packages in correct order
- Updated `dev` to build packages first
