import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyVideoAdaptiveAspectRatio,
  findVideoAspectRatioField,
  getConcreteVideoAspectRatioOptions,
  resolveVideoAdaptiveAspectRatio,
  resolveVideoAspectRatioInput,
} from './videoAspectRatioExecution.js';

function createManifest(overrides = {}) {
  return {
    uiSchema: {
      fields: [
        { id: 'prompt', displayRole: 'prompt' },
        {
          id: 'ratio',
          displayRole: 'aspectRatio',
          defaultValue: '自适应',
          options: [{ value: '1:1' }, { value: ' 16:9 ' }, { value: '自适应' }, { value: '' }, {}],
        },
      ],
    },
    ...overrides,
  };
}

test('videoAspectRatioExecution: 比例字段按 displayRole 优先、再按 id 查找', () => {
  const byRole = findVideoAspectRatioField(createManifest());
  assert.equal(byRole.id, 'ratio');
  const byId = findVideoAspectRatioField({ uiSchema: { fields: [{ id: 'aspectRatio', options: [] }] } });
  assert.equal(byId.id, 'aspectRatio');
  assert.equal(findVideoAspectRatioField({}), null);
  assert.equal(findVideoAspectRatioField({ uiSchema: { fields: 'nope' } }), null);
  assert.equal(findVideoAspectRatioField(null), null);
});

test('videoAspectRatioExecution: 具体比例只保留带冒号且非自适应的选项', () => {
  assert.deepEqual(getConcreteVideoAspectRatioOptions(createManifest()), ['1:1', '16:9']);
  assert.deepEqual(getConcreteVideoAspectRatioOptions({}), []);
  assert.deepEqual(
    getConcreteVideoAspectRatioOptions({
      uiSchema: { fields: [{ displayRole: 'aspectRatio', options: [{ value: 'auto' }, { value: '4:3' }] }] },
    }),
    ['4:3'],
  );
});

test('videoAspectRatioExecution: 取值优先级是专属字段 → generationParams → 节点数据 → payload → 默认值', () => {
  const manifest = createManifest();
  assert.equal(resolveVideoAspectRatioInput({ modelManifest: manifest }), '自适应', '兜底到默认值');

  const fromNodeParams = resolveVideoAspectRatioInput({
    modelManifest: manifest,
    nodeData: { generationParams: { ratio: '3:2', aspectRatio: '9:16' } },
  });
  assert.equal(fromNodeParams, '3:2', '专属字段优先于通用 aspectRatio');

  const fromGeneric = resolveVideoAspectRatioInput({
    modelManifest: manifest,
    nodeData: { generationParams: { aspectRatio: '9:16' } },
  });
  assert.equal(fromGeneric, '9:16');

  const fromNode = resolveVideoAspectRatioInput({ modelManifest: manifest, nodeData: { aspectRatio: '4:5' } });
  assert.equal(fromNode, '4:5');

  const fromPayloadParams = resolveVideoAspectRatioInput({
    modelManifest: manifest,
    payload: { generationParams: { aspectRatio: '21:9' } },
  });
  assert.equal(fromPayloadParams, '21:9');

  const fromPayload = resolveVideoAspectRatioInput({ modelManifest: manifest, payload: { aspectRatio: '2:1' } });
  assert.equal(fromPayload, '2:1');

  const explicitNull = resolveVideoAspectRatioInput({
    modelManifest: manifest,
    nodeData: { generationParams: { aspectRatio: null } },
  });
  assert.equal(explicitNull, null, '显式给了键就返回它的值，哪怕是 null');
  assert.equal(resolveVideoAspectRatioInput({ modelManifest: { uiSchema: { fields: [] } } }), '');
});

test('videoAspectRatioExecution: 自适应解析在没有具体比例时给空串', () => {
  assert.equal(resolveVideoAdaptiveAspectRatio({ modelManifest: {} }), '');
  assert.equal(
    resolveVideoAdaptiveAspectRatio({
      modelManifest: { uiSchema: { fields: [{ displayRole: 'aspectRatio', options: [{ value: '自适应' }] }] } },
    }),
    '',
    '只有自适应选项时没有可回落的比例',
  );
});

test('videoAspectRatioExecution: 没有尺寸信息时优先 1:1，否则取第一个具体比例', () => {
  assert.equal(resolveVideoAdaptiveAspectRatio({ modelManifest: createManifest() }), '1:1');
  const noSquare = {
    uiSchema: { fields: [{ displayRole: 'aspectRatio', options: [{ value: '16:9' }, { value: '4:3' }] }] },
  };
  assert.equal(resolveVideoAdaptiveAspectRatio({ modelManifest: noSquare }), '16:9');
});

test('videoAspectRatioExecution: 有尺寸信息时交给比例选择器，结果非空', () => {
  const withDisplay = resolveVideoAdaptiveAspectRatio({
    modelManifest: createManifest(),
    provider: 'apimart',
    model: 'kling-video-o1',
    displayWidth: 1920,
    displayHeight: 1080,
  });
  assert.equal(typeof withDisplay, 'string');
  assert.ok(withDisplay.length > 0);

  const withSource = resolveVideoAdaptiveAspectRatio({
    modelManifest: createManifest(),
    provider: 'apimart',
    model: 'kling-video-o1',
    sourceWidth: 0,
    sourceHeight: 1080,
  });
  assert.equal(withSource, '1:1', '只有一个方向的尺寸不算有效尺寸，回落到 1:1');
});

test('videoAspectRatioExecution: 没有比例字段时原样返回载荷', () => {
  const payload = { aspectRatio: '自适应' };
  assert.equal(applyVideoAdaptiveAspectRatio(payload, { modelManifest: { uiSchema: { fields: [] } } }), payload);
  assert.equal(applyVideoAdaptiveAspectRatio(payload, {}), payload);
});

test('videoAspectRatioExecution: 提交时保留自适应标签的模式只写标签不落具体比例', () => {
  const manifest = createManifest({ extensions: { ratioPolicy: { preserveAdaptiveAtSubmit: true } } });
  const payload = { resolvedRatioLabel: '旧的', generationParams: { seed: 1 } };
  const result = applyVideoAdaptiveAspectRatio(payload, {
    modelManifest: manifest,
    nodeData: { generationParams: { aspectRatio: '自适应' } },
  });
  assert.equal(result, payload, '就地改写并返回同一个对象');
  assert.equal(result.aspectRatio, '自适应');
  assert.equal(result.ratio, '自适应', '专属字段 id 也要写上');
  assert.equal(Object.hasOwn(result, 'resolvedRatioLabel'), false, '这种模式下清掉已解析标签');
  assert.deepEqual(result.generationParams, { seed: 1, aspectRatio: '自适应', ratio: '自适应' });
});

test('videoAspectRatioExecution: 默认模式把自适应换成具体比例并记下解析结果', () => {
  const manifest = createManifest();
  const payload = { generationParams: { seed: 2 } };
  const result = applyVideoAdaptiveAspectRatio(payload, {
    modelManifest: manifest,
    nodeData: { generationParams: { aspectRatio: '自适应' } },
  });
  assert.equal(result.aspectRatio, '1:1');
  assert.equal(result.ratio, '1:1');
  assert.equal(result.resolvedRatioLabel, '1:1');
  assert.deepEqual(result.generationParams, { seed: 2, aspectRatio: '1:1', ratio: '1:1' });
});

test('videoAspectRatioExecution: 已经是具体比例时不做任何改动', () => {
  const manifest = createManifest();
  const payload = { generationParams: { aspectRatio: '16:9' } };
  const result = applyVideoAdaptiveAspectRatio(payload, {
    modelManifest: manifest,
    nodeData: { generationParams: { aspectRatio: '16:9' } },
  });
  assert.equal(result, payload);
  assert.equal(Object.hasOwn(result, 'resolvedRatioLabel'), false);
  assert.deepEqual(result.generationParams, { aspectRatio: '16:9' });
});

test('videoAspectRatioExecution: 自适应但解析不出具体比例时也保持原样', () => {
  const manifest = {
    uiSchema: {
      fields: [{ id: 'aspectRatio', displayRole: 'aspectRatio', options: [{ value: '自适应' }] }],
    },
  };
  const payload = { generationParams: { aspectRatio: '自适应' } };
  const result = applyVideoAdaptiveAspectRatio(payload, {
    modelManifest: manifest,
    nodeData: { generationParams: { aspectRatio: '自适应' } },
  });
  assert.deepEqual(result, { generationParams: { aspectRatio: '自适应' } });
});
