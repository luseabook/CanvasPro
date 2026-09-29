import test from 'node:test';
import assert from 'node:assert/strict';

import { RH_VIDEO_LTX23_MODEL_ID } from '../../manifests/index.js';
import { applyVideoNodeAdaptiveAspectRatio } from './videoNodeAdaptiveAspectRatio.js';

function createModelManifest(displayAspectRatioSource = null) {
  return {
    inputSlots: displayAspectRatioSource ? { displayAspectRatioSource } : {},
    uiSchema: {
      fields: [
        {
          id: 'aspectRatio',
          displayRole: 'aspectRatio',
          defaultValue: 'adaptive',
          options: [{ value: 'adaptive' }, { value: '16:9' }, { value: '1:1' }],
        },
      ],
    },
    extensions: {},
  };
}

test('videoNodeAdaptiveAspectRatio: prefers an image source over a video source', () => {
  const payload = {
    generationParams: { aspectRatio: 'adaptive' },
  };
  const result = applyVideoNodeAdaptiveAspectRatio(payload, {
    inEdges: [
      { sourceId: 'video-1', refSlot: 'sourceVideo' },
      { sourceId: 'image-1', refSlot: 'reference' },
    ],
    nodes: {
      'video-1': {
        type: 'source-video',
        videoWidth: 1000,
        videoHeight: 1000,
      },
      'image-1': {
        type: 'source-image',
        naturalWidth: 1600,
        naturalHeight: 900,
      },
    },
    modelManifest: createModelManifest(),
  });

  assert.equal(result.aspectRatio, '16:9');
  assert.equal(result.generationParams.aspectRatio, '16:9');
});

test('videoNodeAdaptiveAspectRatio: honors the configured image slot', () => {
  const payload = {
    generationParams: { aspectRatio: 'adaptive' },
  };
  const result = applyVideoNodeAdaptiveAspectRatio(payload, {
    inEdges: [
      { sourceId: 'image-other', refSlot: 'other' },
      { sourceId: 'image-ref', refSlot: 'refImage' },
    ],
    nodes: {
      'image-other': {
        type: 'source-image',
        naturalWidth: 1600,
        naturalHeight: 900,
      },
      'image-ref': {
        type: 'source-image',
        naturalWidth: 1000,
        naturalHeight: 1000,
      },
    },
    nodeData: {
      model: RH_VIDEO_LTX23_MODEL_ID,
      generationParams: { aspectRatio: 'adaptive' },
    },
    modelManifest: createModelManifest({
      kind: 'image',
      slot: 'refImage',
    }),
  });

  assert.equal(result.aspectRatio, '1:1');
});

test('videoNodeAdaptiveAspectRatio: falls back to the preferred concrete ratio', () => {
  const payload = {
    generationParams: { aspectRatio: 'adaptive' },
  };
  const result = applyVideoNodeAdaptiveAspectRatio(payload, {
    modelManifest: createModelManifest(),
  });

  assert.equal(result.aspectRatio, '1:1');
});
