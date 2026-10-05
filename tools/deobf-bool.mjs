// Rewrite the boolean-literal obfuscation layer: `![]` -> `false`, `!![]` -> `true`.
//
// Why this layer survived the rename / unescape / hex passes: those all operate
// on identifiers and literals, and `!![]` is neither. It is an *operator*
// sequence over an array literal -- `[]` is truthy, so `!![]` is exactly `true`
// and `![]` is exactly `false`, by the language, not by inspection.
//
// Safety rests on two things:
//
//   1. Positions come from the shared lexer (`deobf-lex.mjs`), so a `![]` inside
//      a string, a template body, a comment or a regex is never a candidate.
//      Matching with a regex on raw text would rewrite those, and the previous
//      three passes were all built on the token stream for the same reason.
//   2. A run of `!` followed by `[]` is only rewritten when the brackets are a
//      fresh array literal -- `![][0]` and `![].x` index into the array and must
//      be left alone. The inventory found 0 such cases in the tree, and the
//      guard means the rewriter would skip them if any appeared.
//
// This does not touch identifiers, object keys, member names or the export
// surface, so it is a pure expression-level rewrite with an exactly predictable
// result. The companion verifier (`deobf-bool-verify.mjs`) re-derives the
// claim independently rather than trusting this one.
//
// Usage:
//   node tools/deobf-bool.mjs <file...>            dry run, prints the plan
//   node tools/deobf-bool.mjs --write <file...>     rewrite in place
//
// `vendor/` is skipped unconditionally: three.js is upstream code where the
// bit-mask hex literals are deliberate.
import fs from 'node:fs';
import path from 'node:path';
import { lex } from './deobf-lex.mjs';

// Returns, for one source, the edits to apply as [start, end, replacement].
// Offsets are absolute so multiple edits in a file cannot disturb each other.
export function plan(source, file = '<source>') {
  const tokens = lex(source);
  const edits = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t.kind !== 'punct' || t.value !== '!') continue;

    // Count the run of `!`. Anything longer than two is not this pattern
    // (`!!![]` would be a third negation, not a boolean literal).
    let j = i;
    let bangs = 0;
    while (bangs < 3) {
      const tok = tokens[j];
      if (!tok || tok.kind !== 'punct' || tok.value !== '!') break;
      bangs += 1;
      j += 1;
    }
    if (!bangs || bangs > 2) continue;

    const open = tokens[j];
    const close = tokens[j + 1];
    if (!open || open.kind !== 'punct' || open.value !== '[') continue;
    if (!close || close.kind !== 'punct' || close.value !== ']') continue;

    // The brackets must be the whole expression, not the head of a member or
    // index chain.
    const next = tokens[j + 2];
    if (next && next.kind === 'punct' && (next.value === '[' || next.value === '.')) continue;

    // Offset semantics, established by inspecting `deobf-lex.mjs` and then
  // confirmed against the source text:
  //
  //   `]` token.offset points AT the `]`.       (src[offset-1] === ']')
  //   `!` token.offset points just PAST the `!`. (src[offset-1] === '!')
  //
  // The `!` offset drifts by one whenever whitespace separates it from the
  // bracket, so it cannot be a slice bound. Slicing with the raw offsets turned
  // `return ![]` into `return !false` across 93 sites in one sample file:
  // semantically the same value, but it is precisely the unreadable output this
  // whole effort exists to remove.
  //
  // `]` is the reliable anchor -- the scanner eats whitespace before the bracket
  // -- so the span is measured backwards from it by the known length, and the
  // resulting text is asserted before any edit is recorded.
  const end = close.offset;
    const start = end - (bangs + 2);
    const original = source.slice(start, end);
    if (!/^!{1,2}\[\]$/.test(original)) {
      throw new Error(
        (file || '<source>') + ': refusing to rewrite ' + JSON.stringify(original) +
        ' at offset ' + start + ' -- it is not a bare `![]` / `!![]` expression',
      );
    }
    edits.push({ start, end, text: bangs === 2 ? 'true' : 'false' });
    i = j + 1;
  }
  return edits;
}

export function applyEdits(source, edits) {
  let out = '';
  let cursor = 0;
  for (const edit of edits) {
    // `return![]` is valid, but splicing `false` in without a separator yields
    // `returnfalse`: one identifier, silently different code. Keep the token
    // boundary whenever the replacement would otherwise fuse with the byte before it.
    const previous = source[edit.start - 1] ?? '';
    const separator = /[A-Za-z0-9_$.]/.test(previous) ? ' ' : '';
    out += source.slice(cursor, edit.start) + separator + edit.text;
    cursor = edit.end;
  }
  return out + source.slice(cursor);
}

function main() {
  const argv = process.argv.slice(2);
  const write = argv.includes('--write');
  const targets = argv.filter((a) => !a.startsWith('--'));
  if (!targets.length) {
    console.error('usage: node tools/deobf-bool.mjs [--write] <file...>');
    process.exit(2);
  }

  const skip = (file) => file.replace(/\\/g, '/').includes('vendor/');

  let totalEdits = 0;
  let touchedFiles = 0;
  let skipped = 0;
  const SKIP_DIRS = new Set(['node_modules', '.git']);

  const collect = (arg) => {
    let stat;
    try {
      stat = fs.statSync(arg);
    } catch {
      return [];
    }
    if (stat.isFile()) return [arg];
    const out = [];
    const walk = (dir) => {
      let entries;
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (SKIP_DIRS.has(entry.name)) continue;
          walk(full);
        } else if (entry.name.endsWith('.js')) {
          out.push(full);
        }
      }
    };
    walk(arg);
    return out;
  };

  const all = targets.flatMap(collect);
  for (const file of all) {
    if (skip(file)) {
      skipped += 1;
      continue;
    }
    let source;
    try {
      source = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const edits = plan(source, file);
    if (!edits.length) continue;
    totalEdits += edits.length;
    touchedFiles += 1;
    if (write) {
      fs.writeFileSync(file, applyEdits(source, edits));
    } else {
      const rel = file.replace(/\\/g, '/');
      console.log(
        edits.length.toString().padStart(5) + '  ' + rel +
        '   e.g. ' + JSON.stringify(edits[0].text) + ' @ line ' +
        source.slice(0, edits[0].start).split('\n').length,
      );
    }
  }

  console.log('');
  console.log(
    (write ? 'rewrote ' : 'would rewrite ') + totalEdits + ' occurrence(s) in ' +
    touchedFiles + ' file(s)' + (skipped ? ' (skipped ' + skipped + ' vendor file(s))' : ''),
  );
  console.log('vendor/ is excluded unconditionally: upstream three.js, bit masks are deliberate.');
}

// Guarded so this module can be imported for its functions without the CLI
// running against whatever arguments the importing process happened to carry.
if (process.argv[1] && process.argv[1].endsWith('deobf-bool.mjs')) main();
