import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAgentModelRequestParams } from './agentModelRequestParams.js';

test('缺省与空态：不传参、空对象、无 generationParams 都得到空对象', () => {
  assert.deepEqual(buildAgentModelRequestParams(), {});
  assert.deepEqual(buildAgentModelRequestParams({}), {});
  assert.deepEqual(buildAgentModelRequestParams({ model: 'gpt' }), {});
  assert.deepEqual(buildAgentModelRequestParams({ generationParams: {} }), {});
});

test('入参为 null 时靠可选链兜住，既不抛错也不产出参数', () => {
  assert.deepEqual(buildAgentModelRequestParams(null), {});
});

test('generationParams 非纯对象时一律视作无参数（数组、字符串、数字、布尔、函数）', () => {
  for (const value of [[{ size: 1 }], '1024', 7, true, () => 1, new Map()]) {
    assert.deepEqual(buildAgentModelRequestParams({ generationParams: value }), {});
  }
});

test('核心语义：清洗后为空 ⇒ 整个 generationParams 键都不上送', () => {
  const r = buildAgentModelRequestParams({
    generationParams: { drop1: null, drop2: undefined, drop3: {}, drop4: [], size: NaN },
  });
  assert.deepEqual(r, {});
  assert.equal('generationParams' in r, false);
});

test('合格参数被包成单键请求体，且键序沿用入参顺序', () => {
  const r = buildAgentModelRequestParams({
    generationParams: { z: 1, a: 'x', m: false },
  });
  assert.deepEqual(Object.keys(r), ['generationParams']);
  assert.deepEqual(Object.keys(r.generationParams), ['z', 'a', 'm']);
});

test('键与字符串值都被 trim，值类型不做字符串化', () => {
  const r = buildAgentModelRequestParams({
    generationParams: { '  temperature  ': '  0.7  ', quality: 3 },
  });
  assert.deepEqual(r.generationParams, { temperature: '0.7', quality: 3 });
  assert.equal(typeof r.generationParams.quality, 'number');
});

test('非有限数字被剔除，其余数字与 0、负数保留', () => {
  const r = buildAgentModelRequestParams({
    generationParams: { nan: NaN, inf: Infinity, ninf: -Infinity, seed: 0, ratio: -1.5 },
  });
  assert.deepEqual(r.generationParams, { seed: 0, ratio: -1.5 });
});

test('原型污染三键被剔除且不影响其它合格参数', () => {
  const r = buildAgentModelRequestParams({
    generationParams: { ['__proto__']: { p: 1 }, ['constructor']: 'c', ['prototype']: 'p', size: '1024' },
  });
  assert.deepEqual(r, { generationParams: { size: '1024' } });
  assert.equal({}.p, undefined);
});

test('清洗后全为污染键时退化成不上送', () => {
  assert.deepEqual(
    buildAgentModelRequestParams({ generationParams: { ['__proto__']: 1, ['prototype']: 2 } }),
    {},
  );
});

test('布尔 false 与空串都是合格值，会让参数照常上送', () => {
  assert.deepEqual(buildAgentModelRequestParams({ generationParams: { stream: false } }), {
    generationParams: { stream: false },
  });
  assert.deepEqual(buildAgentModelRequestParams({ generationParams: { style: '' } }), {
    generationParams: { style: '' },
  });
  assert.deepEqual(buildAgentModelRequestParams({ generationParams: { negative: '   ' } }), {
    generationParams: { negative: '' },
  });
});

test('只透传 generationParams 一个字段，model 与其余状态字段一概不进请求体', () => {
  const r = buildAgentModelRequestParams({
    model: 'gpt-x',
    provider: 'dash',
    prompt: 'hello',
    generationParamsByModel: { 'gpt-x': { size: 1 } },
    generationParams: { size: 2 },
  });
  assert.deepEqual(r, { generationParams: { size: 2 } });
  assert.deepEqual(Object.keys(r), ['generationParams']);
});

test('返回的是新对象：不改写入参，也不复用入参的 generationParams 引用', () => {
  const params = { ' a ': '  x  ', bad: null };
  const state = { model: 'm', generationParams: params };
  const r = buildAgentModelRequestParams(state);
  assert.notEqual(r.generationParams, params);
  assert.deepEqual(params, { ' a ': '  x  ', bad: null });
  assert.deepEqual(state, { model: 'm', generationParams: params });
  r.generationParams.extra = 1;
  assert.equal(params.extra, undefined);
});
