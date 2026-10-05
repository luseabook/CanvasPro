// Regression tests for the unescape rewriter.
//
// Two behaviours here were wrong in the first version of the tool and are easy
// to break again:
//
//   1. a template literal nested inside a substitution used to make the
//      scanner swallow the rest of the file, so every number and escape after
//      it was left untouched;
//   2. single-nibble hexadecimal integers were treated as deliberate bit
//      masks and kept, which left `0x0`, `0x1` and friends all over the tree.
import test from 'node:test';
import assert from 'node:assert/strict';

import { decimalForm, rewriteSource, scan } from './deobf-unescape.mjs';

const rewrite = (source, options = { numbers: true }) => {
  const result = rewriteSource(source, options);
  assert.notEqual(result, null, 'rewriter refused the source');
  return result;
};

test('a nested template does not swallow the rest of the file', () => {
  const source = [
    'const id = `renderer-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`}`;',
    'const timeout = Number(value || 0) || 0x927c0;',
    '',
  ].join('\n');

  const { expressions } = scan(source);
  for (const [start, end] of expressions) {
    assert.ok(end < source.length, `substitution at ${start} ran past the end of the file`);
  }

  const result = rewrite(source);
  assert.equal(result.numbers, 1);
  assert.match(result.source, /0\) \|\| 600000;/);
  assert.match(result.source, /`\$\{Date\.now\(\)\}-\$\{Math\.random\(\)\}`/);
});

test('single nibbles are rewritten to decimal', () => {
  const source = 'const list = [0.1, 0.2, 0.5, 0x1, 0x2, 0x5, 0xa, 0xf];\nexport { list };\n';
  const result = rewrite(source);
  assert.equal(result.numbers, 5);
  assert.match(result.source, /\[0\.1, 0\.2, 0\.5, 1, 2, 5, 10, 15\]/);
});

test('a single nibble is rewritten even where it could read as a mask', () => {
  const result = rewrite('const flags = value & 0xf;\nexport { flags };\n');
  assert.equal(result.numbers, 1);
  assert.match(result.source, /value & 15;/);
});

test('deliberate hexadecimal constants keep their spelling', () => {
  for (const kept of ['0xff', '0xaa', '0x7f', '0x811c9dc5', '0x7fffffff', '0x0002', '0x06054b50']) {
    assert.equal(decimalForm(parseInt(kept.slice(2), 16), kept.slice(2)), null, kept + ' should be kept');
  }
});

test('converted hexadecimal constants lose their spelling', () => {
  assert.equal(decimalForm(0x927c0, '927c0'), '600000');
  assert.equal(decimalForm(0x1505, '1505'), '5381');
  assert.equal(decimalForm(0x3c, '3c'), '60');
  assert.equal(decimalForm(0x0, '0'), '0');
  assert.equal(decimalForm(0xf, 'f'), '15');
});

test('rewriting is idempotent', () => {
  const source = 'const a = `x-${p || `${q}`}`;\nconst b = "\\x22hi\\x22";\nconst c = 0x1 + 0x1f;\n';
  const once = rewrite(source).source;
  const twice = rewrite(once);
  assert.equal(twice.source, once);
  assert.equal(twice.escapes, 0);
  assert.equal(twice.numbers, 0);
});

test('escapes are re-quoted for the context they live in', () => {
  const source = "const single = '\\x22a\\x22';\nconst double = \"\\x22a\\x22\";\nexport { single, double };\n";
  const result = rewrite(source, { numbers: false });
  assert.equal(result.escapes, 4);
  assert.match(result.source, /const single = '"a"';/);
  assert.match(result.source, /const double = "\\"a\\"";/);
});

test('a number inside a template chunk is text, not code', () => {
  const result = rewrite('const label = `0x1 ${count}`;\nexport { label };\n');
  assert.equal(result.numbers, 0);
  assert.match(result.source, /`0x1 \$\{count\}`/);
});
