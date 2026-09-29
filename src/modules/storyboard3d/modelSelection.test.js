import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORYBOARD_3D_DEFAULT_TEXT_MODEL_ID,
  getStoryboard3DTextModelIds,
  getStoryboard3DTextModelOptions,
  isStoryboard3DTextModelVisible,
  resolveStoryboard3DTextModelSelection,
} from './modelSelection.js';

test('modelSelection: exposes public text models only', () => {
  assert.equal(
    STORYBOARD_3D_DEFAULT_TEXT_MODEL_ID,
    'volcengine/doubao-seed-2-1-pro-260915',
  );
  const options = getStoryboard3DTextModelOptions();
  assert.ok(options.length > 0);
  assert.equal(options.every((option) => option.kind === 'text'), true);
  assert.deepEqual(
    getStoryboard3DTextModelIds(),
    options.map((option) => option.modelId),
  );
});

test('modelSelection: visibility delegates to the shared public catalog rules', () => {
  const first = getStoryboard3DTextModelOptions()[0];
  assert.equal(isStoryboard3DTextModelVisible(first), true);
  assert.equal(
    isStoryboard3DTextModelVisible({ ...first, kind: 'image' }),
    false,
  );
  assert.equal(
    isStoryboard3DTextModelVisible({ ...first, provider: 'ppio' }),
    false,
  );
});

test('modelSelection: resolution accepts visible ids and otherwise falls back', () => {
  const options = getStoryboard3DTextModelOptions();
  const first = options[0];
  const preferred = options.find((option) => option.modelId !== first.modelId) || first;

  assert.deepEqual(resolveStoryboard3DTextModelSelection(` ${preferred.modelId} `), {
    modelId: preferred.modelId,
    provider: preferred.provider,
  });
  assert.deepEqual(resolveStoryboard3DTextModelSelection('missing-model'), {
    modelId: first.modelId,
    provider: first.provider,
  });
});
