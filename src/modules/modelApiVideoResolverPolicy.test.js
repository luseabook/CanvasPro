import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveModelExecution } from '../manifests/index.js';
import {
  getHappyHorseModelApiVideoOptions,
  getModelApiVideoBodyResolverName,
  getModelApiVideoExtension,
  getModelApiVideoFamily,
  getModelApiVideoFamilyOptions,
  getModelApiVideoMaxInputVideoSeconds,
  isHappyHorseModelApiVideo,
  isModelApiVideoFamily,
  isSeedance2ModelApiVideo,
  isWan27ModelApiVideo,
  supportsHappyHorseModelApiVideoEdit,
} from './modelApiVideoResolverPolicy.js';

const MODEL = 'apimart/kling-video-o1';
const execution = resolveModelExecution(MODEL);

test('modelApiVideoResolverPolicy: 选定的样例模型确实是 modelApi 视频模型', () => {
  assert.ok(execution, '样例模型必须能在本仓清单里解析出来');
  assert.equal(execution.modelManifest?.kind, 'video');
  assert.equal(execution.modelManifest?.adapterType, 'modelApi');
  assert.equal(execution.executionManifest?.adapterType, 'modelApi');
});

test('modelApiVideoResolverPolicy: 未知模型一律回落空值，不抛错', () => {
  const unknown = 'not-a-real-model-id';
  assert.equal(getModelApiVideoBodyResolverName(unknown), '');
  assert.equal(getModelApiVideoExtension(unknown, '', 'videoFamily'), undefined);
  assert.equal(getModelApiVideoFamily(unknown), '');
  assert.equal(isModelApiVideoFamily(unknown, '', 'seedance2'), false);
  assert.equal(isHappyHorseModelApiVideo(unknown), false);
  assert.equal(isSeedance2ModelApiVideo(unknown), false);
  assert.equal(isWan27ModelApiVideo(unknown), false);
  assert.equal(getModelApiVideoMaxInputVideoSeconds(unknown, '', null), null);
  assert.equal(getModelApiVideoMaxInputVideoSeconds(unknown), null);
  assert.equal(getModelApiVideoMaxInputVideoSeconds(unknown, '', 15), 15);
});

test('modelApiVideoResolverPolicy: bodyResolver 直接读执行清单的扩展', () => {
  const expected = String(execution?.executionManifest?.extensions?.bodyResolver || '').trim();
  assert.equal(getModelApiVideoBodyResolverName(MODEL), expected);
  assert.ok(expected.length > 0, '样例模型带 bodyResolver');
});

test('modelApiVideoResolverPolicy: 扩展查询先查模型清单再查执行清单，空键不查', () => {
  const modelExtensions = execution?.modelManifest?.extensions || {};
  const executionExtensions = execution?.executionManifest?.extensions || {};
  const firstModelKey = Object.keys(modelExtensions)[0];
  const firstExecutionKey = Object.keys(executionExtensions)[0];
  assert.equal(getModelApiVideoExtension(MODEL, '', ''), undefined, '空键直接返回 undefined');
  assert.equal(getModelApiVideoExtension(MODEL, '', '   '), undefined);
  assert.equal(getModelApiVideoExtension(MODEL, '', 'definitelyMissing'), undefined);
  if (firstExecutionKey) {
    assert.deepEqual(getModelApiVideoExtension(MODEL, '', firstExecutionKey), executionExtensions[firstExecutionKey]);
  }
  if (firstModelKey) {
    assert.deepEqual(getModelApiVideoExtension(MODEL, '', firstModelKey), modelExtensions[firstModelKey]);
  }
});

test('modelApiVideoResolverPolicy: family 相关查询按清单里是否存在该扩展决定', () => {
  const family = getModelApiVideoFamily(MODEL);
  assert.equal(typeof family, 'string');
  assert.equal(
    family,
    String(execution?.modelManifest?.extensions?.videoFamily || '').trim(),
    'family 只来自模型清单',
  );
  assert.equal(isModelApiVideoFamily(MODEL, '', family || 'nope'), family !== '');
  assert.deepEqual(getModelApiVideoFamilyOptions(MODEL, '', ''), {}, '空家族返回空对象');
  assert.deepEqual(getModelApiVideoFamilyOptions(MODEL, '', 'mismatch'), {}, '家族不匹配返回空对象');
  assert.equal(Object.isFrozen(getModelApiVideoFamilyOptions(MODEL, '', 'mismatch')), true);
});

test('modelApiVideoResolverPolicy: 家族选项不匹配时给空对象，匹配时才回原对象', () => {
  assert.equal(isModelApiVideoFamily(MODEL, '', ''), false, '空 family 永远为假');
  const empty = getModelApiVideoFamilyOptions(MODEL, '', 'seedance2');
  assert.deepEqual(empty, {}, '本仓清单里没有 seedance2 家族扩展');
  assert.equal(Object.keys(empty).length, 0);
  assert.deepEqual(getHappyHorseModelApiVideoOptions(MODEL, ''), {});
});

test('modelApiVideoResolverPolicy: supportsEdit 只认严格 false 为假', () => {
  const options = getHappyHorseModelApiVideoOptions(MODEL, '');
  if (Object.hasOwn(options, 'supportsEdit')) {
    assert.equal(supportsHappyHorseModelApiVideoEdit(MODEL, ''), options.supportsEdit !== false);
  } else {
    assert.equal(supportsHappyHorseModelApiVideoEdit(MODEL, ''), true, '缺扩展时默认允许编辑');
  }
});

test('modelApiVideoResolverPolicy: 非视频或非 modelApi 模型不参与本策略', () => {
  const imageModel = 'apimart/gpt-image-1';
  const imageExecution = resolveModelExecution(imageModel);
  if (imageExecution && imageExecution.modelManifest?.kind !== 'video') {
    assert.equal(getModelApiVideoBodyResolverName(imageModel), '');
    assert.equal(getModelApiVideoFamily(imageModel), '');
  }
});
