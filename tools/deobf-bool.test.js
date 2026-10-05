// Regression tests for the boolean-literal de-obfuscation pass.
//
// The three earlier passes (rename, unescape, hexadecimal) each reported "nothing
// left" and each was right about its own layer while the tree still carried
// `!![]`. These tests exist so that claim is checked rather than assumed: they
// pin the transform, its guards, and the traps that cost real time to find.
//
//   node --test tools/deobf-bool.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { plan, applyEdits } from './deobf-bool.mjs';

const run = (source) => applyEdits(source, plan(source, 'test'));

test('rewrites !![] to true and ![] to false', () => {
  assert.equal(run('return !![];'), 'return true;');
  assert.equal(run('return ![];'), 'return false;');
});

test('the rewrite is semantically identical', () => {
  // `[]` is truthy, so the substitution is decided by the language. Evaluating
  // both sides is stronger than pattern-matching the input.
  const before = Function('"use strict";return (!![])')();
  const after = Function('"use strict";return (' + run('!![]') + ')')();
  assert.equal(before, true);
  assert.equal(after, before);
});

test('leaves a genuine boolean alone', () => {
  const source = 'const a = true; const b = false;';
  assert.equal(run(source), source);
});

test('leaves !![] inside a string, template, comment and regex', () => {
  const cases = [
    "const s = '!![]';",
    'const s = `!![]`;',
    '// !![] is not code\nconst a = 1;',
    '/* ![] */ const a = 1;',
    "const re = /!\\[\\]/;",
  ];
  for (const source of cases) assert.equal(run(source), source, source);
});

test('does not touch an index or member chain on the array', () => {
  // `![][0]` is `!([][0])` = true and `![].x` is `!(undefined)`; rewriting the
  // brackets would change what is being negated. The inventory found none of
  // these in the tree, and the guard means none would be rewritten if it did.
  for (const source of ['const a = ![][0];', 'const a = ![].x;']) {
    assert.equal(plan(source, 'test').length, 0, source);
  }
});

test('refuses a spaced-out bang-bracket rather than mis-measuring it', () => {
  // prettier emits `! []` in places, which shifts the token offset by one. The
  // span is measured back from the `]` by an exact character count, so a spaced
  // form would slice to `" []"` -- the guard rejects it instead of writing
  // something wrong. The inventory found 0 such forms in the tree, so refusing is
  // a safety net rather than a case that currently loses a rewrite.
  assert.throws(() => run('return ! [];'), /not a bare/);
  assert.throws(() => run('return ! ! [];'), /not a bare/);
});

test('refuses a chain that is not a bare bang-bracket', () => {
  // `![]["x"]` never reaches the slice guard because the index-chain guard
  // declines it first; the point is that it is left untouched.
  assert.deepEqual(plan('const a = ![]["x"];', 'test'), []);
});

test('never emits a negated boolean', () => {
  // The bug above was silent: `![]` -> `!false` is the same value, so tests that
  // only assert behaviour would pass. Assert the shape of the output.
  const samples = [
    'if (!a) return ![];',
    'const x = {} && ![];',
    'for (let i = 0; ![]; i += 1) {}',
  ];
  for (const source of samples) {
    const out = run(source);
    assert.ok(!/!true|!false/.test(out), out);
  }
});

test('applies every span in one pass', () => {
  assert.equal(run('if (a) return !![]; else return ![];'), 'if (a) return true; else return false;');
  assert.equal(plan('!![] ![] !![]', 'test').length, 3);
});

test('tolerates no occurrences at all', () => {
  const source = 'export const answer = 42;\n';
  assert.deepEqual(plan(source, 'test'), []);
  assert.equal(run(source), source);
});

test('refuses to rewrite anything that is not a bare bang-bracket', () => {
  // A genuine one-character mismatch must surface as a loud failure rather than
  // a plausible-looking edit. Reaching this means the span measurement drifted.
  assert.throws(() => plan('const a = ! [] ;', 'test'), /not a bare/);
});