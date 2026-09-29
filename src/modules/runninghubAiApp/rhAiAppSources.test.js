import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SOURCE_TYPES,
  SOURCE_TYPE_KEYS,
  COMFYUI_WORKFLOW_STATE_SCOPE,
  COMFY_UI_WORKFLOW_SHARED_SOURCE_META,
  SOURCE_TYPE_META,
  normalizeSourceType,
  getSourceMeta,
  isComfyUiSource,
  getComfyUiBaseUrlMode,
  getComfyUiSourceTypeFromBaseUrlMode,
  getComfyUiBaseUrlModeLabel,
  isRunningHubSource,
} from './rhAiAppSources.js';

test('SOURCE_TYPES 冻结且 SOURCE_TYPE_KEYS 与其值一一对应', () => {
  assert.equal(Object.isFrozen(SOURCE_TYPES), true);
  assert.deepEqual(SOURCE_TYPE_KEYS, [
    'runninghub-ai-app',
    'runninghub-workflow',
    'comfyui-local-workflow',
    'comfyui-cloud-workflow',
  ]);
  assert.equal(SOURCE_TYPES.runninghub, 'runninghub-ai-app');
  assert.equal(SOURCE_TYPES.comfyuiCloud, 'comfyui-cloud-workflow');
});

test('normalizeSourceType 去空白并拒绝未知取值', () => {
  assert.equal(normalizeSourceType('  runninghub-workflow '), 'runninghub-workflow');
  assert.equal(normalizeSourceType('runninghub-ai-app'), 'runninghub-ai-app');
  assert.equal(normalizeSourceType('nope'), '');
  assert.equal(normalizeSourceType(''), '');
  assert.equal(normalizeSourceType(null), '');
  assert.equal(normalizeSourceType(undefined), '');
  assert.equal(normalizeSourceType('RUNNINGHUB-AI-APP'), '');
});

test('getSourceMeta 按规范化 id 取元数据，未知返回 null', () => {
  assert.equal(getSourceMeta('runninghub-ai-app'), SOURCE_TYPE_META['runninghub-ai-app']);
  assert.equal(getSourceMeta(' comfyui-cloud-workflow '), SOURCE_TYPE_META['comfyui-cloud-workflow']);
  assert.equal(getSourceMeta('unknown'), null);
  assert.equal(getSourceMeta(null), null);
});

test('RunningHub AI 应用元数据带完整文案字段', () => {
  const meta = getSourceMeta(SOURCE_TYPES.runninghub);
  assert.equal(meta.id, 'runninghub-ai-app');
  assert.equal(meta.label, 'RunningHub AI 应用');
  assert.equal(meta.panelLabel, 'RunningHub');
  assert.equal(meta.saveSuccess, 'RH AI应用配置已保存');
  assert.equal(meta.saveFailed, 'RH AI应用配置保存失败');
  assert.equal(meta.deleteSuccess, 'RH AI应用配置已删除');
});

test('RunningHub 工作流元数据缺少 saveFailed 与 deleteSuccess', () => {
  const meta = getSourceMeta(SOURCE_TYPES.runninghubWorkflow);
  assert.equal(meta.id, 'runninghub-workflow');
  assert.equal(meta.label, 'RunningHub 工作流');
  assert.equal('saveFailed' in meta, false);
  assert.equal('deleteSuccess' in meta, false);
  assert.equal(meta.saveSuccess, 'RH 工作流配置已保存');
});

test('ComfyUI 本地与云端共用同一组文案，但 id 不同', () => {
  const local = getSourceMeta(SOURCE_TYPES.comfyuiLocal);
  const cloud = getSourceMeta(SOURCE_TYPES.comfyuiCloud);
  assert.equal(local.id, 'comfyui-local-workflow');
  assert.equal(cloud.id, 'comfyui-cloud-workflow');
  for (const key of Object.keys(COMFY_UI_WORKFLOW_SHARED_SOURCE_META)) {
    assert.deepEqual(local[key], COMFY_UI_WORKFLOW_SHARED_SOURCE_META[key]);
    assert.deepEqual(cloud[key], COMFY_UI_WORKFLOW_SHARED_SOURCE_META[key]);
  }
  assert.equal(local.label, 'ComfyUI 工作流');
  assert.equal(local.saveFailed, 'ComfyUI 工作流配置保存失败');
});

test('isComfyUiSource 仅对两个 ComfyUI 取值成立', () => {
  assert.equal(isComfyUiSource('comfyui-local-workflow'), true);
  assert.equal(isComfyUiSource(' comfyui-cloud-workflow '), true);
  assert.equal(isComfyUiSource('runninghub-ai-app'), false);
  assert.equal(isComfyUiSource('runninghub-workflow'), false);
  assert.equal(isComfyUiSource(''), false);
});

test('getComfyUiBaseUrlMode 区分云端与本地', () => {
  assert.equal(getComfyUiBaseUrlMode('comfyui-cloud-workflow'), 'cloud');
  assert.equal(getComfyUiBaseUrlMode('comfyui-local-workflow'), 'local');
  assert.equal(getComfyUiBaseUrlMode('runninghub-ai-app'), 'local');
  assert.equal(getComfyUiBaseUrlMode(null), 'local');
});

test('getComfyUiSourceTypeFromBaseUrlMode 对 cloud 大小写不敏感', () => {
  assert.equal(getComfyUiSourceTypeFromBaseUrlMode('cloud'), 'comfyui-cloud-workflow');
  assert.equal(getComfyUiSourceTypeFromBaseUrlMode('  CLOUD '), 'comfyui-cloud-workflow');
  assert.equal(getComfyUiSourceTypeFromBaseUrlMode('local'), 'comfyui-local-workflow');
  assert.equal(getComfyUiSourceTypeFromBaseUrlMode('other'), 'comfyui-local-workflow');
  assert.equal(getComfyUiSourceTypeFromBaseUrlMode(undefined), 'comfyui-local-workflow');
});

test('getComfyUiBaseUrlModeLabel 返回中文标签', () => {
  assert.equal(getComfyUiBaseUrlModeLabel('comfyui-cloud-workflow'), '云端');
  assert.equal(getComfyUiBaseUrlModeLabel('comfyui-local-workflow'), '本地');
  assert.equal(getComfyUiBaseUrlModeLabel('runninghub-workflow'), '本地');
});

test('isRunningHubSource 严格匹配两个 RunningHub 取值', () => {
  assert.equal(isRunningHubSource('runninghub-ai-app'), true);
  assert.equal(isRunningHubSource('runninghub-workflow'), true);
  assert.equal(isRunningHubSource(' runninghub-ai-app '), false);
  assert.equal(isRunningHubSource('comfyui-local-workflow'), false);
  assert.equal(isRunningHubSource(null), false);
});

test('工作流状态作用域常量与元数据冻结', () => {
  assert.equal(COMFYUI_WORKFLOW_STATE_SCOPE, 'comfyui-workflow');
  assert.equal(Object.isFrozen(COMFY_UI_WORKFLOW_SHARED_SOURCE_META), true);
  assert.equal(Object.isFrozen(SOURCE_TYPE_META), true);
  assert.equal(Object.isFrozen(SOURCE_TYPE_META['runninghub-ai-app']), true);
  assert.equal(Object.isFrozen(SOURCE_TYPE_KEYS), true);
});
