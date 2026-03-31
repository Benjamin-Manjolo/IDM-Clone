# Fix @idm/downloader Module Resolution in Electron Packaged App

## [x] 0. Plan approved by user

## [x] 1. No new deps needed (uses existing vite)

## [x] 2. Create Vite config for main process
   - Created apps/desktop/electron/vite.config.main.ts

## [x] 3. Update apps/desktop/package.json build scripts to use vite build for main

## [x] 4. Updated electron-builder.yml

## [x] 5. Bundling setup complete, ready for test (run pnpm --filter @idm/desktop package)

## [ ] 6. Test package: pnpm --filter @idm/desktop package

## [ ] 7. Run packaged app to verify fix

