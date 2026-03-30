import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@idm/shared': path.resolve(__dirname, '../../../packages/shared/src/index.ts'),
      '@idm/downloader': path.resolve(__dirname, '../../../packages/downloader/dist/index.js'),
      '@idm/scheduler': path.resolve(__dirname, '../../../packages/scheduler/dist/index.js'),
      '@idm/video-grabber': path.resolve(__dirname, '../../../packages/video-grabber/src/index.ts'),
      '@idm/site-grabber': path.resolve(__dirname, '../../../packages/site-grabber/src/index.ts'),
    },
  },
  build: {
    target: 'node18',
    outDir: 'dist/electron/electron',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'main.ts'),
      output: {
        format: 'cjs',
        entryFileNames: 'main.js',
      },
      external: ['electron', 'electron-updater'],
    },
  },
});
