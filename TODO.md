## TODO - Fix IDM Clone TypeScript Monorepo Build Issues

**Status: In Progress**

### Step 1: ✅ Create TODO.md 
### Step 2: ✅ Read and verify relevant tsconfig files 
### Step 3: ✅ Edit apps/desktop/tsconfig.electron.json - Fix paths to dist/
- Changed paths from src/index.ts → dist/index.d.ts
- Fixed JSON formatting with proper indentation and commas

### Step 4: ⏳ Edit package tsconfigs - Add "composite": true (Next)
- packages/shared/tsconfig.json
- packages/downloader/tsconfig.json  
- packages/scheduler/tsconfig.json
- packages/video-grabber/tsconfig.json
- packages/site-grabber/tsconfig.json

### Step 5: Refresh pnpm workspace
- `pnpm install`

### Step 6: Build packages
- `pnpm run build:packages`

### Step 7: Test desktop dev
- `pnpm --filter @idm/desktop dev`

### Step 8: ✅ Verify no TS6059 errors, clean compilation
