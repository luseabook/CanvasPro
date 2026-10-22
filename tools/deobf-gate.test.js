// Regression test for the de-obfuscation gate.
//
// A gate that has never been shown to fail is indistinguishable from a gate that
// always passes, and this one exists precisely because two earlier "the tree is
// clean" reports were false. So the tests below run the real gate as a child
// process against fixture trees and assert on its exit code.
//
// The positive cases are the two residues that actually survived to batch 167,
// plus shapes no batch has cleaned yet, so a future pass cannot quietly narrow
// the rules until the gate stops being able to fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'deobf-gate.mjs');

const run = (files) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'deobf-gate-'));
  try {
    for (const [rel, content] of Object.entries(files)) {
      const full = path.join(dir, rel);
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content, 'utf8');
    }
    // The gate takes --json=<path>, not a bare flag: it writes the report to a
    // file so a large finding list cannot flood the console summary.
    const reportPath = path.join(dir, 'gate-report.json');
    const r = spawnSync(process.execPath, [GATE, '--json=' + reportPath], {
      cwd: dir,
      encoding: 'utf8',
    });
    const report = fs.existsSync(reportPath)
      ? JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      : { failures: [], warnings: [] };
    return { status: r.status, stdout: r.stdout || '', report };
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
};

const idsOf = (r) => r.report.failures.map((f) => f.id);

test('clean source passes with exit 0', () => {
  const r = run({
    'src/modules/ok.js': [
      'export const isEmpty = (v) => String(v ?? "").trim().length === 0;',
      'export const picks = (xs) => xs.filter(Boolean).map((x) => x.id);',
    ].join('\n'),
  });
  assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(r.report.failures, []);
});

test('the two residues that survived to batch 167 are both caught', () => {
  const r = run({
    // The exact shapes from providerApiKeyMissingToast.mjs (15 sites) and
    // agentMessageTime.test.js (4 sites).
    'src/modules/legacyToast.mjs': 'export const ok = !![];\nexport const no = ![];\n',
    'src/modules/agent/stub.test.js': 'export const f = { setAttribute(_0x1, _0x2) { return [_0x1, _0x2]; } };\n',
  });
  assert.equal(r.status, 1, r.stdout);
  // 2 boolean sites + 4 identifier sites; the gate reports each site once.
  assert.deepEqual(idsOf(r).sort(), ['bool-literal', 'bool-literal', 'obf-identifier', 'obf-identifier', 'obf-identifier', 'obf-identifier']);
  assert.equal(r.report.failures.filter((f) => f.id === 'bool-literal').length, 2);
  assert.equal(r.report.failures.filter((f) => f.id === 'obf-identifier').length, 4);
});

test('short and long _0x forms are both caught', () => {
  const r = run({ 'src/a.js': 'const _0x1 = 1, _0x17f006 = 2, _0xa = 3;\n' });
  assert.equal(r.status, 1);
  assert.equal(r.report.failures.filter((f) => f.id === 'obf-identifier').length, 3);
});

test('.mjs and .cjs are scanned, not just .js', () => {
  // The blind spot that let providerApiKeyMissingToast.mjs through: the earlier
  // walker globbed .js only, so this file was never looked at.
  const r = run({
    'src/a.mjs': 'export const t = !![];\n',
    'electron/b.cjs': 'const u = ![];\n',
  });
  assert.equal(r.status, 1, r.stdout);
  assert.equal(r.report.failures.length, 2);
  assert.deepEqual(idsOf(r), ['bool-literal', 'bool-literal']);
});

test('root-level files are scanned', () => {
  const r = run({ 'main.js': 'const x = !![];\n' });
  assert.equal(r.status, 1, r.stdout);
  assert.equal(r.report.failures[0].file, 'main.js');
});

test('comments, strings and regex literals do not count as code', () => {
  // Token-level detection is the whole reason this gate can be strict: a grep
  // for "![]" cannot tell these apart from real code, and would either fail on
  // harmless text or need an allowlist that hides the real thing.
  const r = run({
    'src/a.js': [
      '// legacy note: this used to be !![] before the boolean pass',
      '/* and ![] here too */',
      'const s = "do not rewrite !![] inside a string";',
      'const re = /!!?\\[\\]/;',
      'export const template = `tpl ![] ${1}`;',
      'export const real = !![];',
    ].join('\n'),
  });
  assert.equal(r.status, 1, r.stdout);
  // Exactly the one real occurrence on the last line.
  assert.equal(r.report.failures.length, 1);
  assert.equal(r.report.failures[0].line, 6);
});

test('![][0] and ![].x index the array and are left alone', () => {
  const r = run({
    'src/a.js': 'export const a = ![][0];\nexport const b = ![].length;\n',
  });
  assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(r.report.failures, []);
});

test('debugger statements are caught', () => {
  const r = run({ 'src/a.js': 'export function f() {\n  debugger;\n}\n' });
  assert.equal(r.status, 1);
  assert.ok(idsOf(r).includes('debugger-stmt'));
});

test('string-array decoder and self-defending hooks are caught', () => {
  const r = run({
    'src/a.js': 'const t=(function(_0x1,_0x2){const _0x3=_0x1();while(true){try{break;}catch(_0x4){_0x3["push"](_0x3["shift"]());}}return _0x3;})(arr,1);\n',
    'src/b.js': 'Object.__defineGetter__(o,"k",{get:function(){return 1;}});\n',
  });
  assert.equal(r.status, 1, r.stdout);
  const ids = idsOf(r);
  assert.ok(ids.includes('string-array-decoder'), ids.join(','));
  assert.ok(ids.includes('self-defending'), ids.join(','));
});

test('eval and new Function warn but do not fail the build', () => {
  // Both have legitimate uses here; a gate that failed on them would be noise
  // and would eventually get switched off, protecting nothing.
  const r = run({ 'src/a.js': 'export const f = new Function("return 1");\nexport const g = eval("1+1");\n' });
  assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(r.report.failures, []);
  const warned = r.report.warnings.map((w) => w.id).sort();
  assert.deepEqual(warned, ['js-eval', 'new-function']);
});

test('vendor is excluded but the exclusion is reported', () => {
  const r = run({ 'vendor/x.js': 'const a = !![];\n', 'src/b.js': 'export const b = 1;\n' });
  assert.equal(r.status, 0, r.stdout);
  assert.match(r.stdout, /vendor excluded : yes/);
});

test('a file pasted in pre-minified fails, the same file formatted passes', () => {
  // 133 files in this tree arrived as a single line (up to 32 KB on one line).
  // Compression is a build failure of the same kind as obfuscation: the code is
  // present but unreadable, so review cannot happen at all. Asserting both
  // directions keeps this from degrading into a rule nobody can satisfy.
  const statements = [];
  for (let index = 0; index < 60; index += 1) statements.push(`export const v${index} = ${index};`);
  const compressed = statements.join(' ');
  const formatted = statements.join('\n');
  assert.ok(Buffer.byteLength(compressed) > 800, 'fixture must exceed the size floor');

  const pressed = run({ 'src/pressed.js': compressed });
  assert.equal(pressed.status, 1, pressed.stdout);
  assert.deepEqual(
    pressed.report.failures.map((item) => item.id),
    ['compressed-source']
  );

  assert.equal(run({ 'src/pressed.js': formatted }).status, 0, '格式化后必须通过');

  // 小文件不该误报：仓库里最小的合法两行模块是 315 字节。
  const tiny = 'export const STORYBOARD_ICON = "<svg></svg>";\nexport const OTHER = 1;';
  assert.equal(run({ 'src/tiny.js': tiny }).status, 0, '小文件不触发');
});
