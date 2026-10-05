import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildGenerationModelSelectionDisplayPatch,
  buildImageDisplayRatioResizePatch,
  disposeImageSchemaRatioResizeAnimation,
  isAdaptiveImageAspectRatioValue,
  parseImageDisplayAspectRatio,
  resolveImageSchemaAdaptiveRatioDisplayValue,
} from './generationDisplayPolicy.js';

test('generationDisplayPolicy: recognizes adaptive labels and parses exact ratios', () => {
  assert.equal(isAdaptiveImageAspectRatioValue(''), true);
  assert.equal(isAdaptiveImageAspectRatioValue('auto'), true);
  assert.equal(isAdaptiveImageAspectRatioValue('自适应'), true);
  assert.deepEqual(parseImageDisplayAspectRatio(' 16：9 '), {
    width: 16,
    height: 9,
    label: '16:9',
  });
  assert.equal(parseImageDisplayAspectRatio('0:9'), null);
  assert.equal(parseImageDisplayAspectRatio('auto'), null);
});

test('generationDisplayPolicy: builds centered resize patches for landscape and portrait ratios', () => {
  assert.deepEqual(
    buildImageDisplayRatioResizePatch({
      nodeData: { width: 150, height: 150, x: 100, y: 200 },
      ratioValue: '16:9',
      minSide: 150,
    }),
    { width: 267, height: 150, x: 42, y: 200 },
  );
  assert.deepEqual(
    buildImageDisplayRatioResizePatch({
      nodeData: { width: 150, height: 150, x: 100, y: 200 },
      ratioValue: '9:16',
      minSide: 150,
    }),
    { width: 150, height: 267, x: 100, y: 83 },
  );
});

test('generationDisplayPolicy: builds a model-selection patch from an explicit ratio', () => {
  const store = {
    getStateRaw() {
      return {
        nodes: {
          'node-policy': { id: 'node-policy', type: 'ai-image', width: 150, height: 150, x: 100, y: 200 },
        },
      };
    },
  };
  const patch = buildGenerationModelSelectionDisplayPatch({
    store,
    nodeId: 'node-policy',
    nodeData: { width: 150, height: 150, x: 100, y: 200 },
    modelId: 'test-image-model',
    ratioValue: '16:9',
    minSide: 150,
  });

  assert.deepEqual(patch, {
    aspectRatio: '16:9',
    width: 267,
    height: 150,
    x: 42,
    y: 200,
  });
});

test('generationDisplayPolicy: defaults adaptive output to 1:1 without accepted inputs', () => {
  const value = resolveImageSchemaAdaptiveRatioDisplayValue({
    store: {
      getStateRaw() {
        return { nodes: { 'node-policy': { id: 'node-policy', type: 'ai-image' } } };
      },
      getIncomingEdges() {
        return [];
      },
    },
    nodeId: 'node-policy',
    nodeData: { id: 'node-policy', type: 'ai-image' },
  });

  assert.equal(value, '1:1');
});

test('generationDisplayPolicy: dispose clears preview transforms and wrapper animation classes', () => {
  const classes = new Set(['is-ratio-animating']);
  const preview = { style: { transform: 'scaleX(0.5)', transformOrigin: 'bottom center' } };
  const context = {
    _ratioFlipPreviewEl: preview,
    _ratioAnimWrapperEl: {
      classList: {
        remove(value) {
          classes.delete(value);
        },
      },
    },
  };

  disposeImageSchemaRatioResizeAnimation(context, { previewEl: preview });

  assert.equal(preview.style.transform, '');
  assert.equal(preview.style.transformOrigin, '');
  assert.equal(context._ratioFlipPreviewEl, null);
  assert.equal(context._ratioAnimWrapperEl, null);
  assert.equal(classes.has('is-ratio-animating'), false);
});
