import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// The desktop app is at apps/desktop — its node_modules has react installed.
// This config lives in config/ so we need to tell Vite where to find
// node_modules for the actual app.
const DESKTOP = path.resolve(__dirname, '../apps/desktop');
const ROOT    = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],

  // Resolve node_modules from the desktop app (where react is installed)
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@idm/shared':       path.resolve(ROOT, 'packages/shared/src/index.ts'),
      '@idm/downloader':   path.resolve(ROOT, 'packages/downloader/src/index.ts'),
      '@idm/scheduler':    path.resolve(ROOT, 'packages/scheduler/src/index.ts'),
      '@idm/video-grabber':path.resolve(ROOT, 'packages/video-grabber/src/index.ts'),
      '@idm/site-grabber': path.resolve(ROOT, 'packages/site-grabber/src/index.ts'),
      '@':                 path.resolve(DESKTOP, 'src'),
    },
  },

  // Tell Vite to look for node_modules in the desktop app directory too
  root: DESKTOP,

  build: {
    outDir: path.resolve(DESKTOP, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(DESKTOP, 'index.html'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
  },

  base: './',

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
  },
});
