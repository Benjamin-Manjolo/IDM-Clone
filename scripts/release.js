#!/usr/bin/env node
// scripts/release.js
import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const pkg  = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const args = process.argv.slice(2);

const PLATFORM_MAP = {
  '--win':   { flag: '--win',   label: 'Windows' },
  '--mac':   { flag: '--mac',   label: 'macOS' },
  '--linux': { flag: '--linux', label: 'Linux' },
};

const platforms = args.filter(a => a in PLATFORM_MAP);
const publish   = args.includes('--publish');
const dryRun    = args.includes('--dry-run');

const colors = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  cyan: '\x1b[36m', green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
};

function log(msg, c = '') { console.log(`${c}${msg}${colors.reset}`); }
function run(cmd, cwd = ROOT) {
  if (dryRun) { log(`  [dry-run] ${cmd}`, colors.yellow); return; }
  execSync(cmd, { cwd, stdio: 'inherit' });
}

log(`\n📦 IDM Clone v${pkg.version} — Release Build`, colors.bold + colors.cyan);
log('─'.repeat(50));

// Validate git state
try {
  const status = execSync('git status --porcelain', { cwd: ROOT }).toString().trim();
  if (status && !dryRun) {
    log('\n⚠  Working directory has uncommitted changes:', colors.yellow);
    log(status.split('\n').map(l => `   ${l}`).join('\n'));
    log('\n  Continue anyway? (Ctrl+C to abort)');
  }
} catch {}

// Build first
log('\n▶ Running production build…', colors.cyan + colors.bold);
run('node scripts/build.js --no-clean');
log('  ✓ Build complete', colors.green);

// Ensure release dir
if (!dryRun) mkdirSync(join(ROOT, 'release'), { recursive: true });

// Package with electron-builder
const targets = platforms.length > 0 ? platforms.map(p => PLATFORM_MAP[p].flag).join(' ') : '--win --mac --linux';
const publishFlag = publish ? '--publish always' : '--publish never';

log(`\n▶ Packaging (${platforms.length ? platforms.map(p => PLATFORM_MAP[p].label).join(', ') : 'all platforms'})…`, colors.cyan + colors.bold);
run(`npx electron-builder ${targets} ${publishFlag} --config config/electron-builder.yml`, join(ROOT, 'apps/desktop'));
log('  ✓ Packages built → release/', colors.green);

// Package extension as zip
log('\n▶ Packaging browser extension…', colors.cyan + colors.bold);
run('cd apps/extension/dist && zip -r ../../../release/idm-clone-extension.zip . 2>/dev/null || true');
log('  ✓ Extension → release/idm-clone-extension.zip', colors.green);

log('\n' + '─'.repeat(50));
log(`✅ Release v${pkg.version} ready in release/`, colors.green + colors.bold);

if (!publish) {
  log('\n  To publish to GitHub Releases:', colors.bold);
  log(`    node scripts/release.js ${targets} --publish`);
}
