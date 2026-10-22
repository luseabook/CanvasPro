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
// Three questions are answered:
//   1. Did we lose a named method?                          -> rows / missing
//   2. Did a whole block never get ported (size collapse)?  -> sizeDrift
//   3. Did a method survive but lose parameters?            -> signatureDrift
//
// Question 2 and 3 exist because name-set equality is not enough. Measured on
// this repo: `AudioClipController` is 1014 lines against upstream 1663 and
// `agentSessionStore` is 172 against 654 — both reported only as "some methods
// missing", which understated the damage. And `SourceImageNode` kept
// `_maybeResumeRunningHubTask` while dropping its `resumePaused` parameter, so
// paused tasks resumed on mount with the gate green.
//
// This is a *reading* check: it parses definitions out of both trees and
// compares them. It deliberately does NOT compare bodies (that is the port
// workflow's job).
//
// Baseline model: the repo carries a known backlog, so failing on everything
// would keep CI red forever. `tools/port-parity-baseline.json` records the
// accepted backlog; the gate fails only on *newly* missing methods. Regenerate
// after an intentional change with `--update-baseline`.
//
// sizeDrift and signatureDrift are REPORT-ONLY in this revision. Prettier
// reformatting shifts line counts, so treating them as hard failures would
// produce noise; they are printed and emitted in --json for triage.
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
import { extractAliasSignatures, extractMethodSignatures } from './port-parity-scan.mjs';

// Re-exported so callers (and the test suite) keep a single import surface.
export {
  extractAliasSignatures,
  extractMethodNames,
  extractMethodSignatures,
} from './port-parity-scan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DEFAULT_BASELINE_FILE = path.join(HERE, 'port-parity-baseline.json');
const MIRROR_ENV = 'AIC_UPSTREAM_MIRROR';
const DEFAULT_MIRROR = 'C:/Users/luobote/.qoder/tmp/shuo-deobf-089';

/** A file counts as size-drifting when upstream carries this much more code. */
const SIZE_DRIFT_RATIO = 1.3;
/** ...and the absolute gap is at least this many bytes (filters tiny files). */
const SIZE_DRIFT_BYTES = 3000;
/** A repo file at or below this many lines with a large counterpart is minified. */
const MINIFIED_LINE_LIMIT = 3;

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
 * Compares method signatures for files present in both trees.
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
 * @returns {{
 *   comparedFiles: number,
 *   rows: Array<{file:string, upstream:number, repo:number, missing:string[], relocated:string[]}>,
 *   sizeDrift: Array<{file:string, upstreamLines:number, repoLines:number, ratio:number}>,
 *   signatureDrift: Array<{file:string, name:string, upstreamArity:number, repoArity:number}>,
 *   aliasRows: Array<{file:string, missing:string[], live:string[]}>,
 *   minified: Array<{file:string, bytes:number, upstreamLines:number}>,
 * }}
 */
export function comparePortParity(mirrorRoot, repoRoot) {
  const upstreamFiles = new Set(listJavaScriptFiles(mirrorRoot));
  const repoFiles = listJavaScriptFiles(repoRoot);

  /** @type {Map<string, Map<string, string[]>>} repo file -> name -> params */
  const repoSignaturesByFile = new Map();
  /** @type {Map<string, string>} repo file -> source, reused for call indexing */
  const repoSourcesByFile = new Map();
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
    repoSourcesByFile.set(relativePath, source);
    // Match against the union: implementing an API as an arrow property still
    // counts as implementing it, it just cannot be the *definition of record*
    // when measuring upstream's surface.
    const signatures = new Map([
      ...extractMethodSignatures(source),
      ...extractAliasSignatures(source),
    ]);
    repoSignaturesByFile.set(relativePath, signatures);
    for (const name of signatures.keys()) {
      const owners = definitionsByName.get(name);
      if (owners) owners.push(relativePath);
      else definitionsByName.set(name, [relativePath]);
    }
  }

  const rows = [];
  const sizeDrift = [];
  const signatureDrift = [];
  /** Repo files collapsed onto one line — a readability defect, reported apart. */
  const minified = [];
  /** @type {Array<{file:string, missing:string[], live:string[]}>} */
  const aliasRows = [];
  let comparedFiles = 0;

  // Dot-access call sites across the repo. Used only to rank alias gaps: an API
  // that nobody calls is a documentation issue, one that is called on every run
  // is a live dead hook (`sessionStore.recordRunEvent?.(...)` with no
  // implementation silently does nothing).
  /** @type {Set<string>} */
  const calledNames = new Set();
  for (const source of repoSourcesByFile.values()) {
    // `name(` and the optional-call form `name?.(` both count: the dead hooks
    // this is meant to surface are written as `sessionStore.recordRunEvent?.(...)`.
    const dotCall = /\.\s*([A-Za-z_$][\w$]*)\s*(?:\?\.\s*)?\(/g;
    let call;
    while ((call = dotCall.exec(source)) !== null) calledNames.add(call[1]);
  }
  for (const [relativePath, repoSignatures] of repoSignaturesByFile) {
    if (!upstreamFiles.has(relativePath)) continue;
    let upstreamSource;
    try {
      upstreamSource = fs.readFileSync(path.join(mirrorRoot, relativePath), 'utf8');
    } catch {
      continue;
    }
    const upstreamSignatures = extractMethodSignatures(upstreamSource);
    if (upstreamSignatures.size === 0) continue;
    comparedFiles += 1;

    // Property-assignment APIs are tracked apart from the hard gap count: they
    // cannot be told apart from configuration objects by syntax alone. Scope is
    // the same file on purpose — these are keys on the object this module
    // returns, so an identically named helper elsewhere does not satisfy them.
    const aliasMissing = [...extractAliasSignatures(upstreamSource).keys()]
      .filter((name) => !repoSignatures.has(name))
      .sort();
    if (aliasMissing.length > 0) {
      aliasRows.push({
        file: relativePath,
        missing: aliasMissing,
        live: aliasMissing.filter((name) => calledNames.has(name)),
      });
    }

    // Whole-block collapse, measured in bytes rather than lines: this repo
    // carries files that were pasted in as a single line, so a line-count
    // comparison reads a 1725-line module as "1 line, 1725x smaller". Those are
    // reported as `minified` instead — a formatting defect, not a missing feature.
    const repoSource = repoSourcesByFile.get(relativePath) ?? '';
    const upstreamLines = upstreamSource.split('\n').length;
    const repoLines = repoSource.split('\n').length;
    const upstreamBytes = Buffer.byteLength(upstreamSource, 'utf8');
    const repoBytes = Buffer.byteLength(repoSource, 'utf8');
    if (repoLines <= MINIFIED_LINE_LIMIT && upstreamLines > 50) {
      minified.push({ file: relativePath, bytes: repoBytes, upstreamLines });
    } else {
      const byteRatio = repoBytes > 0 ? upstreamBytes / repoBytes : Number.POSITIVE_INFINITY;
      if (byteRatio > SIZE_DRIFT_RATIO && upstreamBytes - repoBytes >= SIZE_DRIFT_BYTES) {
        sizeDrift.push({
          file: relativePath,
          upstreamLines,
          repoLines,
          ratio: Number(byteRatio.toFixed(2)),
        });
      }
    }

    const missing = [];
    const relocated = [];
    for (const [name, upstreamParameters] of upstreamSignatures) {
      const repoParameters = repoSignatures.get(name);
      if (repoParameters) {
        // Present on both sides — did the parameter contract shrink? Arity only:
        // upstream names are obfuscated, so name differences carry no signal.
        if (repoParameters.length < upstreamParameters.length) {
          signatureDrift.push({
            file: relativePath,
            name,
            upstreamArity: upstreamParameters.length,
            repoArity: repoParameters.length,
          });
        }
        continue;
      }
      const owners = definitionsByName.get(name);
      // Relocation only counts inside the same directory. Two unrelated modules
      // can both own a helper named `upsert` or `onProgress`; without this
      // constraint `definitionsByName` swallowed the genuine gaps
      // `storyClipFrames.upsert` (matched by `core/rendererEdgeHitIndex.js`) and
      // `collaborationMediaQueue.onProgress` (matched by `audioVoicePanel.js`).
      // Real splits stay in their feature folder, e.g.
      // `video-node/resultRenderModule.js` -> `video-node/deferredDetailsHydration.js`.
      if (
        owners &&
        owners.some((owner) => path.posix.dirname(owner) === path.posix.dirname(relativePath))
      ) {
        relocated.push(name);
      } else {
        missing.push(name);
      }
    }
    if (missing.length === 0) continue;
    rows.push({
      file: relativePath,
      upstream: upstreamSignatures.size,
      repo: repoSignatures.size,
      missing: missing.sort(),
      relocated: relocated.sort(),
    });
  }
  rows.sort(
    (left, right) =>
      right.missing.length - left.missing.length || left.file.localeCompare(right.file)
  );
  sizeDrift.sort((left, right) => right.ratio - left.ratio || left.file.localeCompare(right.file));
  signatureDrift.sort(
    (left, right) =>
      right.upstreamArity - right.repoArity - (left.upstreamArity - left.repoArity) ||
      left.file.localeCompare(right.file)
  );
  aliasRows.sort(
    (left, right) =>
      right.live.length - left.live.length ||
      right.missing.length - left.missing.length ||
      left.file.localeCompare(right.file)
  );
  minified.sort((left, right) => right.bytes - left.bytes);
  return { comparedFiles, rows, sizeDrift, signatureDrift, aliasRows, minified };
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

/**
 * Writes the accepted backlog in a stable, diff-friendly shape.
 * The `equivalent` section is preserved verbatim: it records gaps that were
 * proven to be served by a different implementation, and dropping it on
 * regeneration would silently turn those back into failures.
 * @param {string} baselineFile
 * @param {ReturnType<typeof comparePortParity>['rows']} rows
 * @param {string} mirrorRoot
 */
export function writeBaseline(baselineFile, rows, mirrorRoot) {
  const files = {};
  for (const row of rows) files[row.file] = [...row.missing].sort();
  const previous = readBaseline(baselineFile);
  const payload = {
    // Kept intentionally explicit so a reviewer can tell which mirror the
    // backlog was measured against.
    mirror: path.basename(mirrorRoot),
    totalMissing: rows.reduce((sum, row) => sum + row.missing.length, 0),
    files,
  };
  if (previous?.equivalent && Object.keys(previous.equivalent).length > 0) {
    payload.equivalent = previous.equivalent;
  }
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
          'sizeDrift / signatureDrift 为只报告项，不参与退出码。',
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

  const { comparedFiles, rows, sizeDrift, signatureDrift, aliasRows, minified } = comparePortParity(
    mirrorPath,
    options.repo
  );
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
          sizeDrift,
          signatureDrift,
          aliasRows,
          minified,
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
    if (sizeDrift.length > 0) {
      console.log(`INFO  ${sizeDrift.length} 个文件上游明显更大（可能是整块功能未移植）：`);
      for (const item of sizeDrift.slice(0, 10))
        console.log(
          `  - ${item.file}: 仓库 ${item.repoLines} 行 / 上游 ${item.upstreamLines} 行（${item.ratio}x）`
        );
      if (sizeDrift.length > 10) console.log(`  ...另有 ${sizeDrift.length - 10} 个`);
    }
    if (signatureDrift.length > 0) {
      console.log(`INFO  ${signatureDrift.length} 个方法形参变少（方法在、契约缺）：`);
      for (const item of signatureDrift.slice(0, 10))
        console.log(
          `  - ${item.file}: ${item.name} 上游 ${item.upstreamArity} 个形参 / 仓库 ${item.repoArity} 个`
        );
      if (signatureDrift.length > 10) console.log(`  ...另有 ${signatureDrift.length - 10} 个`);
    }
    const aliasTotal = aliasRows.reduce((sum, row) => sum + row.missing.length, 0);
    const aliasLiveTotal = aliasRows.reduce((sum, row) => sum + row.live.length, 0);
    if (aliasTotal > 0) {
      console.log(
        `INFO  ${aliasTotal} 个别名属性形式的 API 在仓库中找不到（只报告），` +
          `其中 ${aliasLiveTotal} 个在代码里有调用点（等于死钩子）。` +
          '用 --verbose 看明细。'
      );
    }
    if (minified.length > 0) {
      const totalBytes = minified.reduce((sum, item) => sum + item.bytes, 0);
      console.log(
        `INFO  ${minified.length} 个文件被压缩成单行（合计 ${(totalBytes / 1024).toFixed(0)} KB），` +
          '与「不做压缩处理」的要求冲突，需要格式化：'
      );
      for (const item of minified.slice(0, 8))
        console.log(
          `  - ${item.file}: ${(item.bytes / 1024).toFixed(0)} KB 压成 1 行（上游 ${item.upstreamLines} 行）`
        );
      if (minified.length > 8) console.log(`  ...另有 ${minified.length - 8} 个`);
    }
    if (options.verbose) {
      console.log('  缺口明细（缺失数降序）：');
      for (const row of rows)
        console.log(
          `  - ${row.file}: ${row.repo}/${row.upstream} 个方法，缺 ${row.missing.join(', ')}`
        );
      if (aliasRows.length > 0) {
        console.log('  别名/箭头属性缺口（只报告，不计入退出码）：');
        for (const row of aliasRows) console.log(`  - ${row.file}: ${row.missing.join(', ')}`);
      }
    }
  }

  if (baseline && regressionTotal > 0) process.exitCode = 1;
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (invokedDirectly) main();
