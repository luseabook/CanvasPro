// Regression tests for the port-parity gate.
//
// The gate exists because a module kept calling methods that were never ported
// (`previewControlsModule` held 18 of 30 methods while `unmount()` already called
// the missing cleanups). A gate that cannot fail would repeat that blindness, so
// these tests pin both directions: it must report a real loss, and it must not
// report a relocated or differently-written method as lost.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  comparePortParity,
  diffAgainstBaseline,
  extractAliasSignatures,
  extractMethodNames,
  extractMethodSignatures,
  listJavaScriptFiles,
} from './check-port-parity.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE = path.join(HERE, 'check-port-parity.mjs');

/** Creates a throwaway tree from a relative-path -> content map. */
function makeTree(files) {
  // The offline unit guard refuses writes outside the isolated copy, so fixtures
  // must live under the sandbox root instead of os.tmpdir().
  const sandboxRoot = process.env.AIC_TEST_SANDBOX_ROOT;
  if (!sandboxRoot) throw new Error('AIC_TEST_SANDBOX_ROOT is required');
  const root = fs.mkdtempSync(path.join(sandboxRoot, 'port-parity-'));
  for (const [relativePath, content] of Object.entries(files)) {
    const full = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf8');
  }
  return root;
}

test('check-port-parity: 三种方法定义形态都能识别', () => {
  const source = [
    'class Demo {',
    "  ['_computed'](a) {",
    '    return a;',
    '  }',
    '  _plain(b) {',
    '    return b;',
    '  }',
    '}',
    'function build() {',
    '  return {',
    "    'quoted'(c) {",
    '      return c;',
    '    },',
    "    'value': 1,",
    '  };',
    '}',
  ].join('\n');
  const names = extractMethodNames(source);
  (assert.equal(names.has('_computed'), true, '计算键'),
    assert.equal(names.has('_plain'), true, '普通标识符'),
    assert.equal(names.has('quoted'), true, '引号字面量键 + 方法简写'),
    assert.equal(names.has('value'), false, '普通属性不是方法'));
});

test('check-port-parity: 参数列表跨行的方法不会被漏掉', () => {
  // 这正是首版审计脚本漏掉 `_schedulePreviewHoverPlaybackWhenVideoReady` 的原因：
  // 单行正则要求 `)` 与 `{` 之间只有空白，跨行签名直接匹配失败。
  const source = [
    'class Demo {',
    "  ['_multiline']({",
    '    first: first = false,',
    '    second: second = null,',
    '  } = {}) {',
    '    return first || second;',
    '  }',
    '}',
  ].join('\n');
  assert.equal(extractMethodNames(source).has('_multiline'), true);
});

test('check-port-parity: 控制流与静态属性调用不被当成方法定义', () => {
  const source = [
    'function run(list) {',
    '  if (list) {',
    '    for (const item of list) {',
    '      Object.freeze(item);',
    '    }',
    '  }',
    '  return list;',
    '}',
  ].join('\n');
  const names = extractMethodNames(source);
  (assert.equal(names.has('if'), false),
    assert.equal(names.has('for'), false),
    assert.equal(names.has('freeze'), false));
});

test('check-port-parity: 区分「真空缺」与「已迁移到其它文件」', () => {
  const mirror = makeTree({
    'src/a.js': 'class A {\n  _one() {}\n  _two() {}\n}\n',
    'src/b.js': 'class B {\n  _alpha() {}\n  _beta() {}\n}\n',
    'src/c.js': 'class C {\n  _lost() {}\n}\n',
  });
  const repo = makeTree({
    // 只落了一半：`_two` 在仓库任何文件都没有定义。
    'src/a.js': 'class A {\n  _one() {}\n}\n',
    // `_beta` 被拆到 sibling 文件，属于迁移不算丢失。
    'src/b.js': 'class B {\n  _alpha() {}\n}\n',
    'src/sibling.js': 'class S {\n  _beta() {}\n}\n',
    // 整件未落：同名文件里一个方法都没有。
    'src/c.js': 'export const placeholder = true;\n',
  });
  const report = comparePortParity(mirror, repo);
  const byFile = new Map(report.rows.map((row) => [row.file, row]));
  (assert.equal(report.comparedFiles, 3),
    assert.deepEqual(byFile.get('src/a.js').missing, ['_two'], '半移植要报出来'),
    assert.equal(byFile.has('src/b.js'), false, '迁移到 sibling 的方法不算缺失'),
    assert.deepEqual(byFile.get('src/c.js').missing, ['_lost'], '整件未落要报出来'));
  const moved = report.rows.find((row) => row.file === 'src/a.js');
  assert.deepEqual(moved.relocated, [], '没有同名方法被迁移时 relocated 应为空');
});

test('check-port-parity: 基线只拦新增缺口，并识别已补齐项', () => {
  const rows = [
    { file: 'src/a.js', upstream: 3, repo: 1, missing: ['_two', '_three'], relocated: [] },
  ];
  // 基线已接受 `_two`，`_three` 是新增 → 必须失败。
  const strict = diffAgainstBaseline(rows, { files: { 'src/a.js': ['_two'] } });
  (assert.equal(strict.totalMissing, 2),
    assert.deepEqual(strict.regressions, [{ file: 'src/a.js', missing: ['_three'] }]));
  // 基线已覆盖全部缺口 → 无回归。
  const accepted = diffAgainstBaseline(rows, { files: { 'src/a.js': ['_two', '_three'] } });
  assert.deepEqual(accepted.regressions, []);
  // 基线里的项已不存在 → 记为 resolved，提示收紧基线。
  const tightened = diffAgainstBaseline([], { files: { 'src/a.js': ['_two', '_three'] } });
  assert.deepEqual(tightened.resolved, [{ file: 'src/a.js', count: 2 }]);
});

test('check-port-parity: 跳过 vendor 与构建产物目录', () => {
  const root = makeTree({
    'src/keep.js': 'export const a = 1;\n',
    'vendor/skip.js': 'export const b = 1;\n',
    'node_modules/pkg/skip.js': 'export const c = 1;\n',
    'dist-win/skip.js': 'export const d = 1;\n',
  });
  const files = listJavaScriptFiles(root);
  assert.deepEqual(files, ['src/keep.js']);
});

test('check-port-parity: 找不到镜像时跳过而不是失败', () => {
  const missingMirror = path.join(os.tmpdir(), 'port-parity-does-not-exist-' + process.pid);
  const result = spawnSync(process.execPath, [GATE, '--mirror', missingMirror], {
    encoding: 'utf8',
  });
  (assert.equal(result.status, 0, '无镜像应正常退出'),
    assert.match(result.stdout, /SKIP/, '并明确说明跳过原因'));
});

test('check-port-parity: 别名属性与箭头属性进别名集，不进严格集', () => {
  // 这正是 `agentSessionStore` 只报 18 而不是 27 的原因：`recordRunEvent` 在上游是
  // `recordRunEvent: _0x1243ae`（指向同文件函数），名字根本没出现在方法定义里。
  const source = [
    'function build() {',
    '  function _0x1243ae(payload = {}) {',
    '    return payload;',
    '  }',
    '  return {',
    '    recordRunEvent: _0x1243ae,',
    '    getPersistenceError: () => store.getError?.() || "",',
    '    subscribe(handler) {',
    '      return handler;',
    '    },',
    '  };',
    '}',
  ].join('\n');

  const strict = extractMethodSignatures(source);
  (assert.equal(strict.has('subscribe'), true, '方法简写属严格集'),
    assert.equal(strict.has('recordRunEvent'), false, '别名不进严格集'),
    assert.equal(strict.has('getPersistenceError'), false, '箭头属性不进严格集'));

  const aliases = extractAliasSignatures(source);
  (assert.equal(aliases.has('recordRunEvent'), true, '别名要能识别'),
    assert.equal(aliases.get('recordRunEvent').length, 1, '形参从目标函数继承'),
    assert.equal(aliases.has('getPersistenceError'), true, '箭头属性要能识别'),
    assert.equal(aliases.has('subscribe'), false, '严格集里已有的不重复计入别名'));
});

test('check-port-parity: 配置回调计入缺口（已试过排除，代价太大）', () => {
  // `SelectionController.resolveRect` 是传给 createNodeSpatialIndex 的配置回调，
  // 严格说不是 API。曾加过"调用实参里的对象字面量不计数"的过滤器，结果连
  // `clearFieldReveal`/`placeAt`/`upsert`/`refreshMenu` 四个真实缺口一起藏掉了
  // —— 它们本身就是以注入回调的形式存在的。漏报比多报危险，因此保留。
  const source = [
    'function resolve(nodes) {',
    '  return createNodeSpatialIndex(nodes, {',
    '    resolveRect(node) {',
    '      return node;',
    '    },',
    '  });',
    '}',
  ].join('\n');
  assert.equal(
    extractMethodNames(source).has('resolveRect'),
    true,
    '已知假阳性，靠基线的 equivalent 段记录'
  );
});

test('check-port-parity: 上游明显更大时标记 sizeDrift', () => {
  // 方法名集合能对上、但上游多出几百行，说明整块功能没移植。
  const padding = new Array(200).fill('  const unused = 1;').join('\n');
  const mirror = makeTree({
    'src/big.js': `class Big {\n  _one() {}\n  _two() {}\n${padding}\n}\n`,
  });
  const repo = makeTree({ 'src/big.js': 'class Big {\n  _one() {}\n}\n' });
  const report = comparePortParity(mirror, repo);
  const drift = report.sizeDrift.find((row) => row.file === 'src/big.js');
  (assert.ok(drift, '应检出规模差'),
    assert.equal(drift.upstreamLines > drift.repoLines, true),
    assert.equal(drift.ratio > 1.3, true, '比值要超过阈值'));
});

test('check-port-parity: 同名方法形参变少时标记 signatureDrift', () => {
  // SourceImageNode._maybeResumeRunningHubTask 丢了 resumePaused 参数：方法名齐全，
  // 断点续跑语义却没了，方法名集合比对完全看不出来。
  const mirror = makeTree({ 'src/a.js': 'class A {\n  _resume(options = {}) {}\n}\n' });
  const repo = makeTree({ 'src/a.js': 'class A {\n  _resume() {}\n}\n' });
  const report = comparePortParity(mirror, repo);
  assert.deepEqual(report.rows, [], '方法名在，不该报缺失');
  const drift = report.signatureDrift.find((row) => row.name === '_resume');
  (assert.ok(drift, '应检出形参变少'),
    assert.equal(drift.upstreamArity, 1),
    assert.equal(drift.repoArity, 0));
});

test('check-port-parity: 仓库用别名属性实现时不算缺口', () => {
  // 匹配用严格集∪别名集：把 API 写成箭头属性也是实现了它。
  const mirror = makeTree({
    'src/a.js': [
      'function build() {',
      '  function _0ximpl() {}',
      '  return { recordRunEvent: _0ximpl };',
      '}',
    ].join('\n'),
  });
  const repo = makeTree({
    'src/a.js': ['function build() {', '  return { recordRunEvent() {} };', '}'].join('\n'),
  });
  const report = comparePortParity(mirror, repo);
  (assert.deepEqual(report.rows, [], '不报缺失'),
    assert.deepEqual(report.aliasRows, [], '也不报别名缺口'));
});
