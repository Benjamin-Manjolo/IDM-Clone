#!/usr/bin/env node
// scripts/clean.js
import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const TARGET_DIRS = [
  'dist',
  'out',
  'release',
  '.cache',
  'coverage',
  // Per-package
  'apps/desktop/dist',
  'apps/extension/dist',
  'packages/shared/dist',
  'packages/downloader/dist',
  'packages/scheduler/dist',
  'packages/video-grabber/dist',
  'packages/site-grabber/dist',
];

const TARGET_FILES = [
  'tsconfig.tsbuildinfo',
  'apps/desktop/tsconfig.tsbuildinfo',
];

const DEEP_CLEAN_DIRS = ['node_modules', '.turbo'];

const args = process.argv.slice(2);
const deepClean = args.includes('--deep');

function remove(p) {
  if (!existsSync(p)) return false;
  rmSync(p, { recursive: true, force: true });
  return true;
}

function log(msg) { console.log(msg); }

log('\n🧹 IDM Clone — Cleaning build artifacts\n');

let count = 0;

for (const dir of TARGET_DIRS) {
  const full = join(ROOT, dir);
  if (remove(full)) { log(`  ✓ Removed ${dir}`); count++; }
}

for (const file of TARGET_FILES) {
  const full = join(ROOT, file);
  if (remove(full)) { log(`  ✓ Removed ${file}`); count++; }
}

// Clean .hls-segments and .idm-resume temp dirs from default Downloads
const tempPatterns = ['.hls-segments', '.dash-tmp', '.idm-resume'];
function findAndClean(dir, depth = 3) {
  if (depth === 0 || !existsSync(dir)) return;
  try {
    readdirSync(dir).forEach(entry => {
      const full = join(dir, entry);
      if (tempPatterns.includes(entry) && statSync(full).isDirectory()) {
        remove(full); log(`  ✓ Removed temp: ${full}`); count++;
      } else if (statSync(full).isDirectory() && depth > 1) {
        findAndClean(full, depth - 1);
      }
    });
  } catch {}
}
findAndClean(ROOT);

if (deepClean) {
  log('\n  ⚠  Deep clean: removing node_modules (will require pnpm install)\n');
  for (const dir of DEEP_CLEAN_DIRS) {
    const full = join(ROOT, dir);
    if (remove(full)) { log(`  ✓ Removed ${dir}`); count++; }
  }
  // Also remove nested node_modules
  ['apps/desktop', 'apps/extension', 'packages/shared', 'packages/downloader',
   'packages/scheduler', 'packages/video-grabber', 'packages/site-grabber'].forEach(pkg => {
    const nm = join(ROOT, pkg, 'node_modules');
    if (remove(nm)) { log(`  ✓ Removed ${pkg}/node_modules`); count++; }
  });
}

log(`\n✅ Cleaned ${count} item${count !== 1 ? 's' : ''}\n`);
if (deepClean) log('  Run: pnpm install\n');
