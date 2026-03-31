import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // .tsx/.ts must come before .js so Vite picks up TypeScript sources
    // instead of any compiled .js files sitting in src/
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@idm/shared': path.resolve(__dirname, '../packages/shared/src/index.ts'),
      '@idm/downloader': path.resolve(__dirname, '../packages/downloader/src/index.ts'),
      '@idm/scheduler': path.resolve(__dirname, '../packages/scheduler/src/index.ts'),
      '@idm/video-grabber': path.resolve(__dirname, '../packages/video-grabber/src/index.ts'),
      '@idm/site-grabber': path.resolve(__dirname, '../packages/site-grabber/src/index.ts'),
      '@': path.resolve(__dirname, '../apps/desktop/src'),
    },
  },
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, '../apps/desktop/index.html'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  base: './',
});
