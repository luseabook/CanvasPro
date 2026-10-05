// Proves that tools/deobf-unescape.mjs changed nothing but the spelling of
// literals.
//
//   node tools/deobf-unescape-verify.mjs <original.js> <rewritten.js>
//
// Four independent checks, all of which must hold:
//
//   V0  delete every literal body from both files and compare the remainder.
//       Anything the rewriter touched outside a literal would show up here.
//   V1  compare the token streams produced by the shared lexer
//       (tools/deobf-lex.mjs). This is the check the rename gate uses, and it
//       does not depend on the rewriter's own scanner.
//   V2  decode every literal body with the shared `stringValue` and compare.
//       A rewrite that silently changed a string's value fails here.
//   V3  the byte length may only shrink or stay equal — a plain form is never
//       longer than the escaped form it replaces.
//
// Exit code 0 means PASS.
import fs from 'node:fs';
import { lex, stringValue } from './deobf-lex.mjs';
import { scan } from './deobf-unescape.mjs';

// `stringValue` slices off the first and last character, so wrapping a body in
// quotes decodes it with the shared, already-trusted implementation.
const decode = (body) => stringValue('"' + body + '"');

// Kept in source order: the rewrite never adds or removes a literal, so
// position `n` in one file must be position `n` in the other. Sorting would
// destroy that alignment, because re-spelling a literal moves its sort key.
function literalBodies(source) {
  return scan(source).literals.map((literal) => source.slice(literal.start, literal.end));
}

function withoutLiterals(source) {
  const literals = scan(source).literals.slice().sort((a, b) => b.start - a.start);
  let out = source;
  for (const literal of literals) out = out.slice(0, literal.start) + out.slice(literal.end);
  return out;
}

function skeleton(source) {
  return lex(source).map((token) => {
    if (token.kind === 'string' || token.kind === 'template') return token.kind + ':' + decode(token.value);
    return token.kind + ':' + token.value;
  });
}

function lineAt(source, index) {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i += 1) if (source[i] === '\n') line += 1;
  return line;
}

// In `--numbers` mode the rewriter is also allowed to respell integer literals
// outside strings. Comparing integers by value is exactly the licence V1 already
// grants through the shared lexer, so V0 applies the same licence to the text
// that sits outside literals: every integer becomes its numeric value, and the
// remainder must still be byte-identical.
function normalizeIntegers(source) {
  const { literals, expressions, comments } = scan(source);
  const spans = [];
  for (const literal of literals) spans.push([Math.max(0, literal.start - 1), literal.end + 1]);
  for (const [start, end] of expressions) spans.push([start, end]);
  for (const [start, end] of comments) spans.push([start, end]);
  spans.sort((a, b) => a[0] - b[0]);
  const inside = (index) => spans.some(([start, end]) => index >= start && index < end);
  return source.replace(/\b0x[0-9a-fA-F]+\b|\b\d+\b/g, (whole, offset) =>
    inside(offset) ? whole : String(Number(whole)));
}

function main() {
  const args = process.argv.slice(2);
  const numbers = args.includes('--numbers');
  const positional = args.filter((arg) => !arg.startsWith('--'));
  const [originalPath, rewrittenPath] = positional;
  if (!originalPath || !rewrittenPath) {
    console.error('usage: node tools/deobf-unescape-verify.mjs [--numbers] <original.js> <rewritten.js>');
    process.exit(2);
  }
  const original = fs.readFileSync(originalPath, 'utf8');
  const rewritten = fs.readFileSync(rewrittenPath, 'utf8');
  const failures = [];

  // V0
  const bareOriginal = withoutLiterals(numbers ? normalizeIntegers(original) : original);
  const bareRewritten = withoutLiterals(numbers ? normalizeIntegers(rewritten) : rewritten);
  if (bareOriginal !== bareRewritten) {
    let index = 0;
    while (index < bareOriginal.length && bareOriginal[index] === bareRewritten[index]) index += 1;
    failures.push(
      'V0 source outside literals changed near line ' + lineAt(original, index) +
        ': ' + JSON.stringify(bareOriginal.slice(index, index + 40)) +
        ' -> ' + JSON.stringify(bareRewritten.slice(index, index + 40)),
    );
  }

  // V1
  const before = skeleton(original);
  const after = skeleton(rewritten);
  if (before.length !== after.length) {
    failures.push('V1 token count changed: ' + before.length + ' -> ' + after.length);
  }
  const limit = Math.min(before.length, after.length);
  for (let index = 0; index < limit; index += 1) {
    if (before[index] !== after[index]) {
      failures.push('V1 token ' + index + ' changed: ' + before[index] + ' -> ' + after[index]);
      if (failures.length > 20) break;
    }
  }

  // V2
  const bodiesBefore = literalBodies(original);
  const bodiesAfter = literalBodies(rewritten);
  if (bodiesBefore.length !== bodiesAfter.length) {
    failures.push('V2 literal count changed: ' + bodiesBefore.length + ' -> ' + bodiesAfter.length);
  }
  const pairLimit = Math.min(bodiesBefore.length, bodiesAfter.length);
  for (let index = 0; index < pairLimit; index += 1) {
    const a = decode(bodiesBefore[index]);
    const b = decode(bodiesAfter[index]);
    if (a !== b) {
      failures.push(
        'V2 literal ' + index + ' value changed: ' +
          JSON.stringify(bodiesBefore[index].slice(0, 40)) + ' -> ' +
          JSON.stringify(bodiesAfter[index].slice(0, 40)),
      );
      if (failures.length > 20) break;
    }
  }

  // V3
  if (rewritten.length > original.length) {
    failures.push('V3 file grew: ' + original.length + ' -> ' + rewritten.length + ' bytes');
  }

  if (failures.length) {
    console.error('FAIL ' + rewrittenPath);
    for (const failure of failures.slice(0, 25)) console.error('  - ' + failure);
    if (failures.length > 25) console.error('  ... ' + (failures.length - 25) + ' more');
    process.exit(1);
  }

  console.log(
    'PASS ' + rewrittenPath + ': ' + before.length + ' tokens and ' +
      bodiesBefore.length + ' literals identical, ' +
      (original.length - rewritten.length) + ' bytes shorter',
  );
}

main();
