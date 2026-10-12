// Reachability report: which non-test JS modules are unreachable from the app's
// entry points through relative imports. This is the in-repo replacement for the
// former `deobf-tools/b126/reach.mjs`, which lived outside the repository and could
// not be re-run. It only reports; it never edits source.
//
// Usage:
//   node tools/reachability.mjs            # human summary
//   node tools/reachability.mjs --json     # machine-readable { scope, reachable, orphans, missing }
//   node tools/reachability.mjs --write    # write tools/reachability-baseline.json
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SKIP_DIRS = new Set([
  'node_modules',
  'vendor',
  'user',
  'data',
  'output',
  'build',
  'dist',
  'dist-win',
  'test-artifacts',
  'test-results',
  'playwright-report',
  '.git',
  '.electron-runtime',
  'tools',
  'backend',
  'e2e',
  'images',
  'assets',
  'native',
  'deobf-tools',
  '.kilo',
]);
const TEST_RE = /(?:\.test\.js|_test\.js|\.spec\.js)$/i;

function toKey(absolute) {
  return path.relative(ROOT, absolute).split(path.sep).join('/');
}

function listScopeFiles() {
  const files = new Set();
  const roots = ['src', 'api', 'electron', 'db'];
  const walk = (directory) => {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
      if (item.isDirectory()) {
        if (!SKIP_DIRS.has(item.name)) walk(path.join(directory, item.name));
      } else if (/\.(?:js|mjs|cjs)$/i.test(item.name) && !TEST_RE.test(item.name)) {
        files.add(toKey(path.join(directory, item.name)));
      }
    }
  };
  for (const directory of roots) {
    const full = path.join(ROOT, directory);
    if (fs.existsSync(full)) walk(full);
  }
  for (const item of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (item.isFile() && /\.(?:js|cjs|mjs)$/i.test(item.name) && !TEST_RE.test(item.name)) {
      files.add(item.name);
    }
  }
  return files;
}

function entryPoints() {
  const entries = new Set();
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const match of indexHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    const clean = match[1].split(/[?#]/)[0].replace(/^\.?\//, '');
    if (/\.(?:js|mjs|cjs)$/i.test(clean)) entries.add(clean);
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  if (pkg.main) entries.add(pkg.main.replace(/^\.?\//, ''));
  if (fs.existsSync(path.join(ROOT, 'knexfile.cjs'))) entries.add('knexfile.cjs');
  entries.add('main.js');
  const byGlob = (directory, pattern) => {
    const full = path.join(ROOT, directory);
    if (!fs.existsSync(full)) return;
    for (const name of fs.readdirSync(full)) if (pattern.test(name)) entries.add(`${directory}/${name}`);
  };
  byGlob('electron', /preload.*\.cjs$/i);
  byGlob('db/migrations', /\.cjs$/i);
  return entries;
}

const SPEC_PATTERNS = [
  /(?:^|[\s;)}])(?:import|export)[^;]*?\bfrom\s*['"]([^'"]+)['"]/g,
  /(?:^|[\s;)}])import\s*['"]([^'"]+)['"]/g,
  /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  /new\s+URL\s*\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g,
  /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

function specsOf(source) {
  const found = [];
  for (const pattern of SPEC_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of source.matchAll(pattern)) found.push(match[1].split(/[?#]/)[0]);
  }
  return found;
}

const CASE_INDEX = new Map();
function resolveSpecifier(fromFile, spec) {
  if (!spec.startsWith('.')) return null;
  const base = path.posix.join(path.posix.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.mjs`,
    `${base}.cjs`,
    `${base}.json`,
    `${base}/index.js`,
    `${base}/index.mjs`,
    `${base}/index.cjs`,
  ];
  for (const candidate of candidates) {
    const normalized = path.posix.normalize(candidate);
    if (CASE_INDEX.has(normalized)) return CASE_INDEX.get(normalized);
    const lower = normalized.toLowerCase();
    if (CASE_INDEX.has(lower)) return CASE_INDEX.get(lower);
    // Exists on disk but outside the scanned scope (e.g. vendor/, styles/, images/).
    try {
      if (fs.statSync(path.join(ROOT, normalized)).isFile()) return normalized;
    } catch {
      /* keep trying */
    }
  }
  return null;
}

function main() {
  const scope = listScopeFiles();
  for (const file of scope) {
    CASE_INDEX.set(file, file);
    CASE_INDEX.set(file.toLowerCase(), file);
  }

  const entries = [...entryPoints()];
  const reachable = new Set();
  const missing = new Set();
  const visiting = new Set();
  const stack = entries.filter((item) => scope.has(item));
  const visit = (file) => {
    if (reachable.has(file) || visiting.has(file) || !scope.has(file)) return;
    visiting.add(file);
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const spec of specsOf(source)) {
      const resolved = resolveSpecifier(file, spec);
      if (resolved) {
        if (scope.has(resolved)) visit(resolved);
      } else if (spec.startsWith('.') && /\.(?:js|mjs|cjs)$/i.test(spec)) {
        missing.add(`${file} -> ${spec}`);
      }
    }
    visiting.delete(file);
    reachable.add(file);
  };
  for (const entry of stack) visit(entry);

  const orphans = [...scope].filter((file) => !reachable.has(file)).sort();
  const report = {
    scope: scope.size,
    reachable: reachable.size,
    orphans: orphans,
    missing: [...missing].sort(),
  };

  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    return;
  }
  if (process.argv.includes('--write')) {
    const target = path.join(ROOT, 'tools', 'reachability-baseline.json');
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
    process.stdout.write(`wrote ${toKey(target)}\n`);
    return;
  }

  const byDir = new Map();
  for (const file of orphans) {
    const directory = path.posix.dirname(file);
    byDir.set(directory, (byDir.get(directory) || 0) + 1);
  }
  process.stdout.write(`scope      ${report.scope}\n`);
  process.stdout.write(`reachable  ${report.reachable}\n`);
  process.stdout.write(`orphans    ${orphans.length}\n`);
  process.stdout.write(`missing    ${report.missing.length}\n\n`);
  for (const [directory, count] of [...byDir].sort((a, b) => b[1] - a[1])) {
    process.stdout.write(`${String(count).padStart(4)}  ${directory}\n`);
  }
}

main();
