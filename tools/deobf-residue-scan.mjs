// Inventory every de-obfuscation residue still present in the tree.
//
// The previous three passes (rename, unescape, hexadecimal) each swept one
// layer and reported "nothing left". That was true per layer and false overall:
// `!![]` survived all three because none of them looked at operators. This
// scanner exists so the next pass starts from a measured list rather than from
// another assumption.
//
// It walks the token stream instead of grepping raw text, so a `\x2e` inside a
// string literal or a `// ![]` inside a comment is not counted as code. That
// distinction is the whole reason the earlier `grep`-based probes were able to
// report a false zero on the installed mirror.
//
// Usage:
//   node tools/deobf-residue-scan.mjs [treeRoot] [--out=<report.json>]
//
// treeRoot defaults to the repository root and is walked for src/, api/,
// electron/ and vendor/ separately, because `vendor/` is upstream code whose
// hex literals and bit masks are intentional and must never be rewritten.
import fs from 'node:fs';
import path from 'node:path';
import { lex, stringValue } from './deobf-lex.mjs';

const argv = process.argv.slice(2);
const outFlag = argv.find((a) => a.startsWith('--out='));
const positional = argv.filter((a) => !a.startsWith('--'));
const treeRoot = positional[0] || process.cwd();
const outJson = outFlag ? outFlag.slice('--out='.length) : null;

const ROOTS = ['src', 'api', 'electron', 'vendor'];

// Residue kinds. `code` positions are the only ones that may be rewritten;
// `literal` positions are escaped text inside a string/template and are handled
// by the unescape pass instead. Keeping them apart here is what stops a
// rewriter from touching vendored or intentional text.
const KINDS = [
  // -- boolean-literal obfuscation: `![]` / `!![]` stand in for true/false -----
  // This is the layer all three previous passes missed. `[]` is truthy, so
  // `!![]` is exactly `true` and `![]` is exactly `false`.
  {
    id: 'bool-array',
    test: (t, i, toks) => {
      if (t.kind !== 'punct' || t.value !== '!') return false;
      let j = i;
      let bangs = 0;
      while (toks[j] && toks[j].kind === 'punct' && toks[j].value === '!') {
        bangs += 1;
        j += 1;
      }
      if (!bangs || bangs > 2) return false;
      const open = toks[j];
      const close = toks[j + 1];
      if (!open || open.kind !== 'punct' || open.value !== '[') return false;
      if (!close || close.kind !== 'punct' || close.value !== ']') return false;
      // `![]`  must not be a prefix of a member/index chain (`![][0]`), which
      // would make the brackets part of a larger expression.
      const after = toks[j + 2];
      if (after && after.kind === 'punct' && ['[', '.'].includes(after.value)) return false;
      return true;
    },
    render: (t, i, toks) => {
      let bangs = 0;
      let j = i;
      while (toks[j] && toks[j].kind === 'punct' && toks[j].value === '!') {
        bangs += 1;
        j += 1;
      }
      return bangs === 2 ? '!![]' : '![]';
    },
  },
  // -- bracket member access: obj['prop'] instead of obj.prop -----------------
  // Not wrong, and it is the house style for ported files, but it is a
  // readability residue: it defeats editor completion and grep.
  {
    id: 'bracket-member',
    test: (t, i, toks) =>
      t.kind === 'string' &&
      toks[i - 1] &&
      toks[i - 1].kind === 'punct' &&
      toks[i - 1].value === '[' &&
      toks[i + 1] &&
      toks[i + 1].kind === 'punct' &&
      toks[i + 1].value === ']',
    render: (t) => stringValue(t.value),
  },
  // -- void 0 for undefined ---------------------------------------------------
  {
    id: 'void-zero',
    test: (t, i, toks) =>
      t.kind === 'identifier' &&
      t.value === 'void' &&
      toks[i + 1] &&
      toks[i + 1].kind === 'number' &&
      Number(toks[i + 1].value) === 0,
    render: () => 'void 0',
  },
  // -- hexadecimal integer literals ------------------------------------------
  // Counted from the RAW text, not from the token stream: `lex()` normalises
  // every number through `String(Number(text))`, so `0xff` reaches the matcher
  // already spelled `255`. An earlier version of this file probed the token
  // stream and duly reported zero hex literals in a tree known to contain
  // hundreds — the detector was broken, not the tree.
  {
    id: 'hex-literal',
    raw: /(?<![\w$.])(-?)0[xX][0-9a-f]+(?![\w$])/g,
    render: (match) => match[0],
  },
  // -- escapes inside string / template literals ------------------------------
  {
    id: 'literal-escape',
    test: (t) => (t.kind === 'string' || t.kind === 'template') && /\\[xu]/.test(t.value),
    render: (t) => t.value,
  },
  // -- leftover obfuscator identifiers ----------------------------------------
  {
    id: 'obf-identifier',
    test: (t) => t.kind === 'identifier' && /^_0x[0-9a-f]{4,}$/i.test(t.value),
    render: (t) => t.value,
  },
  // -- string concatenation of single characters ------------------------------
  // `'a' + 'b' + 'c'` is what a string-array split leaves behind.
  {
    id: 'char-concat',
    test: (t, i, toks) => {
      if (t.kind !== 'string') return false;
      const decoded = stringValue(t.value);
      if (decoded.length !== 1) return false;
      const prev = toks[i - 1];
      const next = toks[i + 1];
      return (
        prev && prev.kind === 'punct' && prev.value === '+' &&
        next && next.kind === 'punct' && next.value === '+'
      );
    },
    render: (t) => stringValue(t.value),
  },
  // -- comma-expression statement sequences ----------------------------------
  // `(a(), b())` is how dead code and debug hooks get injected.
  {
    id: 'comma-call',
    test: (t, i, toks) =>
      t.kind === 'punct' &&
      t.value === ',' &&
      toks[i - 1] &&
      toks[i - 1].kind === 'punct' &&
      toks[i - 1].value === ')' &&
      toks[i + 1] &&
      toks[i + 1].kind === 'identifier',
    render: () => '), ' + '',
  },
  // -- debug leftovers --------------------------------------------------------
  {
    id: 'debugger-stmt',
    test: (t) => t.kind === 'identifier' && t.value === 'debugger',
    render: () => 'debugger',
  },
  {
    id: 'console-left',
    test: (t) => t.kind === 'identifier' && t.value === 'console',
    render: () => 'console',
  },
];

const files = [];
// Every raw-text detector gets its own RegExp instance: a shared one would
// carry `lastIndex` between files and silently skip matches.
const RE = {};
for (const kind of KINDS) if (kind.raw) RE[kind.raw] = new RegExp(kind.raw.source, kind.raw.flags);
const note = (kind, file, source, offset, text) => {
  const stat = byKind[kind.id];
  stat.count += 1;
  stat.files.add(file);
  if (stat.samples.length < 8) {
    stat.samples.push({ file, line: source.slice(0, offset).split('\n').length, text: String(text).slice(0, 60) });
  }
};
const walk = (dir, relBase, bucket) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = relBase ? `${relBase}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      walk(full, rel, bucket);
    } else if (entry.name.endsWith('.js')) {
      files.push({ full, rel: `${bucket}/${rel}` });
    }
  }
};
for (const bucket of ROOTS) walk(path.join(treeRoot, bucket), '', bucket);

const byKind = {};
for (const kind of KINDS) byKind[kind.id] = { count: 0, files: new Set(), samples: [] };
const perFile = [];
let unreadable = 0;

for (const file of files) {
  let source;
  try {
    source = fs.readFileSync(file.full, 'utf8');
  } catch {
    unreadable += 1;
    continue;
  }
  let tokens;
  try {
    tokens = lex(source);
  } catch {
    unreadable += 1;
    continue;
  }
  const bucket = file.rel.split('/')[0];
  const fileRow = { file: file.rel, kinds: {} };
  for (const kind of KINDS) {
    let hits = 0;
    if (kind.raw) {
      // Raw-text kinds skip comments and strings by construction: they exist
      // for shapes the token stream normalises away. Over-counting inside a
      // comment is acceptable here because this scanner only inventories; the
      // rewriters that follow are token-driven.
      const pattern = RE[kind.raw];
      pattern.lastIndex = 0;
      let m;
      while ((m = pattern.exec(source)) !== null) {
        hits += 1;
        note(kind, file.rel, source, m.index, kind.render(m));
        if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
      }
    } else {
      for (let i = 0; i < tokens.length; i += 1) {
        let matched = false;
        try {
          matched = kind.test(tokens[i], i, tokens);
        } catch {
          matched = false;
        }
        if (!matched) continue;
        hits += 1;
        note(kind, file.rel, source, tokens[i].offset, kind.render(tokens[i], i, tokens));
      }
    }
    if (hits) fileRow.kinds[kind.id] = hits;
  }
  if (Object.keys(fileRow.kinds).length) perFile.push(fileRow);
}

const report = {
  treeRoot,
  filesScanned: files.length,
  unreadable,
  totals: Object.fromEntries(
    KINDS.map((k) => [k.id, { occurrences: byKind[k.id].count, files: byKind[k.id].files.size }]),
  ),
  samples: Object.fromEntries(
    KINDS.map((k) => [k.id, byKind[k.id].samples]),
  ),
  perFile,
};

const ORDER = ['obf-identifier', 'literal-escape', 'hex-literal', 'bool-array', 'void-zero', 'bracket-member', 'char-concat', 'comma-call', 'debugger-stmt', 'console-left'];
console.log('tree root                    :', treeRoot);
console.log('js files scanned             :', report.filesScanned, unreadable ? `(unreadable ${unreadable})` : '');
console.log('');
console.log('kind                 occurrences   files');
for (const id of ORDER) {
  const t = report.totals[id];
  console.log('  ' + id.padEnd(18) + String(t.occurrences).padStart(10) + String(t.files).padStart(8));
}
// Per-tree breakdown for one kind. The earlier version summed every kind per
// tree and labelled the total with a single kind's name, which printed two
// identical rows and hid the only number that mattered: `vendor/` is clean.
const split = (bucket, kindId) => {
  let occ = 0;
  let n = 0;
  for (const row of perFile) {
    if (!row.file.startsWith(bucket + '/')) continue;
    if (!row.kinds[kindId]) continue;
    n += 1;
    occ += row.kinds[kindId];
  }
  return `${occ} occ / ${n} files`;
};
console.log('');
for (const id of ['bool-array', 'hex-literal', 'bracket-member', 'char-concat']) {
  console.log(('  ' + id).padEnd(20) + ROOTS.map((b) => `${b} ${split(b, id)}`).join('   '));
}

if (outJson) {
  const plain = { ...report, totals: report.totals, samples: report.samples };
  for (const id of Object.keys(plain.totals)) {
    plain.samples[id] = report.samples[id];
  }
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(plain, null, 2));
  console.log('');
  console.log('report ->', outJson);
}