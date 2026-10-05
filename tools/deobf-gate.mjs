// Build gate: fail if obfuscator output reappears anywhere in the tree.
//
// Why this file exists
// --------------------
// Four de-obfuscation batches each reported their layer as cleared. Two of those
// reports were false, and both times for the same reason: the claim came from a
// scanner someone ran once by hand, and that scanner had a blind spot the claim
// never mentioned.
//
//   - The rename / unescape / hex passes each scanned one layer. Each was right
//     about its own layer, and together they were still wrong: `!![]` is an
//     operator sequence, so it belonged to none of them.
//   - The boolean pass then shipped `deobf-residue-scan.mjs` and reported zero
//     while 15 occurrences of `!![]` sat in `providerApiKeyMissingToast.mjs` --
//     invisible because the file walk globbed `.js` only, `_0x[0-9a-f]{4,}` let
//     the short forms through, and `ROOTS` started below the tree root so
//     `main.js` was never read.
//
// A scanner you have to remember to run is not a control. This one runs from
// `npm test`, walks the whole tree rather than a hand-picked list of roots, and
// exits non-zero, so "the tree is clean" becomes something the build enforces
// rather than something a person asserted.
//
// What fails the build
// --------------------
// Only signals with no legitimate use in this tree. A gate that trips on real
// code gets deleted, and then it protects nothing:
//
//   - `_0x…` identifiers, any length. An obfuscator name; nothing writes these.
//   - `![]` / `!![]` in code position. `[]` is truthy, so these are exactly
//     `false` / `true`.
//   - `debugger` statements.
//   - String-array decoder shape: the IIFE an obfuscator emits to shuffle and
//     index its string table.
//   - `__defineGetter__` and friends: the self-defending / debug-protection hook.
//
// Detection is token-level, reusing the shared lexer. That matters: a `// !![]`
// comment, a `"![]"` string, or a regex literal like /!!?\[\]/ must not count,
// and raw-text grep cannot tell those apart from code.
//
// What is reported but does not fail
// ----------------------------------
// `eval(` / `new Function(` outside tests, hex literals outside `vendor/`, and
// `\x` / `\u` escapes in literals. Each has legitimate uses here (a test fixture
// evaluating an embedded script, deliberate bit masks such as `0xff` and
// `0x811c9dc5`, `'\xa0'` for a non-breaking space). These print as warnings so a
// human can judge them; turning them into build failures would be noise.
//
// Usage:
//   node tools/deobf-gate.mjs [--verbose] [--json=<file>]
//
// Exit codes: 0 clean, 1 obfuscation found, 2 the gate itself could not run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lex } from './deobf-lex.mjs';

const argv = process.argv.slice(2);
const verbose = argv.includes('--verbose');
const jsonFlag = argv.find((a) => a.startsWith('--json='));
const jsonOut = jsonFlag ? jsonFlag.slice('--json='.length) : null;

const ROOT = process.cwd();

// Directories that hold build output, dependencies, or test by-products.
// Each exclusion is listed rather than derived so that "why wasn't this file
// checked" is always answerable from the source. The list is deliberately short:
// a gate weakens as its blacklist grows, so anything that is merely *expected*
// to be clean (docs, editor config, agent config) is NOT excluded -- it is
// scanned like any other tree, and fails if obfuscation shows up there.
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'venv', '__pycache__', '.pytest_cache',
  'playwright-report', 'test-artifacts', 'test-results', 'user-data',
  '.smoke-user-data', '.electron-runtime', 'deobfuscated',
  'dist', 'release', 'output', 'build',
  'dist-win', 'dist-win-dev', 'dist-win-20261001', 'dist-win-20261003f',
  'dist-win-ui-audit-20261001',
]);

// Agent scratch. `.kilo/worktrees/` holds **registered git worktrees of this very
// repo** (`git worktree list` shows two of them) checked out at commits from
// 2026-09-30, i.e. before the de-obfuscation batches landed. They therefore carry
// a complete pre-cleanup copy of the obfuscated source -- about a million `_0x`
// identifiers. That is not project source and must never fail this gate, but it
// is also not something to exclude silently: the count is printed in the summary
// so the situation stays visible. Prune them with `git worktree remove`.
const AGENT_SCRATCH_DIRS = new Set(['.kilo']);
// `vendor/` is upstream code we do not own: rewriting it would be wrong and
// failing the build on it would be noise. It is listed in the summary as
// excluded rather than dropped silently, and it is currently clean of every
// hard-fail signal anyway.
const VENDOR_DIRS = new Set(['vendor']);

const CODE_EXT = /\.(?:js|cjs|mjs|jsx|ts|tsx)$/;

// See the note above: these files must contain the patterns in order to detect
// or rewrite them. Counted and printed, never skipped silently.
const TOOLING_PREFIX = 'tools/deobf-';
const MAX_BYTES = 8 * 1024 * 1024;

// Cheap pre-filter. Every hard-fail rule keys on a substring that must survive
// into the raw text, so a file without any of these cannot contain a hit and
// never needs to be lexed. This is what keeps the gate affordable inside
// `npm test`: it turns ~9,400 lexer runs into a few hundred.
const NEEDS_LEX = /_0x|__defineGetter__|!\s*\[|\bdebugger\b/;

// Raw-text shapes that cannot be expressed as single tokens. Regex literals and
// comments are the risk here, so these are anchored on forms a comment would not
// normally contain.
const RAW_RULES = [
  {
    id: 'string-array-decoder',
    pattern: /\(\s*function\s*\(\s*_[A-Za-z0-9$]{1,3}\s*,\s*_[A-Za-z0-9$]{1,3}\s*\)\s*\{\s*(?:var|let|const|while)/,
    why: 'string-array decoder IIFE',
  },
  {
    id: 'self-defending',
    pattern: /__defineGetter__|toString\s*\.\s*call\s*\(\s*function\s*\(\s*\)\s*\{\s*return\b/,
    why: 'self-defending / debug-protection hook',
  },
];

const WARN_RULES = [
  { id: 'new-function', pattern: /\bnew\s+Function\s*\(/, why: 'dynamic code construction' },
  { id: 'js-eval', pattern: /\beval\s*\(/, why: 'dynamic code evaluation' },
];

const failures = [];
const warnings = [];
const skipped = { dirs: [], scratch: [], tooling: [], unreadable: [], oversized: [], vendor: 0 };
let scanned = 0;

const lineOf = (source, offset) => source.slice(0, offset).split('\n').length;

const report = (file, line, text) => {
  if (line === undefined) return `  ${file}\n      ${text}`;
  return `  ${file}:${line}\n      ${String(text).trim().slice(0, 100)}`;
};

// `![]` / `!![]` as a fresh array literal only. `![][0]` and `![].x` index into
// the array and must not match; the rewriter in deobf-bool.mjs guards the same
// way, and the gate re-derives it rather than trusting that file.
const isBoolLiteralAt = (toks, i) => {
  if (toks[i].kind !== 'punct' || toks[i].value !== '!') return false;
  let j = i;
  let bangs = 0;
  while (toks[j] && toks[j].kind === 'punct' && toks[j].value === '!') {
    bangs += 1;
    j += 1;
  }
  if (bangs < 1 || bangs > 2) return false;
  const open = toks[j];
  const close = toks[j + 1];
  if (!open || open.kind !== 'punct' || open.value !== '[') return false;
  if (!close || close.kind !== 'punct' || close.value !== ']') return false;
  const after = toks[j + 2];
  if (after && after.kind === 'punct' && (after.value === '[' || after.value === '.')) return false;
  return true;
};

const scanTokens = (file, source, toks) => {
  for (let i = 0; i < toks.length; i += 1) {
    const t = toks[i];
    if (t.kind === 'identifier') {
      if (/^_0x[0-9a-f]+$/i.test(t.value)) {
        failures.push({ id: 'obf-identifier', file, line: lineOf(source, t.offset), text: t.value });
      } else if (t.value === 'debugger') {
        failures.push({ id: 'debugger-stmt', file, line: lineOf(source, t.offset), text: 'debugger' });
      } else if (t.value === '__defineGetter__') {
        failures.push({ id: 'self-defending', file, line: lineOf(source, t.offset), text: t.value });
      }
    }
    if (isBoolLiteralAt(toks, i)) {
      // `!![]` presents two `!` tokens; count it once.
      if (!(i > 0 && toks[i - 1].kind === 'punct' && toks[i - 1].value === '!')) {
        failures.push({ id: 'bool-literal', file, line: lineOf(source, t.offset), text: '!![] / ![]' });
      }
    }
  }
};

const scanText = (file, source) => {
  for (const rule of RAW_RULES) {
    rule.pattern.lastIndex = 0;
    const m = rule.pattern.exec(source);
    if (m) {
      failures.push({ id: rule.id, file, line: lineOf(source, m.index), text: rule.why });
    }
  }
  const isTest = /\.(?:test|spec)\.[cm]?js$/.test(file) || /[\\/](?:tests?|e2e)[\\/]/.test(file);
  if (!isTest) {
    for (const rule of WARN_RULES) {
      const m = rule.pattern.exec(source);
      if (m) {
        warnings.push({ id: rule.id, file, line: lineOf(source, m.index), text: rule.why });
      }
    }
  }
};

const walk = (dir, rel) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        skipped.dirs.push(entry.name);
        continue;
      }
      if (AGENT_SCRATCH_DIRS.has(entry.name)) {
        skipped.scratch.push(entry.name);
        continue;
      }
      if (VENDOR_DIRS.has(entry.name)) {
        skipped.vendor += 1;
        continue;
      }
      walk(full, relPath);
    } else if (entry.isFile() && CODE_EXT.test(entry.name)) {
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (stat.size > MAX_BYTES) {
        skipped.oversized.push(relPath);
        continue;
      }
      let source;
      try {
        source = fs.readFileSync(full, 'utf8');
      } catch {
        skipped.unreadable.push(relPath);
        continue;
      }
      if (relPath.startsWith(TOOLING_PREFIX)) {
        skipped.tooling.push(relPath);
        continue;
      }
      scanned += 1;
      try {
        if (NEEDS_LEX.test(source)) scanTokens(relPath, source, lex(source));
        scanText(relPath, source);
      } catch (err) {
        // A file the lexer cannot read is not evidence of cleanliness. Fail
        // loudly rather than letting an unreadable file pass silently -- a gate
        // that skips what it cannot understand is the same failure mode that let
        // the boolean batch report zero.
        failures.push({ id: 'lex-error', file: relPath, line: undefined, text: String(err.message).slice(0, 120) });
      }
    }
  }
};

walk(ROOT, '');

const byId = (rows) => {
  const out = {};
  for (const r of rows) out[r.id] = (out[r.id] || 0) + 1;
  return out;
};

console.log('deobfuscation gate');
console.log('  root            : ' + ROOT);
console.log('  files scanned   : ' + scanned);
console.log('  excluded dirs   : ' + [...new Set(skipped.dirs)].sort().join(', '));
console.log('  vendor excluded : ' + (skipped.vendor ? 'yes (upstream)' : 'n/a'));
if (skipped.scratch.length) console.log('  agent scratch   : ' + skipped.scratch.join(', ') + '  (older worktrees, not source)');
console.log('  deobf tooling   : ' + skipped.tooling.length + ' file(s) contain the patterns they detect');
if (skipped.oversized.length) console.log('  oversized (>8MB): ' + skipped.oversized.length);
if (skipped.unreadable.length) console.log('  unreadable      : ' + skipped.unreadable.length);

if (failures.length) {
  console.log('\nFAIL  ' + failures.length + ' obfuscation signal(s): ' + JSON.stringify(byId(failures)));
  for (const f of failures.slice(0, verbose ? failures.length : 25)) console.log(report(f.file, f.line, f.text));
  if (!verbose && failures.length > 25) console.log('  ... ' + (failures.length - 25) + ' more (use --verbose)');
} else {
  console.log('\nPASS  no obfuscation signals in code positions');
}

if (warnings.length) {
  console.log('\nWARN  ' + warnings.length + ' signal(s) needing human judgement (not failing): ' + JSON.stringify(byId(warnings)));
  for (const w of warnings.slice(0, verbose ? warnings.length : 10)) console.log(report(w.file, w.line, w.text));
  if (!verbose && warnings.length > 10) console.log('  ... ' + (warnings.length - 10) + ' more (use --verbose)');
}

if (jsonOut) {
  fs.writeFileSync(jsonOut, JSON.stringify({ scanned, failures, warnings, skipped }, null, 2));
  console.log('\nreport -> ' + jsonOut);
}

process.exit(failures.length ? 1 : 0);
