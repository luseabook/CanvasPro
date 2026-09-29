import test from 'node:test';
import assert from 'node:assert/strict';

import { minimaxH3Video } from './minimaxVideoResolvers.js';

test('minimaxVideoResolvers: builds reference-mode content parts', () => {
  const result = minimaxH3Video({
    currentBody: {
      model: 'MiniMax-H3',
      prompt: 'move',
      minimax_h3_mode: 'reference',
      resolution: '768p',
      duration: '6',
      ratio: '16:9',
      watermark: true,
    },
    inputImages: ['https://cdn.test/ref.png'],
  });

  assert.deepEqual(result, {
    model: 'MiniMax-H3',
    content: [
      { type: 'text', text: 'move' },
      {
        type: 'image_url',
        image_url: { url: 'https://cdn.test/ref.png' },
        role: 'reference_image',
      },
    ],
    resolution: '768P',
    duration: 6,
    ratio: '16:9',
    aigc_watermark: true,
  });
});

test('minimaxVideoResolvers: builds first and last frame content parts', () => {
  const result = minimaxH3Video({
    currentBody: { prompt: 'move', minimax_h3_mode: 'frames', ratio: 'auto' },
    finalUrlsBySlot: {
      firstFrame: 'https://cdn.test/first.png',
      lastFrame: 'https://cdn.test/last.png',
    },
  });

  assert.equal(result.model, 'MiniMax-H3');
  assert.equal(result.resolution, '2K');
  assert.equal(result.duration, 5);
  assert.equal(result.ratio, 'adaptive');
  assert.deepEqual(result.content, [
    { type: 'text', text: 'move' },
    {
      type: 'image_url',
      image_url: { url: 'https://cdn.test/first.png' },
      role: 'first_frame',
    },
    {
      type: 'image_url',
      image_url: { url: 'https://cdn.test/last.png' },
      role: 'last_frame',
    },
  ]);
});
