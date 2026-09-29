import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getStoryVideoInputTextModelOptions,
  getStoryWorkspaceModelChoice,
  getStoryWorkspaceModelOptions,
  getStoryWorkspaceProviderLabel,
  isStoryVideoInputTextModel,
  isStoryWorkspaceModelVisible,
  resolveStoryVideoInputTextModelId,
  resolveStoryWorkspaceModelId,
} from './storyWorkspaceModelCatalog.js';

test('storyWorkspaceModelCatalog: provider labels use the shared model catalog projection', () => {
  assert.equal(getStoryWorkspaceProviderLabel(' volcengine '), '火山方舟');
  assert.equal(getStoryWorkspaceProviderLabel('unknown-provider'), 'unknown-provider');
});

test('storyWorkspaceModelCatalog: visibility excludes hidden providers and unapproved workflows', () => {
  assert.equal(
    isStoryWorkspaceModelVisible('image', {
      kind: 'image',
      provider: 'agnes',
    }),
    true,
  );
  assert.equal(
    isStoryWorkspaceModelVisible('image', {
      kind: 'image',
      provider: 'ppio',
    }),
    false,
  );
  assert.equal(
    isStoryWorkspaceModelVisible('video', {
      kind: 'video',
      provider: 'runninghubwf',
      adapterType: 'workflow',
      modelId: 'not-approved',
    }),
    false,
  );
  assert.equal(
    isStoryWorkspaceModelVisible('video', {
      kind: 'video',
      provider: 'apimart',
      adapterType: 'modelApi',
      modelId: 'approved-model-api',
    }),
    true,
  );
});

test('storyWorkspaceModelCatalog: video options exclude hidden and unapproved workflow models', () => {
  const options = getStoryWorkspaceModelOptions('video');

  assert.ok(options.length > 0);
  assert.equal(options.every((model) => model.kind === 'video'), true);
  assert.equal(options.some((model) => model.provider === 'ppio'), false);
  assert.equal(options.some((model) => model.provider === 'runninghubwf'), false);
});

test('storyWorkspaceModelCatalog: model resolution accepts visible ids and otherwise falls back', () => {
  const textOptions = getStoryWorkspaceModelOptions('text');
  const selected = textOptions[0].modelId;

  assert.equal(resolveStoryWorkspaceModelId('text', ` ${selected} `), selected);
  assert.equal(resolveStoryWorkspaceModelId('text', 'missing-model'), selected);
  assert.deepEqual(getStoryWorkspaceModelChoice('text', selected), textOptions[0]);
  assert.equal(resolveStoryWorkspaceModelId('text', 'missing-model'), textOptions[0].modelId);
});

test('storyWorkspaceModelCatalog: video analysis text models are filtered and resolvable', () => {
  const options = getStoryVideoInputTextModelOptions();

  assert.ok(options.length > 0);
  assert.equal(options.every((model) => isStoryVideoInputTextModel(model.modelId)), true);
  assert.equal(resolveStoryVideoInputTextModelId(options[0].modelId), options[0].modelId);
  assert.equal(resolveStoryVideoInputTextModelId('missing-model'), options[0].modelId);
});
