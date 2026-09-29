import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveMinimaxH3Request } from './minimaxH3VideoResolverShared.js';

const referenceUrl = 'https://cdn.test/ref.png';

test('minimaxH3VideoResolverShared: resolves reference mode with slots and translated mentions', () => {
  const result = resolveMinimaxH3Request({
    currentBody: {
      prompt: '@图片1 walks forward',
      rh_mode: 'reference',
      resolution: '768p',
      duration: '9',
      watermark: true,
      ratio: '自适应',
    },
    inputImages: ['https://cdn.test/input.png', referenceUrl],
    finalUrlsBySlot: { referenceImage: referenceUrl },
    modeFieldId: 'rh_mode',
    providerLabel: 'Test',
    payload: {},
  });

  assert.deepEqual(result, {
    mode: 'reference',
    prompt: '<Picture 1> walks forward',
    resolution: '768P',
    duration: 9,
    watermark: true,
    ratio: 'adaptive',
    referenceImages: [referenceUrl, 'https://cdn.test/input.png'],
    referenceVideos: [],
    referenceAudios: [],
  });
});

test('minimaxH3VideoResolverShared: resolves first and last frame mode', () => {
  const result = resolveMinimaxH3Request({
    currentBody: { prompt: 'move', rh_mode: 'frames', ratio: 'auto' },
    finalUrlsBySlot: {
      firstFrame: 'https://cdn.test/first.png',
      lastFrame: 'https://cdn.test/last.png',
    },
    modeFieldId: 'rh_mode',
    providerLabel: 'Test',
    payload: {},
  });

  assert.equal(result.mode, 'frames');
  assert.equal(result.resolution, '2K');
  assert.equal(result.duration, 5);
  assert.equal(result.ratio, 'adaptive');
  assert.equal(result.firstFrameImage, 'https://cdn.test/first.png');
  assert.equal(result.lastFrameImage, 'https://cdn.test/last.png');
});

test('minimaxH3VideoResolverShared: enforces media, prompt, and mode limits', () => {
  assert.throws(
    () =>
      resolveMinimaxH3Request({
        currentBody: { prompt: 'audio', rh_mode: 'reference' },
        inputAudios: ['https://cdn.test/audio.mp3'],
        modeFieldId: 'rh_mode',
        providerLabel: 'Test',
        payload: {},
      }),
    /audio references require an image or video reference/,
  );
  assert.throws(
    () =>
      resolveMinimaxH3Request({
        currentBody: { prompt: 'move', rh_mode: 'frames' },
        inputImages: ['a', 'b', 'c'],
        modeFieldId: 'rh_mode',
        providerLabel: 'Test',
        payload: {},
      }),
    /at most 2 image inputs/,
  );
  assert.throws(
    () =>
      resolveMinimaxH3Request({
        currentBody: {},
        modeFieldId: 'rh_mode',
        providerLabel: 'Test',
        payload: {},
      }),
    /prompt is required/,
  );
});
