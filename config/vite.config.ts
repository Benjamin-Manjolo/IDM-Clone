import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const DESKTOP = path.resolve(__dirname, '../apps/desktop');
const ROOT    = path.resolve(__dirname, '..');

export default defineConfig({
  plugins: [react()],

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      // shared types/constants are browser-safe — use source directly
      '@idm/shared': path.resolve(ROOT, 'packages/shared/src/index.ts'),

      // These packages contain Node.js-only code (fs, child_process, net…).
      // Point them at thin browser-safe shims so the renderer never tries to
      // bundle child_process, fs, net, worker_threads, etc.
      '@idm/scheduler':    path.resolve(ROOT, 'packages/scheduler/src/scheduler-browser-shim.ts'),
      '@idm/downloader':   path.resolve(ROOT, 'packages/downloader/src/downloader-browser-shim.ts'),
      '@idm/video-grabber':path.resolve(ROOT, 'packages/video-grabber/src/video-grabber-browser-shim.ts'),
      '@idm/site-grabber': path.resolve(ROOT, 'packages/site-grabber/src/site-grabber-browser-shim.ts'),

      '@': path.resolve(DESKTOP, 'src'),
    },
  },

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
    exclude: ['electron'],
  },
});
