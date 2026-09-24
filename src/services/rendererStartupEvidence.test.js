import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectRendererStartupEvidence } from './rendererStartupEvidence.js';

const ENV = {
  location: { href: 'http://127.0.0.1:8000/index.html' },
  document: { readyState: 'interactive' },
};
const env = (over = {}) => ({ ...ENV, ...over });

test('SCRIPT target 短路一切消息判据，归类 script-load', () => {
  const out = collectRendererStartupEvidence(
    {
      target: { tagName: 'SCRIPT', src: 'http://127.0.0.1:8000/src/a.js' },
      message: 'Failed to fetch dynamically imported module: x',
      error: { name: 'TypeError' },
    },
    env(),
  );
  assert.equal(out.category, 'script-load');
  assert.equal(out.source, '/src/a.js');
  assert.equal(out.documentState, 'interactive');
});

test('消息分类优先级：fetch > export > opaque > error.name > runtime-error', () => {
  const c = (event, e = env()) => collectRendererStartupEvidence(event, e).category;
  assert.equal(c({ message: 'Failed to fetch dynamically imported module: /src/a.js' }), 'module-fetch');
  assert.equal(c({ message: 'Importing a module script failed.' }), 'module-fetch');
  assert.equal(c({ message: "does not provide an export named 'foo'" }), 'module-export');
  assert.equal(c({ message: 'the requested module /src/a.js does export nothing' }), 'module-export');
  assert.equal(c({ message: 'Script error.' }), 'opaque-script-error');
  assert.equal(
    c({ message: 'Script error. ', error: { name: 'TypeError' } }),
    'TypeError',
    '尾部多一空格即不等值命中，落到 error.name 分支',
  );
  for (const name of ['SyntaxError', 'ReferenceError', 'TypeError', 'RangeError'])
    assert.equal(c({ message: 'whatever', error: { name } }), name);
  assert.equal(c({ message: 'x', error: { name: 'EvalError' } }), 'runtime-error');
  assert.equal(c({}), 'runtime-error');
});

test('source 走同源 + 白名单路径，其它一律空串', () => {
  const s = (filename) => collectRendererStartupEvidence({ filename }, env()).source;
  assert.equal(s('main.js'), '/main.js', '相对路径按 location.href 解析');
  assert.equal(s('http://127.0.0.1:8000/src/deep/a-b_1.c2.min.js'), '/src/deep/a-b_1.c2.min.js');
  assert.equal(s('/api/x.mjs'), '/api/x.mjs');
  assert.equal(s('/vendor/pack.js'), '/vendor/pack.js');
  for (const bad of ['/index.js', '/src/a.ts', '/other/a.js', '/src/a.css', 'a.js.map'])
    assert.equal(s(bad), '', bad);
  assert.equal(s('http://evil.example/src/a.js'), '', '跨源直接判空');
  assert.equal(s(undefined), '');
  assert.equal(s('/main.js?v=1#h'), '/main.js', 'query 与 hash 属于 pathname 之外');
});

test('location.href 不可解析时 codePath 全空、documentState 回落 unknown', () => {
  const out = collectRendererStartupEvidence(
    { filename: '/src/a.js', lineno: 3 },
    env({ location: {}, document: undefined }),
  );
  assert.equal(out.source, '');
  assert.equal(out.documentState, 'unknown');
  assert.deepEqual(out.failedScriptRequests, []);
});

test('行列为正安全整数才保留，其余（含字符串与小数）归 0', () => {
  const pick = (lineno, colno) => {
    const out = collectRendererStartupEvidence({ lineno, colno }, env());
    return [out.line, out.column];
  };
  assert.deepEqual(pick(12, 7), [12, 7]);
  for (const bad of [0, -3, 1.5, '12', null, undefined, NaN, Number.MAX_SAFE_INTEGER + 1])
    assert.deepEqual(pick(bad, bad), [0, 0], JSON.stringify(bad) ?? 'undefined');
});

test('长路径被截到 240 字符', () => {
  const long = '/src/' + 'a'.repeat(300) + '.js';
  assert.equal(collectRendererStartupEvidence({ filename: long }, env()).source.length, 240);
});

test('失败脚本请求：仅保留 responseStatus ≥ 400 且路径白名单内者，取末 8 条', () => {
  const mk = (n, status) => ({ name: `/src/f${n}.js`, responseStatus: status });
  const entries = [...Array(11).keys()].map((i) => mk(i, 500));
  entries.push({ name: '/src/ok.js', responseStatus: 200 }, { name: '/other/x.js', responseStatus: 500 });
  const out = collectRendererStartupEvidence({}, env({ performance: { getEntriesByType: () => entries } }));
  assert.equal(out.failedScriptRequests.length, 8);
  assert.deepEqual(out.failedScriptRequests[0], { source: '/src/f3.js', status: 500 });
  assert.deepEqual(out.failedScriptRequests[7], { source: '/src/f10.js', status: 500 });
  assert.ok(!out.failedScriptRequests.some((r) => r.source === '/other/x.js'));
});

test('responseStatus 缺失不算失败；无 performance 与抛错都落回空数组', () => {
  const noStatus = collectRendererStartupEvidence(
    {},
    env({ performance: { getEntriesByType: () => [{ name: '/src/a.js' }] } }),
  );
  assert.deepEqual(noStatus.failedScriptRequests, []);
  assert.deepEqual(collectRendererStartupEvidence({}, env()).failedScriptRequests, []);
  const boom = collectRendererStartupEvidence(
    {},
    env({
      performance: {
        getEntriesByType: () => {
          throw new Error('not allowed');
        },
      },
    }),
  );
  assert.deepEqual(boom.failedScriptRequests, [], '采集异常被吞，返回体仍完整');
});

test('getEntriesByType 非 resource 或返回 null 时按空集处理', () => {
  const seen = [];
  const out = collectRendererStartupEvidence(
    {},
    env({
      performance: {
        getEntriesByType: (type) => {
          seen.push(type);
          return null;
        },
      },
    }),
  );
  assert.deepEqual(seen, ['resource']);
  assert.deepEqual(out.failedScriptRequests, []);
});

test('返回体形状固定七键，documentState 白名单外一律 unknown', () => {
  const out = collectRendererStartupEvidence({}, env({ document: { readyState: 'loaded' } }));
  assert.deepEqual(Object.keys(out).sort(), [
    'category',
    'column',
    'documentState',
    'failedScriptRequests',
    'line',
    'source',
  ]);
  assert.equal(out.documentState, 'unknown');
  assert.throws(() => collectRendererStartupEvidence({}, undefined), TypeError, '环境对象无空值保护');
});
