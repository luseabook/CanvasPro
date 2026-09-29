import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveModelPricingInputs } from './modelPricingInputs.js';

test('modelPricingInputs: collects typed inputs and removes exact duplicates', () => {
  const inputs = resolveModelPricingInputs({
    inputUrls: [
      'https://cdn.example/a.png',
      { url: 'https://cdn.example/a.png' },
      { url: 'data:image/png;base64,AA', refSlot: 'image-2' },
    ],
    videoUrls: ['data:video/mp4;base64,AA'],
    audioUrls: ['data:audio/mpeg;base64,AA'],
  });

  assert.deepEqual(inputs, [
    { type: 'image', url: 'https://cdn.example/a.png', refSlot: '' },
    { type: 'image', url: 'data:image/png;base64,AA', refSlot: 'image-2' },
    { type: 'video', url: 'data:video/mp4;base64,AA', refSlot: '' },
    { type: 'audio', url: 'data:audio/mpeg;base64,AA', refSlot: '' },
  ]);
});

test('modelPricingInputs: ignores empty and unsupported input records', () => {
  const inputs = resolveModelPricingInputs({
    inputUrls: [null, { refSlot: 'missing-url' }],
    videoRefs: [{ type: 'ignored' }],
  });

  assert.deepEqual(inputs, []);
});
