import test from 'node:test';
import assert from 'node:assert/strict';

import { RH_VIDEO_BERNINI_V1_MODEL_ID } from '../../manifests/index.js';
import { buildUiSchemaVisibilitySignature } from './uiSchemaVisibility.js';

function parseSignature(signature) {
  return JSON.parse(signature);
}

test('uiSchemaVisibility: builds a stable dependency-only signature', () => {
  const first = buildUiSchemaVisibilitySignature(RH_VIDEO_BERNINI_V1_MODEL_ID, {
    generationParams: { rhBerniniInputMode: 'image', unrelated: 'one' },
  });
  const second = buildUiSchemaVisibilitySignature(RH_VIDEO_BERNINI_V1_MODEL_ID, {
    generationParams: { unrelated: 'two', rhBerniniInputMode: 'image' },
  });
  const parsed = parseSignature(first);
  const dependencies = new Map(parsed.dependencies);

  assert.equal(first, second);
  assert.equal(parsed.modelId, RH_VIDEO_BERNINI_V1_MODEL_ID);
  assert.equal(dependencies.get('rhBerniniInputMode'), 'image');
  assert.equal(dependencies.has('unrelated'), false);
});

test('uiSchemaVisibility: changes when a visibility dependency changes', () => {
  const image = buildUiSchemaVisibilitySignature(RH_VIDEO_BERNINI_V1_MODEL_ID, {
    generationParams: { rhBerniniInputMode: 'image' },
  });
  const video = buildUiSchemaVisibilitySignature(RH_VIDEO_BERNINI_V1_MODEL_ID, {
    generationParams: { rhBerniniInputMode: 'video' },
  });
  const fallback = buildUiSchemaVisibilitySignature('', {
    model: RH_VIDEO_BERNINI_V1_MODEL_ID,
    generationParams: { rhBerniniInputMode: 'image' },
  });

  assert.notEqual(image, video);
  assert.equal(fallback, image);
});
