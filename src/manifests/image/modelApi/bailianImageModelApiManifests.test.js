import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bailianImageExecutionManifests,
  bailianImageModelManifests,
} from './bailianImageModelApiManifests.js';

test('bailianImageModelApiManifests: exports the Qwen Image 3 model', () => {
  assert.equal(bailianImageModelManifests.length, 1);
  const [model] = bailianImageModelManifests;

  assert.equal(model.modelId, 'bailian/qwen-image-3.0');
  assert.equal(model.executionId, 'bailian.model-api.image.qwen-image-3.v1');
  assert.equal(model.adapterType, 'modelApi');
  assert.equal(model.inputSlots.maxByKind.image, 3);
  assert.equal(model.extensions.imageMenu.group, 'bailian');
  assert.equal(model.uiSchema.fields.length, 7);
});

test('bailianImageModelApiManifests: maps batch and provider upload behavior', () => {
  assert.equal(bailianImageExecutionManifests.length, 1);
  const [execution] = bailianImageExecutionManifests;

  assert.equal(execution.model, 'qwen-image-3.0');
  assert.equal(execution.modeModels.pro, 'qwen-image-3.0-pro');
  assert.equal(execution.extensions.bodyResolver, 'bailianImage');
  assert.equal(execution.extensions.batchSubmitMode, 'providerN');
  assert.equal(execution.extensions.imageInputUpload.provider, 'freeImageHost');
  assert.equal(execution.bodyMapping.length, 6);
});
