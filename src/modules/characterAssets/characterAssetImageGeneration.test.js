import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelProvider, sanitizeModelUiSchemaParams } from '../../manifests/index.js';
import {
  buildCharacterAssetImageGenerationPayload,
  normalizeCharacterAssetImageGenerationParams,
} from './characterAssetImageGeneration.js';

const MODEL = 'apimart/nano-banana-2';

test('characterAssetImageGeneration: 净化参数时带入模型默认值', () => {
  const params = normalizeCharacterAssetImageGenerationParams(MODEL, {});
  assert.deepEqual(params, sanitizeModelUiSchemaParams(MODEL, {}, { includeDefaults: true }));
  assert.equal(params.imageSize, '2K');
  assert.equal(params.aspectRatio, '自适应');
});

test('characterAssetImageGeneration: batchSize 会被强制回 1，绕过模型默认值', () => {
  assert.equal(sanitizeModelUiSchemaParams(MODEL, { batchSize: 4 }, { includeDefaults: true }).batchSize, 4);
  const forced = normalizeCharacterAssetImageGenerationParams(MODEL, { batchSize: 4 });
  assert.equal(forced.batchSize, 1);
  assert.equal(forced.imageSize, '2K', '其它字段仍按模型默认值带入');
});

test('characterAssetImageGeneration: 模型没有界面参数时净化结果为空对象', () => {
  assert.deepEqual(normalizeCharacterAssetImageGenerationParams('', {}), {});
  assert.deepEqual(normalizeCharacterAssetImageGenerationParams(), {});
  assert.deepEqual(buildCharacterAssetImageGenerationPayload({}).generationParams, {});
});

test('characterAssetImageGeneration: 载荷里的模型名与提示词去空白，厂商按模型解析', () => {
  const payload = buildCharacterAssetImageGenerationPayload({
    modelId: ' apimart/nano-banana-2 ',
    prompt: '  人物形象  ',
  });
  assert.equal(payload.model, MODEL);
  assert.equal(payload.provider, resolveModelProvider(MODEL, ''));
  assert.equal(payload.provider, 'apimart');
  assert.equal(payload.prompt, '人物形象');
});

test('characterAssetImageGeneration: 显式厂商优先于模型推断', () => {
  const payload = buildCharacterAssetImageGenerationPayload({ modelId: MODEL, provider: 'grsai' });
  assert.equal(payload.provider, 'grsai');
});

test('characterAssetImageGeneration: 参考图去空白、去重、去空项', () => {
  const payload = buildCharacterAssetImageGenerationPayload({
    modelId: MODEL,
    referenceImageUrls: [' http://a/1.png ', '', 'http://a/1.png', '  ', 'http://a/2.png'],
  });
  assert.deepEqual(payload.inputUrls, ['http://a/1.png', 'http://a/2.png']);
  assert.deepEqual(buildCharacterAssetImageGenerationPayload({ modelId: MODEL }).inputUrls, []);
  assert.deepEqual(
    buildCharacterAssetImageGenerationPayload({ modelId: MODEL, referenceImageUrls: 'nope' }).inputUrls,
    [],
  );
});

test('characterAssetImageGeneration: providerProfileId 只有非空时才出现', () => {
  const withProfile = buildCharacterAssetImageGenerationPayload({ modelId: MODEL, providerProfileId: ' p1 ' });
  assert.equal(withProfile.providerProfileId, 'p1');
  assert.equal(Object.hasOwn(withProfile, 'providerProfileId'), true);

  const withoutProfile = buildCharacterAssetImageGenerationPayload({ modelId: MODEL, providerProfileId: '   ' });
  assert.equal(Object.hasOwn(withoutProfile, 'providerProfileId'), false);
});

test('characterAssetImageGeneration: 比例与尺寸取自净化结果，缺省回落到 1:1 与 2K', () => {
  const fromModel = buildCharacterAssetImageGenerationPayload({ modelId: MODEL });
  assert.equal(fromModel.aspectRatio, '自适应');
  assert.equal(fromModel.imageSize, '2K');

  const unknown = buildCharacterAssetImageGenerationPayload({ modelId: '' });
  assert.equal(unknown.aspectRatio, '1:1');
  assert.equal(unknown.imageSize, '2K');
  assert.equal(unknown.batchSize, 1);
});

test('characterAssetImageGeneration: batchSize 恒为 1，不受入参影响', () => {
  const payload = buildCharacterAssetImageGenerationPayload({ modelId: MODEL, generationParams: { batchSize: 4 } });
  assert.equal(payload.batchSize, 1);
  assert.equal(payload.generationParams.batchSize, 1);
});
