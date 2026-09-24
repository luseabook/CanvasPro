import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeGenerationParams,
  normalizeGenerationParamsByModel,
  buildModelGenerationParamsSelectionPatch,
  buildActiveModelGenerationParamPatch,
} from './modelGenerationParamMemory.js';

test('normalizeGenerationParams：非纯对象入参一律得到空对象', () => {
  for (const value of [null, undefined, 0, '', 'x', true, [], [{ a: 1 }], () => 1, new Map()]) {
    assert.deepEqual(normalizeGenerationParams(value), {}, '入参 ' + String(value) + ' 应视为不可归一');
  }
  assert.deepEqual(normalizeGenerationParams(), {});
});

test('normalizeGenerationParams：键只做 trim，大小写与内部空白原样保留', () => {
  const r = normalizeGenerationParams({ '  temperature  ': 1, Quality: 'high', 'a b': 2 });
  assert.deepEqual(r, { temperature: 1, Quality: 'high', 'a b': 2 });
});

test('normalizeGenerationParams：trim 后为空的键被丢弃', () => {
  assert.deepEqual(normalizeGenerationParams({ '   ': 1, '\t\n': 2, ok: 3 }), { ok: 3 });
});

test('normalizeGenerationParams：三个原型污染键被丢弃且不改动全局原型', () => {
  const r = normalizeGenerationParams({
    ['__proto__']: { polluted: true },
    ['constructor']: 'c',
    ['prototype']: 'p',
    safe: 'k',
  });
  assert.deepEqual(Object.keys(r), ['safe']);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.getPrototypeOf(r), Object.prototype);
});

test('normalizeGenerationParams：仅 string / number / boolean 三类值被保留', () => {
  const r = normalizeGenerationParams({
    s: 'v',
    n: 3,
    b: false,
    nul: null,
    und: undefined,
    obj: {},
    arr: [],
    fn: () => 1,
    big: 10n,
    sym: Symbol('s'),
  });
  assert.deepEqual(r, { s: 'v', n: 3, b: false });
});

test('normalizeGenerationParams：非有限数字被丢弃，其余数字（含 0 与负数）保留', () => {
  const r = normalizeGenerationParams({
    nan: NaN,
    inf: Infinity,
    ninf: -Infinity,
    zero: 0,
    neg: -1.5,
    tiny: Number.MIN_VALUE,
  });
  assert.deepEqual(r, { zero: 0, neg: -1.5, tiny: Number.MIN_VALUE });
});

test('normalizeGenerationParams：字符串值被 trim，trim 成空串仍然写入', () => {
  const r = normalizeGenerationParams({ a: '  x  ', b: '   ', c: '' });
  assert.deepEqual(r, { a: 'x', b: '', c: '' });
});

test('normalizeGenerationParams：数字与布尔不做字符串化，键序按入参插入序', () => {
  const r = normalizeGenerationParams({ z: 1, a: 2, m: 3 });
  assert.deepEqual(Object.keys(r), ['z', 'a', 'm']);
  assert.equal(typeof r.z, 'number');
  assert.equal(typeof normalizeGenerationParams({ f: true }).f, 'boolean');
});

test('normalizeGenerationParams：数字字面量键被字符串化', () => {
  const r = normalizeGenerationParams({ 1: 'a', 2: 'b' });
  assert.deepEqual(r, { 1: 'a', 2: 'b' });
  assert.deepEqual(Object.keys(r), ['1', '2']);
});

test('normalizeGenerationParams：返回新对象且不改写入参', () => {
  const input = { a: '  x  ', ['__proto__']: undefined, bad: null };
  const r = normalizeGenerationParams(input);
  assert.notEqual(r, input);
  assert.equal(input.a, '  x  ');
  assert.equal('bad' in input, true);
  assert.equal('bad' in r, false);
});

test('normalizeGenerationParamsByModel：非纯对象入参得到空对象', () => {
  for (const value of [null, undefined, [], 'x', 3, true]) {
    assert.deepEqual(normalizeGenerationParamsByModel(value), {});
  }
});

test('normalizeGenerationParamsByModel：每个模型桶各自过一遍参数归一', () => {
  const r = normalizeGenerationParamsByModel({
    gpt: { ' temperature ': ' 0.7 ', nan: NaN, drop: null, keep: 1 },
  });
  assert.deepEqual(r, { gpt: { temperature: '0.7', keep: 1 } });
});

test('normalizeGenerationParamsByModel：桶值非对象时保留模型键但桶为空对象', () => {
  const r = normalizeGenerationParamsByModel({ a: null, b: 'x', c: [], d: { k: 1 } });
  assert.deepEqual(r, { a: {}, b: {}, c: {}, d: { k: 1 } });
});

test('normalizeGenerationParamsByModel：模型键 trim、空键与原型污染键整条丢弃', () => {
  const r = normalizeGenerationParamsByModel({
    '  m1  ': { a: 1 },
    '   ': { b: 2 },
    ['__proto__']: { c: 3 },
    ['constructor']: { d: 4 },
    ['prototype']: { e: 5 },
  });
  assert.deepEqual(Object.keys(r), ['m1']);
  assert.equal({}.c, undefined);
});

test('normalizeGenerationParamsByModel：不改写入参的桶对象', () => {
  const bucket = { a: '  x  ', bad: null };
  const r = normalizeGenerationParamsByModel({ m: bucket });
  assert.notEqual(r.m, bucket);
  assert.equal(bucket.a, '  x  ');
  assert.deepEqual(r.m, { a: 'x' });
});

test('切换模型：旧模型的正文参数先落桶，新模型的桶成为新正文', () => {
  const r = buildModelGenerationParamsSelectionPatch(
    {
      model: 'gpt-old',
      generationParams: { temperature: 0.9, drop: null },
      generationParamsByModel: {
        'gpt-old': { temperature: 0.1 },
        'gpt-new': { temperature: 0.5, size: '1024' },
      },
    },
    'gpt-new',
  );
  assert.deepEqual(r, {
    generationParams: { temperature: 0.5, size: '1024' },
    generationParamsByModel: {
      'gpt-old': { temperature: 0.9 },
      'gpt-new': { temperature: 0.5, size: '1024' },
    },
  });
});

test('切换模型：目标模型没有历史桶时正文为空对象（不继承旧模型参数）', () => {
  const r = buildModelGenerationParamsSelectionPatch(
    { model: 'a', generationParams: { temperature: 1 }, generationParamsByModel: {} },
    'b',
  );
  assert.deepEqual(r.generationParams, {});
  assert.deepEqual(r.generationParamsByModel, { a: { temperature: 1 }, b: {} });
});

test('切换模型：正文与桶内同模型条目是同一个对象引用', () => {
  const r = buildModelGenerationParamsSelectionPatch({ generationParamsByModel: { b: { k: '  v  ' } } }, 'b');
  assert.equal(r.generationParams, r.generationParamsByModel.b);
  assert.deepEqual(r.generationParams, { k: 'v' });
});

test('切换模型：目标 id 只做 trim；空目标 id 时正文为空对象但旧模型仍入桶', () => {
  const r = buildModelGenerationParamsSelectionPatch(
    { model: 'a', generationParams: { x: 1 }, generationParamsByModel: {} },
    '   ',
  );
  assert.deepEqual(r, { generationParams: {}, generationParamsByModel: { a: { x: 1 } } });
  const trimmed = buildModelGenerationParamsSelectionPatch(
    { model: '', generationParamsByModel: { '  b ': { k: 1 } } },
    '  b  ',
  );
  assert.deepEqual(trimmed.generationParams, { k: 1 });
});

test('切换模型：当前模型 id 为空时完全不写桶，正文取自目标桶', () => {
  const r = buildModelGenerationParamsSelectionPatch(
    { model: '', generationParams: { ignore: 1 }, generationParamsByModel: { b: { keep: 2 } } },
    'b',
  );
  assert.deepEqual(r, { generationParams: { keep: 2 }, generationParamsByModel: { b: { keep: 2 } } });
  assert.equal('ignore' in r.generationParamsByModel.b, false);
});

test('切换模型：目标模型 id 为原型污染键时不会成为自有键', () => {
  const r = buildModelGenerationParamsSelectionPatch({ model: 'a', generationParams: { x: 1 } }, '__proto__');
  assert.deepEqual(Object.keys(r.generationParamsByModel), ['a']);
  assert.deepEqual(r.generationParams, {});
  assert.equal({}.x, undefined);
  // 赋值走的是原型链：目标桶没写成自有键，而是把返回对象的 [[Prototype]] 换成了新对象
  assert.notEqual(Object.getPrototypeOf(r.generationParamsByModel), Object.prototype);
});

test('切换模型：无入参时得到两个空对象且不改写调用方对象', () => {
  const state = { model: 'a', generationParams: { x: 1 }, generationParamsByModel: { a: { y: 2 } } };
  const r = buildModelGenerationParamsSelectionPatch(state, 'b');
  assert.notEqual(r.generationParamsByModel, state.generationParamsByModel);
  assert.deepEqual(state, {
    model: 'a',
    generationParams: { x: 1 },
    generationParamsByModel: { a: { y: 2 } },
  });
  assert.deepEqual(r, { generationParams: {}, generationParamsByModel: { a: { x: 1 }, b: {} } });
  assert.deepEqual(buildModelGenerationParamsSelectionPatch(), {
    generationParams: {},
    generationParamsByModel: {},
  });
});

test('写入单参数：现有正文先归一再合并，新键覆盖同名旧键', () => {
  const r = buildActiveModelGenerationParamPatch(
    { generationParams: { ' quality ': ' HIGH ', drop: null, nan: NaN, keep: 1 }, model: 'm' },
    'quality',
    ' low ',
  );
  assert.deepEqual(r.generationParams, { quality: 'low', keep: 1 });
});

test('写入单参数：键 trim 后为空或命中原型污染键时返回空补丁', () => {
  assert.deepEqual(buildActiveModelGenerationParamPatch({ generationParams: { a: 1 } }, '  ', 'x'), {});
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    assert.deepEqual(
      buildActiveModelGenerationParamPatch({ model: 'm', generationParams: { a: 1 } }, key, 'x'),
      {},
    );
  }
  assert.deepEqual(buildActiveModelGenerationParamPatch({}, 'k', 'v'), {
    generationParams: { k: 'v' },
    generationParamsByModel: {},
  });
});

test('写入单参数：不支持的值类型直接返回空补丁', () => {
  for (const value of [null, {}, [], () => 1, 1n, Symbol('s')]) {
    assert.deepEqual(buildActiveModelGenerationParamPatch({ model: 'm' }, 'k', value), {});
  }
});

test('写入单参数：值缺省（undefined）被默认参数吞成空串并照常落补丁', () => {
  assert.deepEqual(buildActiveModelGenerationParamPatch({ model: 'm' }, 'k'), {
    generationParams: { k: '' },
    generationParamsByModel: { m: { k: '' } },
  });
});

test('写入单参数：假值键（数字 0）被 String(0||“”) 吞成空串 ⇒ 整条补丁为空', () => {
  assert.deepEqual(
    buildActiveModelGenerationParamPatch({ model: 'm', generationParams: { a: 1 } }, 0, 'v'),
    {},
  );
});

test('写入单参数：非有限数字作为值被原样写入（与 normalize 的丢弃口径不一致）', () => {
  const r = buildActiveModelGenerationParamPatch({ generationParams: { a: 1 } }, 'nan', NaN);
  assert.equal(Object.is(r.generationParams.nan, NaN), true);
  const inf = buildActiveModelGenerationParamPatch({}, 'inf', Infinity);
  assert.equal(inf.generationParams.inf, Infinity);
});

test('写入单参数：0、false、空串三种合法假值都能写入且不做字符串化', () => {
  const r = buildActiveModelGenerationParamPatch({}, 'a', 0);
  assert.deepEqual(r.generationParams, { a: 0 });
  assert.equal(typeof r.generationParams.a, 'number');
  assert.deepEqual(buildActiveModelGenerationParamPatch({}, 'b', false).generationParams, { b: false });
  assert.deepEqual(buildActiveModelGenerationParamPatch({}, 'c', '   ').generationParams, { c: '' });
});

test('写入单参数：有当前模型时整份正文写入该模型桶，且与返回值同引用', () => {
  const r = buildActiveModelGenerationParamPatch(
    { model: 'm', generationParams: { a: 1 }, generationParamsByModel: { m: { old: 2 }, other: { k: 3 } } },
    'b',
    true,
  );
  assert.equal(r.generationParams, r.generationParamsByModel.m);
  assert.deepEqual(r, {
    generationParams: { a: 1, b: true },
    generationParamsByModel: { m: { a: 1, b: true }, other: { k: 3 } },
  });
});

test('写入单参数：没有当前模型时不落任何桶，正文补丁仍然返回', () => {
  const r = buildActiveModelGenerationParamPatch({ model: '  ', generationParams: { a: 1 } }, 'b', 2);
  assert.deepEqual(r, { generationParams: { a: 1, b: 2 }, generationParamsByModel: {} });
});

test('写入单参数：桶内的原型污染模型键被丢弃，不改写入参', () => {
  const state = {
    model: '__proto__',
    generationParams: { x: 1 },
    generationParamsByModel: { constructor: { y: 2 } },
  };
  const r = buildActiveModelGenerationParamPatch(state, 'k', 'v');
  assert.deepEqual(Object.keys(r.generationParamsByModel), []);
  assert.deepEqual(r.generationParams, { x: 1, k: 'v' });
  assert.deepEqual(state.generationParams, { x: 1 });
  assert.equal({}.y, undefined);
});
