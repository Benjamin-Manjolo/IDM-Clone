#!/usr/bin/env node
/**
 * IDM Clone – Dev Launcher  (drop in repo root, run: node dev.js)
 *
 * Fixes:
 *  - Race condition: waits for Vite before launching Electron
 *  - rootDir TSC error: compiles Electron files using pre-built package .js
 *  - Missing preload: copies pre-built preload.js if tsc fails
 *  - react not found: runs pnpm install if node_modules missing
 */

const { spawn, execSync, spawnSync } = require('child_process');
const http  = require('http');
const path  = require('path');
const fs    = require('fs');

const ROOT     = __dirname;
const APP      = path.join(ROOT, 'apps', 'desktop');
const ELECTRON = path.join(APP,  'electron');
const OUT_DIR  = path.join(APP,  'dist', 'electron', 'electron');
const VITE_CFG = path.join(ROOT, 'config', 'vite.config.ts');

const C = { r:'\x1b[0m', c:'\x1b[36m', g:'\x1b[32m', y:'\x1b[33m', red:'\x1b[31m' };
const log = (tag, msg, col = C.c) => console.log(`${col}[${tag}]${C.r} ${msg}`);
const run = (cmd, cwd = ROOT) => {
  log('run', cmd, C.y);
  const r = spawnSync(cmd, { cwd, stdio: 'inherit', shell: true });
  if (r.status !== 0) throw new Error(`Command failed: ${cmd}`);
};

// ── Step 1: ensure node_modules exist ─────────────────────────────────────
if (!fs.existsSync(path.join(ROOT, 'node_modules'))) {
  log('install', 'node_modules missing – running pnpm install…', C.y);
  run('pnpm install');
}
if (!fs.existsSync(path.join(APP, 'node_modules'))) {
  log('install', 'desktop node_modules missing – running pnpm install…', C.y);
  run('pnpm install', APP);
}

// ── Step 2: build packages (shared must go first) ─────────────────────────
const pkgs = ['@idm/shared','@idm/downloader','@idm/scheduler','@idm/video-grabber','@idm/site-grabber'];
for (const pkg of pkgs) {
  const distIndex = path.join(ROOT, 'packages', pkg.replace('@idm/',''), 'dist', 'index.js');
  if (!fs.existsSync(distIndex)) {
    log('build', `Building ${pkg}…`, C.y);
    try { run(`pnpm --filter ${pkg} build`); }
    catch { log('build', `${pkg} build failed – continuing`, C.y); }
  } else {
    log('build', `${pkg} already built`, C.g);
  }
}

// ── Step 3: compile Electron main + preload ────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });

log('tsc', 'Compiling Electron TypeScript…', C.y);

// Write a temp tsconfig that avoids the rootDir issue entirely
// by using `paths` pointing to the already-compiled package dist files.
const tempTsConfig = path.join(APP, 'tsconfig.electron.tmp.json');
const tsCfg = {
  compilerOptions: {
    target: 'ES2020',
    module: 'CommonJS',
    moduleResolution: 'node',
    outDir: './dist/electron/electron',
    strict: false,
    esModuleInterop: true,
    skipLibCheck: true,
    sourceMap: false,
    declaration: false,
    // No rootDir — let tsc figure it out
    baseUrl: '.',
    paths: {
      '@idm/shared':        ['../../packages/shared/dist/index.js'],
      '@idm/downloader':    ['../../packages/downloader/dist/index.js'],
      '@idm/scheduler':     ['../../packages/scheduler/dist/index.js'],
      '@idm/video-grabber': ['../../packages/video-grabber/dist/index.js'],
      '@idm/site-grabber':  ['../../packages/site-grabber/dist/index.js'],
    },
  },
  include: ['electron/**/*'],
  exclude: ['node_modules', 'dist', 'src'],
};
fs.writeFileSync(tempTsConfig, JSON.stringify(tsCfg, null, 2));

let tscOk = false;
try {
  run(`npx tsc -p "${tempTsConfig}"`, APP);
  log('tsc', 'Compiled OK', C.g);
  tscOk = true;
} catch {
  log('tsc', 'TSC failed – falling back to pre-built .js files', C.y);
}
try { fs.unlinkSync(tempTsConfig); } catch {}

// ── Step 4: if tsc failed, copy the pre-built JS files ────────────────────
if (!tscOk) {
  // The repo already has compiled .js next to .ts files – copy them
  log('fallback', 'Copying pre-built electron .js files…', C.y);

  function copyJsFiles(srcDir, destDir) {
    fs.mkdirSync(destDir, { recursive: true });
    for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        copyJsFiles(path.join(srcDir, entry.name), path.join(destDir, entry.name));
      } else if (entry.name.endsWith('.js')) {
        fs.copyFileSync(
          path.join(srcDir, entry.name),
          path.join(destDir, entry.name)
        );
      }
    }
  }

  copyJsFiles(ELECTRON, OUT_DIR);
  log('fallback', `Copied .js files to ${OUT_DIR}`, C.g);
}

// ── Step 5: verify main.js and preload.js exist ───────────────────────────
const mainJs    = path.join(OUT_DIR, 'main.js');
const preloadJs = path.join(OUT_DIR, 'preload.js');

if (!fs.existsSync(mainJs)) {
  log('ERROR', `main.js not found at ${mainJs}`, C.red);
  process.exit(1);
}
if (!fs.existsSync(preloadJs)) {
  log('ERROR', `preload.js not found at ${preloadJs}`, C.red);
  process.exit(1);
}
log('check', `main.js    ✓  ${mainJs}`, C.g);
log('check', `preload.js ✓  ${preloadJs}`, C.g);

// ── Step 6: start Vite ────────────────────────────────────────────────────
log('vite', 'Starting Vite dev server…', C.c);
const vite = spawn(
  'npx', ['vite', '--config', VITE_CFG, '--port', '5173', '--force'],
  { cwd: ROOT, stdio: ['ignore','pipe','pipe'], shell: true }
);
vite.stdout.on('data', d => process.stdout.write(`${C.c}[vite]${C.r} ${d}`));
vite.stderr.on('data', d => {
  const s = d.toString();
  // suppress known harmless warnings
  if (s.includes('CJS build') || s.includes('optimizeDeps')) return;
  process.stderr.write(`${C.c}[vite]${C.r} ${s}`);
});

// ── Step 7: wait for Vite ─────────────────────────────────────────────────
function waitForVite(retries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = n => {
      http.get('http://localhost:5173', () => resolve())
          .on('error', () => {
            if (n <= 0) return reject(new Error('Vite never became ready'));
            setTimeout(() => attempt(n - 1), 1000);
          });
    };
    attempt(retries);
  });
}

waitForVite().then(() => {
  log('vite', 'Ready ✓  http://localhost:5173', C.g);

  // ── Step 8: launch Electron ──────────────────────────────────────────
  log('electron', `Launching ${mainJs}`, C.g);
  const electron = spawn(
    'npx', ['electron', mainJs],
    {
      cwd: APP,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, NODE_ENV: 'development', ELECTRON_DISABLE_SANDBOX: '1' },
    }
  );
  electron.on('close', code => {
    log('electron', `Exited (${code ?? 0})`, C.y);
    vite.kill();
    process.exit(code ?? 0);
  });

}).catch(err => {
  log('ERROR', err.message, C.red);
  vite.kill();
  process.exit(1);
});

process.on('SIGINT',  () => { vite.kill(); process.exit(0); });
process.on('SIGTERM', () => { vite.kill(); process.exit(0); });
