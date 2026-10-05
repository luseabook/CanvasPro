// Measures how far the working tree has drifted from a reference source tree.
//
//   node tools/mirror-drift-sweep.mjs <referenceDir> <targetDir> <out.json>
//
// Used to answer "how much work is left to reach generation X" without relying
// on failing tests, which only ever see the files a test happens to import.
//
// The comparison is a token MULTISET hash, which is invariant under every
// transformation the porting pipeline applies:
//   - identifier names   -> all collapse into one bucket (obfuscated vs readable)
//   - escapes            -> string literals are compared by decoded value
//   - hex / decimal      -> numeric literals are compared by value
//   - member spelling    -> `x['y']` and `x.y` produce the same tokens
//   - formatting         -> both sides run through the same prettier config
//   - reordering         -> multisets ignore position, so an import shuffle
//                           cannot mask or fake a difference
//
// Output buckets:
//   same       reference file and target file tokenise alike
//   differ     real content difference; the report carries the token delta
//   mirrorOnly reference file with no counterpart in the target (new module)
//   unreadable a side failed to read, lex or hash
//
// A small non-zero delta is usually pipeline residue rather than a real change
// (a dropped trailing comma, a de-escaped `\x20`, an unnormalised `!![]`).
// Treat |delta| <= 2 as "probably cosmetic" and inspect anything larger.
//
// Prettier is resolved from, in order: --prettier=<path>, the
// MIRROR_SWEEP_PRETTIER environment variable, the repository's own
// node_modules. When it cannot be found the two sides are compared unformatted,
// which inflates `differ` with formatting-only noise; the script says so on
// stdout, and in that mode treat the numbers as an upper bound only.
//
//   node tools/mirror-drift-sweep.mjs --prettier=/path/to/prettier/index.cjs ...
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { lex, stringValue } from './deobf-lex.mjs';

const argv = process.argv.slice(2);
const prettierFlag = argv.find((a) => a.startsWith('--prettier='));
const [referenceDir, targetDir, outJson] = argv.filter((a) => !a.startsWith('--'));
if (!referenceDir || !targetDir || !outJson) {
  // Both arguments are the *tree roots* — the walk descends <root>/src, <root>/api
  // and <root>/electron, so passing a leaf directory such as <root>/src/components
  // silently scans 0 files.
  console.error('usage: node tools/mirror-drift-sweep.mjs [--prettier=<path>] <referenceTreeRoot> <targetTreeRoot> <out.json>');
  process.exit(2);
}

const require = createRequire(import.meta.url);
const prettierCandidates = [
  prettierFlag ? prettierFlag.slice('--prettier='.length) : null,
  process.env.MIRROR_SWEEP_PRETTIER || null,
  'prettier',
].filter(Boolean);

let prettier = null;
for (const candidate of prettierCandidates) {
  try {
    prettier = require(candidate);
    break;
  } catch {
    /* try the next candidate */
  }
}

const OPTIONS = {
  parser: 'babel',
  singleQuote: true,
  printWidth: 110,
  tabWidth: 2,
  semi: true,
  arrowParens: 'always',
  endOfLine: 'lf',
};

const ROOTS = ['src', 'api', 'electron'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'deobfuscated', 'release', 'dist', 'build']);

function walk(dir, base, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, base, out);
      continue;
    }
    if (!/\.(js|cjs|mjs)$/.test(entry.name)) continue;
    out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}

async function hashOf(file) {
  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch {
    return 'NOFILE';
  }
  let text = source;
  if (prettier) {
    try {
      text = await prettier.format(source, OPTIONS);
    } catch {
      text = source; // unparseable: tokenise the raw text instead
    }
  }
  let tokens;
  try {
    tokens = lex(text);
  } catch {
    return 'LEXFAIL';
  }
  const keys = tokens.map((token) => {
    if (token.kind === 'identifier') return 'i';
    if (token.kind === 'string') return 's' + JSON.stringify(stringValue(token.value));
    if (token.kind === 'number') return 'n' + String(Number(token.value));
    return token.kind + token.value;
  });
  keys.sort();
  let h = 0x811c9dc5;
  const joined = keys.join('\u0001');
  for (let i = 0; i < joined.length; i += 1) {
    h ^= joined.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16) + ':' + keys.length;
}

const rels = [];
for (const root of ROOTS) walk(path.join(referenceDir, root), referenceDir, rels);

const report = {
  referenceDir,
  targetDir,
  formatted: Boolean(prettier),
  same: [],
  differ: [],
  mirrorOnly: [],
  unreadable: [],
};

for (const rel of rels.sort()) {
  const reference = path.join(referenceDir, rel);
  const target = path.join(targetDir, rel);
  if (!fs.existsSync(target)) {
    report.mirrorOnly.push(rel);
    continue;
  }
  const hr = await hashOf(reference);
  const ht = await hashOf(target);
  if ([hr, ht].some((h) => h === 'NOFILE' || h === 'LEXFAIL')) {
    report.unreadable.push([rel, hr, ht]);
  } else if (hr === ht) {
    report.same.push(rel);
  } else {
    const dr = Number(hr.split(':')[1]);
    const dt = Number(ht.split(':')[1]);
    report.differ.push([rel, dr, dt, dr - dt]);
  }
}

fs.writeFileSync(outJson, JSON.stringify(report, null, 1));
const raw = report.differ.map((row) => Math.abs(row[3]));
console.log('reference files scanned            :', rels.length);
console.log('identical (mod rename/escape/format):', report.same.length);
console.log('different                          :', report.differ.length);
console.log('  of which |token delta| <= 2      :', raw.filter((d) => d <= 2).length, '(likely cosmetic)');
console.log('  of which |token delta| >  2      :', raw.filter((d) => d > 2).length, '(real content work)');
console.log('absent from target (new modules)   :', report.mirrorOnly.length);
console.log('unreadable                         :', report.unreadable.length);
if (!prettier) console.log('WARNING: prettier not resolvable; formatting noise inflates `different`');
console.log('report ->', outJson);
