import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';

const ROOT = path.resolve(__dirname, '../..');

export default defineConfig({
  plugins: [react()],

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@idm/shared': path.resolve(ROOT, 'packages/shared/src/index.ts'),
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup:      resolve(__dirname, 'src/popup/Popup.tsx'),
        background: resolve(__dirname, 'src/background.ts'),
        content:    resolve(__dirname, 'src/contentScript.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]',
        format: 'es',
      },
    },
    minify: false,
  },
});