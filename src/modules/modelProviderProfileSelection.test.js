import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MODEL_PROVIDER_PROFILE_MEMORY_KEY,
  getModelProviderProfileMemoryKey,
  getModelProviderProfileIds,
  normalizeModelProviderProfileId,
  resolveModelGenerationProviderProfileId,
  resolveReadyModelProviderProfileId,
  sanitizeModelProviderProfileMemory,
  resolveModelProviderProfileId,
  buildModelProviderProfileSelectionPatch,
  getNextModelProviderProfileId,
} from './modelProviderProfileSelection.js';

// 本仓真实注册表里可用的两个 id：workflow 版带站点 profile 列表，modelApi 版不带。
const WF = 'runninghub/2050306122774532097';
const MODEL_API = 'runninghub-model/rhart-image-v1';
const SITE = ['runninghub', 'runninghub-international'];

test('记忆键名常量与模块零副作用导入', () => {
  assert.equal(MODEL_PROVIDER_PROFILE_MEMORY_KEY, 'providerProfileIdByModel');
});

test('getModelProviderProfileMemoryKey：字符串 id 只 trim，未知 id 原样作为键', () => {
  assert.equal(getModelProviderProfileMemoryKey(`  ${WF}  `), WF);
  assert.equal(getModelProviderProfileMemoryKey('not-a-real-model'), 'not-a-real-model');
  assert.equal(getModelProviderProfileMemoryKey(''), '');
  assert.equal(getModelProviderProfileMemoryKey(), '');
  assert.equal(getModelProviderProfileMemoryKey(null), '');
});

test('getModelProviderProfileMemoryKey：manifest 对象走 modelId；缺 modelId 时被 String 折成 [object Object]', () => {
  assert.equal(getModelProviderProfileMemoryKey({ modelId: ' x ' }), 'x');
  assert.equal(getModelProviderProfileMemoryKey({ provider: 'runninghubwf' }), '[object Object]');
  assert.equal(getModelProviderProfileMemoryKey({}), '[object Object]');
  assert.equal(getModelProviderProfileMemoryKey([]), '');
});

test('getModelProviderProfileIds：优先 extensions.providerProfiles，去重、trim、丢空', () => {
  assert.deepEqual(
    getModelProviderProfileIds({
      modelId: 'm',
      extensions: { providerProfiles: [' b ', 'a', '', null, 'a', 0] },
    }),
    ['b', 'a'],
  );
  assert.deepEqual(getModelProviderProfileIds({ modelId: 'm', extensions: {} }), []);
  assert.deepEqual(getModelProviderProfileIds({ modelId: 'm', extensions: { providerProfiles: 'x' } }), []);
});

test('getModelProviderProfileIds：provider=runninghubwf 且 adapterType=workflow 才回落到两个站点 profile', () => {
  assert.deepEqual(getModelProviderProfileIds(WF), SITE);
  assert.deepEqual(getModelProviderProfileIds({ provider: 'runninghubwf', adapterType: 'workflow' }), SITE);
  assert.deepEqual(getModelProviderProfileIds({ provider: 'runninghubwf', adapterType: 'modelApi' }), []);
  assert.deepEqual(getModelProviderProfileIds({ provider: 'runninghub', adapterType: 'workflow' }), []);
  assert.deepEqual(getModelProviderProfileIds(MODEL_API), []);
  assert.deepEqual(getModelProviderProfileIds('not-a-real-model'), []);
});

test('normalizeModelProviderProfileId：无 profile 列表返回空串；命中返回 trim 后的入参', () => {
  assert.equal(normalizeModelProviderProfileId(MODEL_API, 'runninghub'), '');
  assert.equal(normalizeModelProviderProfileId('not-a-real-model', 'x'), '');
  assert.equal(normalizeModelProviderProfileId(WF, `  ${SITE[1]}  `), SITE[1]);
});

test('normalizeModelProviderProfileId：未命中取第一项；本仓 runninghubwf 配置无 providerProfileId 故不生效', () => {
  assert.equal(normalizeModelProviderProfileId(WF, 'bogus'), SITE[0]);
  assert.equal(normalizeModelProviderProfileId(WF), SITE[0]);
  assert.equal(normalizeModelProviderProfileId(WF, ''), SITE[0]);
});

test('resolveModelGenerationProviderProfileId：provider=runninghub 时改走模型 API 归一（假值折叠国内）', () => {
  assert.equal(resolveModelGenerationProviderProfileId(MODEL_API, 'ignored', SITE[1]), SITE[1]);
  assert.equal(
    resolveModelGenerationProviderProfileId(MODEL_API, 'ignored', '  RUNNINGHUB-INTERNATIONAL '),
    SITE[1],
  );
  assert.equal(resolveModelGenerationProviderProfileId(MODEL_API, 'ignored', 'bogus'), SITE[0]);
  assert.equal(resolveModelGenerationProviderProfileId(MODEL_API, 'ignored'), SITE[0]);
});

test('resolveModelGenerationProviderProfileId：workflow 取 profile 列表归一结果', () => {
  assert.equal(resolveModelGenerationProviderProfileId(WF, 'ignored', SITE[1]), SITE[1]);
  assert.equal(resolveModelGenerationProviderProfileId(WF, 'ignored', 'bogus'), SITE[0]);
});

test('resolveModelGenerationProviderProfileId：显式 provider 参数只在 id 无法解析 manifest 时生效，并做小写化', () => {
  assert.equal(resolveModelGenerationProviderProfileId('not-a-real-model', 'OpenAI', 'x'), '');
  assert.equal(resolveModelGenerationProviderProfileId('not-a-real-model', 'RunningHub', 'bogus'), SITE[0]);
  assert.equal(resolveModelGenerationProviderProfileId('not-a-real-model', 'runninghub', ''), SITE[0]);
  assert.equal(resolveModelGenerationProviderProfileId('not-a-real-model', 'runninghubwf', ''), '');
});

test('resolveReadyModelProviderProfileId：谓词非函数直接返回归一值；谓词非 false 即保留首选', () => {
  assert.equal(resolveReadyModelProviderProfileId(WF, 'bogus', null), SITE[0]);
  assert.equal(
    resolveReadyModelProviderProfileId(MODEL_API, SITE[1], () => true),
    '',
  );
  assert.equal(
    resolveReadyModelProviderProfileId(WF, SITE[1], (id) => (id === SITE[1] ? undefined : false)),
    SITE[1],
  );
});

test('resolveReadyModelProviderProfileId：谓词对首选返回 false 时顺延到下一个 true，全无 true 回落首选', () => {
  assert.equal(
    resolveReadyModelProviderProfileId(WF, '', (id) => id === SITE[1]),
    SITE[1],
  );
  assert.equal(
    resolveReadyModelProviderProfileId(WF, '', () => false),
    SITE[0],
  );
  assert.equal(
    resolveReadyModelProviderProfileId(WF, '', () => true),
    SITE[0],
  );
});

test('sanitizeModelProviderProfileMemory：非纯对象返回空对象，无 profile 列表的键被丢弃', () => {
  for (const bad of [undefined, null, 'x', 1, [SITE[0]]]) {
    assert.deepEqual(sanitizeModelProviderProfileMemory(bad), {});
  }
  assert.deepEqual(
    sanitizeModelProviderProfileMemory({ [WF]: SITE[1], [MODEL_API]: SITE[1], 'not-a-real-model': 'x' }),
    { [WF]: SITE[1] },
  );
});

test('sanitizeModelProviderProfileMemory：未命中值折叠为首项，空入参得空对象', () => {
  assert.deepEqual(sanitizeModelProviderProfileMemory({ [WF]: 'bogus' }), { [WF]: SITE[0] });
  assert.deepEqual(sanitizeModelProviderProfileMemory({}), {});
});

test('resolveModelProviderProfileId：无键返回空串，当前模型优先读正文 providerProfileId', () => {
  assert.equal(resolveModelProviderProfileId({}), '');
  assert.equal(resolveModelProviderProfileId({ model: '' }), '');
  assert.equal(resolveModelProviderProfileId({ model: WF, providerProfileId: SITE[1] }), SITE[1]);
  assert.equal(resolveModelProviderProfileId({ model: WF, providerProfileId: 'bogus' }), SITE[0]);
});

test('resolveModelProviderProfileId：查询非当前模型时只读记忆桶，忽略正文', () => {
  const state = { model: MODEL_API, providerProfileId: SITE[1] };
  assert.equal(resolveModelProviderProfileId(state, MODEL_API), '');
  state[MODEL_PROVIDER_PROFILE_MEMORY_KEY] = { [WF]: SITE[1] };
  assert.equal(resolveModelProviderProfileId(state, WF), SITE[1]);
  assert.equal(resolveModelProviderProfileId(state, `${WF}  `), SITE[1]);
  assert.equal(resolveModelProviderProfileId(state, 'not-a-real-model'), '');
});

test('buildModelProviderProfileSelectionPatch：目标无 profile 时清空正文并回写记忆桶', () => {
  const state = { model: WF, providerProfileId: SITE[1], [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: {} };
  const r = buildModelProviderProfileSelectionPatch(state, MODEL_API);
  assert.deepEqual(r, {
    providerProfileId: '',
    rhProviderProfileId: '',
    [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: { [WF]: SITE[1] },
  });
});

test('buildModelProviderProfileSelectionPatch：空目标 id 同样清空正文', () => {
  const r = buildModelProviderProfileSelectionPatch({}, '   ');
  assert.deepEqual(r, {
    providerProfileId: '',
    rhProviderProfileId: '',
    [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: {},
  });
});

test('buildModelProviderProfileSelectionPatch：切到 workflow 模型时记忆命中优先于正文', () => {
  const state = {
    model: MODEL_API,
    providerProfileId: SITE[0],
    [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: { [WF]: SITE[1] },
  };
  const r = buildModelProviderProfileSelectionPatch(state, WF);
  assert.equal(r.providerProfileId, SITE[1]);
  assert.equal(r.rhProviderProfileId, '');
  assert.equal(r[MODEL_PROVIDER_PROFILE_MEMORY_KEY][WF], SITE[1]);
});

test('buildModelProviderProfileSelectionPatch：同模型切换且无记忆时沿用正文，显式第三参数覆盖一切', () => {
  const same = buildModelProviderProfileSelectionPatch({ model: WF, providerProfileId: SITE[1] });
  assert.equal(same.providerProfileId, SITE[1]);
  const r = buildModelProviderProfileSelectionPatch(
    { model: WF, providerProfileId: SITE[1], [MODEL_PROVIDER_PROFILE_MEMORY_KEY]: { [WF]: SITE[1] } },
    WF,
    '  bogus  ',
  );
  assert.equal(r.providerProfileId, SITE[0]);
  assert.equal(r[MODEL_PROVIDER_PROFILE_MEMORY_KEY][WF], SITE[0]);
});

test('buildModelProviderProfileSelectionPatch：null 与空串第三参数不算显式选择', () => {
  const state = { model: WF, providerProfileId: SITE[1] };
  assert.equal(buildModelProviderProfileSelectionPatch(state, WF, null).providerProfileId, SITE[1]);
  assert.equal(buildModelProviderProfileSelectionPatch(state, WF, '   ').providerProfileId, SITE[1]);
  assert.equal(buildModelProviderProfileSelectionPatch(state, WF, undefined).providerProfileId, SITE[1]);
});

test('getNextModelProviderProfileId：不足两项返回首项或空串，两项时循环切换', () => {
  assert.equal(getNextModelProviderProfileId({ model: MODEL_API }), '');
  assert.equal(getNextModelProviderProfileId({}), '');
  assert.equal(getNextModelProviderProfileId({ model: WF }), SITE[1]);
  assert.equal(getNextModelProviderProfileId({ model: WF, providerProfileId: SITE[1] }), SITE[0]);
  assert.equal(getNextModelProviderProfileId({ model: WF, providerProfileId: 'bogus' }), SITE[1]);
});
