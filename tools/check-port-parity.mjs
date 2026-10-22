#!/usr/bin/env node
// Port-parity gate: catches "half-ported" modules.
//
// Background: the web app under src/ is a re-ported build. For each file that
// exists on BOTH sides (upstream mirror + this repo), the set of named methods
// must not shrink. Historically it did shrink silently — e.g.
// `previewControlsModule.js` kept 18 of 30 methods while `unmount()` already
// called the missing ones (`_cancelPreviewHoverRetryTimers`,
// `_disposeVideoProgressInteraction`), so the feature was dead but nothing
// failed.
//
// This is a *reading* check: it parses method definitions out of both trees and
// compares name sets. It deliberately does NOT compare bodies (that is the port
// workflow's job) — it only answers "did we lose a method?".
//
// Baseline model: the repo already carries a known backlog of missing methods,
// so failing on all of them would keep CI red forever. `tools/port-parity-baseline.json`
// records the accepted backlog; the gate fails only on *newly* missing methods.
// Regenerate after an intentional change with `--update-baseline`.
//
// Usage:
//   node tools/check-port-parity.mjs                       # gate
//   node tools/check-port-parity.mjs --update-baseline      # accept current state
//   node tools/check-port-parity.mjs --json                 # machine readable
//   node tools/check-port-parity.mjs --verbose              # list every gap
//   AIC_UPSTREAM_MIRROR=/path/to/mirror node tools/check-port-parity.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_BASELINE_FILE = path.join(HERE, 'port-parity-baseline.json');
const MIRROR_ENV = 'AIC_UPSTREAM_MIRROR';
const DEFAULT_MIRROR = 'C:/Users/luobote/.qoder/tmp/shuo-deobf-089';

/** Directories that never participate in the comparison. */
const SKIP_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  '.workbuddy',
  'vendor',
  'dist',
  'dist-win',
  'output',
  'test-artifacts',
  'playwright-report',
  '__pycache__',
  'venv',
  '.venv',
]);

/**
 * Recursively lists JavaScript files under a directory, skipping vendored and
 * generated folders. Paths are returned relative to `root` with forward slashes
 * so that Windows and POSIX trees compare identically.
 * @param {string} root Absolute directory.
 * @returns {string[]} Sorted relative paths.
 */
export function listJavaScriptFiles(root) {
  /** @type {string[]} */
  const collected = [];
  const walk = (absoluteDir, prefix) => {
    let entries;
    try {
      entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const name = entry.name;
      if (entry.isDirectory()) {
        if (SKIP_DIRECTORIES.has(name) || name.startsWith('dist-')) continue;
        walk(path.join(absoluteDir, name), prefix ? `${prefix}/${name}` : name);
        continue;
      }
      if (!entry.isFile() || !name.endsWith('.js')) continue;
      if (name.endsWith('.min.js')) continue;
      collected.push(prefix ? `${prefix}/${name}` : name);
    }
  };
  walk(root, '');
  return collected.sort();
}

/**
 * Scans a source string and collects named method definitions.
 *
 * Three accepted shapes, all used across the codebase:
 *   ['name'](args) {          // computed key, survives minification
 *   name(args) {              // plain identifier at class-body indent
 *   'name'(args) {            // quoted literal key + shorthand method
 *
 * The parameter list may span multiple lines, so the scanner finds the opening
 * paren and balances brackets instead of relying on a single-line regex — a
 * single-line regex silently drops multiline signatures, which is exactly how
 * `_schedulePreviewHoverPlaybackWhenVideoReady` stayed invisible during audit.
 * @param {string} source
 * @returns {Set<string>} Method names.
 */
export function extractMethodNames(source) {
  const names = new Set();
  const isIdentifierCharacter = (character) => /[A-Za-z0-9_$]/.test(character || '');

  /** Skips strings and line comments starting at `index`, returns resume index. */
  const skipLiteral = (index) => {
    const character = source[index];
    if (character === '"' || character === "'" || character === '`') {
      let cursor = index + 1;
      while (cursor < source.length && source[cursor] !== character) {
        if (source[cursor] === '\\') cursor += 1;
        cursor += 1;
      }
      return cursor + 1;
    }
    if (character === '/' && source[index + 1] === '/') {
      let cursor = index;
      while (cursor < source.length && source[cursor] !== '\n') cursor += 1;
      return cursor;
    }
    return -1;
  };

  /** Returns the index just past the matching ')' or -1 when unbalanced. */
  const skipBalancedParens = (openIndex) => {
    let depth = 0;
    for (let cursor = openIndex; cursor < source.length; cursor += 1) {
      const literalEnd = skipLiteral(cursor);
      if (literalEnd >= 0) {
        cursor = literalEnd - 1;
        continue;
      }
      const character = source[cursor];
      if (character === '(') depth += 1;
      else if (character === ')') {
        depth -= 1;
        if (depth === 0) return cursor + 1;
      }
    }
    return -1;
  };

  /** True when only whitespace separates `index` from a '{'. */
  const opensBlockAt = (index) => {
    let cursor = index;
    while (cursor < source.length && /\s/.test(source[cursor])) cursor += 1;
    return source[cursor] === '{';
  };

  // Shape 1: computed key — ['name']( ... ) {
  const computedKey = /\['([A-Za-z_$][\w$]*)'\]\s*\(/g;
  let match;
  while ((match = computedKey.exec(source)) !== null) {
    const openParen = match.index + match[0].length - 1;
    const afterParens = skipBalancedParens(openParen);
    if (afterParens < 0 || !opensBlockAt(afterParens)) continue;
    // Guard against `obj['prop'](...)` access: a method definition is preceded by
    // a statement boundary, not by an expression.
    const before = source.slice(Math.max(0, match.index - 1), match.index);
    if (isIdentifierCharacter(before) || before === '.' || before === ')') continue;
    names.add(match[1]);
  }

  // Shape 3: quoted literal key — 'name'( ... ) {  (object literal shorthand)
  const quotedKey = /(['"])([A-Za-z_$][\w$]*)\1\s*\(/g;
  while ((match = quotedKey.exec(source)) !== null) {
    const openParen = match.index + match[0].length - 1;
    const afterParens = skipBalancedParens(openParen);
    if (afterParens < 0 || !opensBlockAt(afterParens)) continue;
    // Exclude the identifier inside a longer string such as "call foo(" — the
    // match must start at the quote itself.
    const before = source.slice(Math.max(0, match.index - 1), match.index);
    if (before === '\\' || isIdentifierCharacter(before)) continue;
    names.add(match[2]);
  }

  // Shape 2: plain identifier at class-body indentation.
  const reserved = new Set([
    'if',
    'for',
    'while',
    'switch',
    'catch',
    'function',
    'return',
    'do',
    'else',
    'typeof',
    'new',
    'await',
    'yield',
    'with',
    'try',
    'throw',
    'delete',
    'void',
    'in',
    'of',
    'case',
    'default',
    'class',
    'const',
    'let',
    'var',
  ]);
  const plainMethod = /^[ \t]{2,6}([A-Za-z_$][\w$]*)\s*\(/gm;
  while ((match = plainMethod.exec(source)) !== null) {
    const name = match[1];
    if (reserved.has(name)) continue;
    const openParen = match.index + match[0].length - 1;
    const afterParens = skipBalancedParens(openParen);
    if (afterParens < 0 || !opensBlockAt(afterParens)) continue;
    names.add(name);
  }

  return names;
}

/**
 * Compares method name sets for files present in both trees.
 *
 * A method missing from its upstream file is only reported as a gap when no file
 * in this repo defines it at all. The port intentionally split some modules, so
 * `hydrateRendererThinVideoPresentation` living in `deferredDetailsHydration.js`
 * instead of `resultRenderModule.js` is a relocation, not a loss. Calls do not
 * count as definitions, which is what keeps genuinely dead hooks (
 * `this._cancelPreviewHoverRetryTimers?.()` with no implementation anywhere)
 * visible.
 * @param {string} mirrorRoot Upstream mirror directory.
 * @param {string} repoRoot Repository root directory.
 * @returns {{ comparedFiles: number, rows: Array<{file:string, upstream:number, repo:number, missing:string[], relocated:string[]}> }}
 */
export function comparePortParity(mirrorRoot, repoRoot) {
  const upstreamFiles = new Set(listJavaScriptFiles(mirrorRoot));
  const repoFiles = listJavaScriptFiles(repoRoot);

  /** @type {Map<string, Set<string>>} repo file -> method names */
  const repoMethodsByFile = new Map();
  /** @type {Map<string, string[]>} method name -> files defining it */
  const definitionsByName = new Map();
  for (const relativePath of repoFiles) {
    if (relativePath.endsWith('.test.js')) continue;
    let source;
    try {
      source = fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
    } catch {
      continue;
    }
    const names = extractMethodNames(source);
    repoMethodsByFile.set(relativePath, names);
    for (const name of names) {
      const owners = definitionsByName.get(name);
      if (owners) owners.push(relativePath);
      else definitionsByName.set(name, [relativePath]);
    }
  }

  const rows = [];
  let comparedFiles = 0;
  for (const [relativePath, repoMethods] of repoMethodsByFile) {
    if (!upstreamFiles.has(relativePath)) continue;
    let upstreamSource;
    try {
      upstreamSource = fs.readFileSync(path.join(mirrorRoot, relativePath), 'utf8');
    } catch {
      continue;
    }
    const upstreamMethods = extractMethodNames(upstreamSource);
    if (upstreamMethods.size === 0) continue;
    comparedFiles += 1;
    const missing = [];
    const relocated = [];
    for (const name of upstreamMethods) {
      if (repoMethods.has(name)) continue;
      const owners = definitionsByName.get(name);
      if (owners && owners.length > 0) relocated.push(name);
      else missing.push(name);
    }
    if (missing.length === 0) continue;
    rows.push({
      file: relativePath,
      upstream: upstreamMethods.size,
      repo: repoMethods.size,
      missing: missing.sort(),
      relocated: relocated.sort(),
    });
  }
  rows.sort(
    (left, right) =>
      right.missing.length - left.missing.length || left.file.localeCompare(right.file)
  );
  return { comparedFiles, rows };
}

/**
 * Reads the accepted backlog. Returns null when absent or unparsable, which puts
 * the gate into report-only mode instead of failing a fresh checkout.
 * @param {string} baselineFile
 */
export function readBaseline(baselineFile) {
  try {
    const parsed = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || typeof parsed.files !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Splits current gaps into regressions (not in the baseline) and resolved
 * entries (in the baseline, now gone).
 * @param {ReturnType<typeof comparePortParity>['rows']} rows
 * @param {{files?: Record<string, string[]>}|null} baseline
 */
export function diffAgainstBaseline(rows, baseline) {
  const knownFiles = baseline?.files || {};
  const regressions = [];
  let totalMissing = 0;
  for (const row of rows) {
    totalMissing += row.missing.length;
    const known = new Set(knownFiles[row.file] || []);
    const added = row.missing.filter((name) => !known.has(name));
    if (added.length > 0) regressions.push({ file: row.file, missing: added });
  }
  const currentMissingByFile = new Map(rows.map((row) => [row.file, new Set(row.missing)]));
  const resolved = [];
  for (const [file, names] of Object.entries(knownFiles)) {
    const known = names || [];
    if (known.length === 0) continue;
    // A file that disappeared from `rows` has no live gap set, so every baseline
    // entry counts as cleared — handled by the same predicate, and only once.
    const alive = currentMissingByFile.get(file);
    const cleared = known.filter((name) => !alive?.has(name));
    if (cleared.length > 0) resolved.push({ file, count: cleared.length });
  }
  return { regressions, resolved, totalMissing };
}

/** Writes the accepted backlog in a stable, diff-friendly shape. */
export function writeBaseline(baselineFile, rows, mirrorRoot) {
  const files = {};
  for (const row of rows) files[row.file] = [...row.missing].sort();
  const payload = {
    // Kept intentionally explicit so a reviewer can tell which mirror the
    // backlog was measured against.
    mirror: path.basename(mirrorRoot),
    totalMissing: rows.reduce((sum, row) => sum + row.missing.length, 0),
    files,
  };
  fs.writeFileSync(baselineFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

function parseArguments(argv) {
  const options = {
    mirror: process.env[MIRROR_ENV] || DEFAULT_MIRROR,
    repo: ROOT,
    baselineFile: DEFAULT_BASELINE_FILE,
    updateBaseline: false,
    json: false,
    verbose: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--update-baseline') options.updateBaseline = true;
    else if (argument === '--json') options.json = true;
    else if (argument === '--verbose') options.verbose = true;
    else if (argument === '--mirror') options.mirror = argv[++index];
    else if (argument === '--repo') options.repo = path.resolve(argv[++index]);
    else if (argument === '--baseline') options.baselineFile = path.resolve(argv[++index]);
    else if (argument === '--help' || argument === '-h') {
      console.log(
        [
          '用法: node tools/check-port-parity.mjs [选项]',
          '',
          '  --mirror <dir>       上游镜像根目录（默认取 AIC_UPSTREAM_MIRROR 或内置路径）',
          '  --repo <dir>         仓库根目录（默认自动推断）',
          '  --baseline <file>    基线文件（默认 tools/port-parity-baseline.json）',
          '  --update-baseline    把当前缺口写入基线（显式接受现状）',
          '  --json               输出机器可读结果',
          '  --verbose            逐文件列出缺口方法',
          '',
          '只比对两边都存在的同名文件；整件未移植的文件不在此门禁范围内。',
        ].join('\n')
      );
      process.exit(0);
    }
  }
  return options;
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const mirrorPath = path.resolve(options.mirror);

  // No mirror on this machine (e.g. a clean CI runner): skip instead of failing.
  let mirrorLooksValid = false;
  try {
    mirrorLooksValid = fs.statSync(mirrorPath).isDirectory();
  } catch {
    mirrorLooksValid = false;
  }
  if (!mirrorLooksValid) {
    console.log(
      `SKIP  移植完整性门禁：未找到上游镜像（${mirrorPath}）。` +
        `设置 ${MIRROR_ENV} 或 --mirror 后再跑。`
    );
    return;
  }

  const { comparedFiles, rows } = comparePortParity(mirrorPath, options.repo);
  if (comparedFiles < 100) {
    console.log(
      `SKIP  移植完整性门禁：镜像 ${mirrorPath} 只匹配到 ${comparedFiles} 个同名文件，` +
        '疑似不是目标镜像树，跳过以免误报。'
    );
    return;
  }

  if (options.updateBaseline) {
    const payload = writeBaseline(options.baselineFile, rows, mirrorPath);
    console.log(
      `WROTE 移植完整性基线：${Object.keys(payload.files).length} 个文件 / ` +
        `${payload.totalMissing} 个缺失方法 → ${path.relative(process.cwd(), options.baselineFile)}`
    );
    return;
  }

  const baseline = readBaseline(options.baselineFile);
  const { regressions, resolved, totalMissing } = diffAgainstBaseline(rows, baseline);
  const regressionTotal = regressions.reduce((sum, item) => sum + item.missing.length, 0);

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          comparedFiles,
          gapFiles: rows.length,
          totalMissing,
          baseline: baseline ? path.basename(options.baselineFile) : null,
          regressions,
          resolved,
        },
        null,
        2
      )
    );
  } else {
    const headline = `比对 ${comparedFiles} 个同名文件，${rows.length} 个存在方法缺失（共 ${totalMissing} 个）`;
    if (!baseline) {
      console.log(`REPORT 移植完整性门禁：${headline}；尚无基线，只报告不拦截。`);
      console.log('       跑 --update-baseline 生成基线后，本门禁才会拦新增缺口。');
    } else if (regressionTotal === 0) {
      console.log(`PASS  移植完整性门禁：${headline}，无基线外新增缺口。`);
    } else {
      console.error(
        `FAIL  移植完整性门禁：${headline}，其中基线外新增缺口 ${regressionTotal} 个。`
      );
      for (const item of regressions)
        console.error(`  - ${item.file}: 新增缺失 ${item.missing.join(', ')}`);
      console.error('  若确属有意删减，跑 --update-baseline 显式接受。');
    }
    if (resolved.length > 0)
      console.log(
        `INFO  ${resolved.length} 个文件已补齐基线内的方法（共 ${resolved.reduce((sum, item) => sum + item.count, 0)} 个），` +
          '可跑 --update-baseline 收紧基线。'
      );
    if (options.verbose) {
      console.log('  缺口明细（缺失数降序）：');
      for (const row of rows)
        console.log(
          `  - ${row.file}: ${row.repo}/${row.upstream} 个方法，缺 ${row.missing.join(', ')}`
        );
    }
  }

  if (baseline && regressionTotal > 0) process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) main();
