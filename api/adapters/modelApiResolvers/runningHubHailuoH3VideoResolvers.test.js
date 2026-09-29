import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runninghubHailuoH3Video,
  runninghubHailuoH3VideoEndpoint,
} from './runningHubHailuoH3VideoResolvers.js';

test('runningHubHailuoH3VideoResolvers: resolves multimodal references', () => {
  const result = runninghubHailuoH3Video({
    currentBody: { prompt: '@图片1 and @音频1', rh_hailuo_h3_mode: 'reference', ratio: '21:9' },
    inputImages: ['https://cdn.test/ref.png'],
    inputVideos: ['https://cdn.test/ref.mp4'],
    inputAudios: ['https://cdn.test/ref.mp3'],
    payload: {},
  });

  assert.deepEqual(result, {
    prompt: '<Picture 1> and <Audio 1>',
    resolution: '2K',
    duration: '5',
    imageUrls: ['https://cdn.test/ref.png'],
    videoUrls: ['https://cdn.test/ref.mp4'],
    audioUrls: ['https://cdn.test/ref.mp3'],
    ratio: '21:9',
  });
});

test('runningHubHailuoH3VideoResolvers: resolves frames and endpoints', () => {
  const result = runninghubHailuoH3Video({
    currentBody: { prompt: 'move', duration: 12 },
    inputImages: ['https://cdn.test/first.png', 'https://cdn.test/last.png'],
    payload: {},
  });

  assert.equal(result.firstFrameUrl, 'https://cdn.test/first.png');
  assert.equal(result.lastFrameUrl, 'https://cdn.test/last.png');
  assert.equal(result.ratio, undefined);
  assert.equal(result.duration, '12');

  assert.equal(
    runninghubHailuoH3VideoEndpoint({
      currentBody: { rh_hailuo_h3_mode: 'reference' },
      payload: {},
    }),
    'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/multimodal-to-video',
  );
  assert.equal(
    runninghubHailuoH3VideoEndpoint({
      currentBody: {},
      payload: {},
      inputImages: ['https://cdn.test/first.png'],
    }),
    'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/image-to-video',
  );
  assert.equal(
    runninghubHailuoH3VideoEndpoint({ currentBody: {}, payload: {} }),
    'https://www.runninghub.cn/openapi/v2/minimax/hailuo-h3/text-to-video',
  );
});

test('runningHubHailuoH3VideoResolvers: enforces prompt and frame-mode limits', () => {
  assert.throws(() => runninghubHailuoH3Video({ currentBody: {}, payload: {} }), /prompt is required/);
  assert.throws(
    () =>
      runninghubHailuoH3Video({
        currentBody: { prompt: 'move', rh_hailuo_h3_mode: 'frames' },
        inputVideos: ['https://cdn.test/ref.mp4'],
        payload: {},
      }),
    /accepts images only/,
  );
  assert.throws(
    () =>
      runninghubHailuoH3Video({
        currentBody: { prompt: 'move', rh_hailuo_h3_mode: 'frames' },
        inputImages: ['a', 'b', 'c'],
        payload: {},
      }),
    /at most 2 image inputs/,
  );
});
