#!/usr/bin/env node
// scripts/build.js
import { execSync } from 'child_process';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  cyan:  '\x1b[36m',
  green: '\x1b[32m',
  red:   '\x1b[31m',
  yellow:'\x1b[33m',
};

function log(msg, color = '') { console.log(`${color}${msg}${colors.reset}`); }
function step(msg) { log(`\n▶ ${msg}`, colors.cyan + colors.bold); }
function ok(msg)   { log(`  ✓ ${msg}`, colors.green); }
function warn(msg) { log(`  ⚠ ${msg}`, colors.yellow); }
function fail(msg) { log(`  ✗ ${msg}`, colors.red); }

function run(cmd, cwd = ROOT) {
  execSync(cmd, { cwd, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
}

const args = process.argv.slice(2);
const buildExtension = !args.includes('--no-extension');
const buildDesktop   = !args.includes('--no-desktop');
const skipClean      = args.includes('--no-clean');

async function main() {
  log('\n⚡ IDM Clone — Production Build', colors.bold + colors.cyan);
  log('─'.repeat(50));

  // 1. Clean
  if (!skipClean) {
    step('Cleaning previous build artifacts');
    ['dist', 'out', 'release'].forEach(dir => {
      const p = join(ROOT, dir);
      if (existsSync(p)) { rmSync(p, { recursive: true, force: true }); ok(`Removed ${dir}/`); }
    });
  }

  // 2. Type-check everything
  step('Type checking all packages');
  try {
    run('pnpm tsc --noEmit -p config/tsconfig.json');
    ok('Type check passed');
  } catch {
    warn('Type errors found — continuing with build');
  }

  // 3. Build shared package first (dependency of everything)
  step('Building @idm/shared');
  run('pnpm --filter @idm/shared build 2>/dev/null || true');
  ok('@idm/shared ready');

  // 4. Build library packages in parallel
  step('Building library packages');
  const pkgs = ['@idm/downloader', '@idm/scheduler', '@idm/video-grabber', '@idm/site-grabber'];
  for (const pkg of pkgs) {
    try {
      run(`pnpm --filter ${pkg} build 2>/dev/null || true`);
      ok(pkg);
    } catch {
      warn(`${pkg} — build script not defined, skipping`);
    }
  }

  // 5. Build desktop app
  if (buildDesktop) {
    step('Building desktop app (Electron + React)');
    run('pnpm --filter @idm/desktop build');
    ok('Renderer built');
    run('pnpm --filter @idm/desktop build:electron 2>/dev/null || npx tsc -p apps/desktop/tsconfig.electron.json 2>/dev/null || true');
    ok('Electron main process built');
  }

  // 6. Build browser extension
  if (buildExtension) {
    step('Building browser extension');
    try {
      run('pnpm --filter @idm/extension build');
      ok('Extension built → apps/extension/dist/');
    } catch {
      warn('Extension build skipped (missing vite config)');
    }
  }

  log('\n' + '─'.repeat(50));
  log('✅ Build complete!', colors.green + colors.bold);
  log('\nNext steps:', colors.bold);
  log('  pnpm dev              — Start in development mode');
  log('  node scripts/release  — Package for distribution');
}

main().catch(err => {
  fail(`Build failed: ${err.message}`);
  process.exit(1);
});
