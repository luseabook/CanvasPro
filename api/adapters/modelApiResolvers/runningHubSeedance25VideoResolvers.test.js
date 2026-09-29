import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runninghubSeedance25Video,
  runninghubSeedance25VideoEndpoint,
} from './runningHubSeedance25VideoResolvers.js';

test('runningHubSeedance25VideoResolvers: resolves multimodal inputs and edit options', () => {
  const result = runninghubSeedance25Video({
    currentBody: {
      prompt: 'compose',
      rh_seedance_2_mode: 'multimodal2video',
      realPersonMode: true,
      conversionSlots: [' face '],
    },
    inputImages: ['https://cdn.test/a.png'],
    inputVideos: ['https://cdn.test/a.mp4'],
    inputAudios: ['https://cdn.test/a.mp3'],
    payload: { generationParams: { omniReferenceTaskType: 'edit' } },
  });

  assert.deepEqual(result, {
    prompt: 'compose',
    realPersonMode: true,
    imageUrls: ['https://cdn.test/a.png'],
    videoUrls: ['https://cdn.test/a.mp4'],
    audioUrls: ['https://cdn.test/a.mp3'],
    omniReferenceTaskType: 'edit',
    conversionSlots: ['face'],
  });
});

test('runningHubSeedance25VideoResolvers: resolves image and first-last-frame modes', () => {
  const image = runninghubSeedance25Video({
    currentBody: { prompt: 'animate', rh_seedance_2_mode: 'image2video', seed: '2.9' },
    inputImages: ['https://cdn.test/image.png'],
    payload: {},
  });
  assert.equal(image.firstFrameUrl, 'https://cdn.test/image.png');
  assert.equal(image.ratio, 'adaptive');
  assert.equal(image.seed, 2);

  const frames = runninghubSeedance25Video({
    currentBody: { prompt: 'morph', rh_seedance_2_mode: 'frames2video', realPersonMode: false },
    inputImages: ['https://cdn.test/first.png', 'https://cdn.test/last.png'],
    finalUrlsBySlot: {
      firstFrame: 'https://cdn.test/first.png',
      lastFrame: 'https://cdn.test/last.png',
    },
    payload: {},
  });
  assert.equal(frames.firstFrameUrl, 'https://cdn.test/first.png');
  assert.equal(frames.lastFrameUrl, 'https://cdn.test/last.png');
  assert.equal(frames.conversionSlots, undefined);
});

test('runningHubSeedance25VideoResolvers: selects endpoints and rejects invalid media counts', () => {
  assert.equal(
    runninghubSeedance25VideoEndpoint({
      currentBody: { rh_seedance_2_mode: 'multimodal2video' },
      payload: {},
      inputImages: ['https://cdn.test/a.png'],
    }),
    'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/multimodal-video',
  );
  assert.equal(
    runninghubSeedance25VideoEndpoint({
      currentBody: { rh_seedance_2_mode: 'image2video' },
      payload: {},
      inputImages: ['https://cdn.test/a.png'],
    }),
    'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/image-to-video',
  );
  assert.equal(
    runninghubSeedance25VideoEndpoint({ currentBody: {}, payload: {} }),
    'https://www.runninghub.cn/openapi/v2/bytedance/seedance-2.5-token/text-to-video',
  );

  assert.throws(
    () =>
      runninghubSeedance25Video({
        currentBody: { prompt: 'animate', rh_seedance_2_mode: 'image2video' },
        inputImages: ['a', 'b'],
        payload: {},
      }),
    /requires exactly 1 image input/,
  );
  assert.throws(
    () =>
      runninghubSeedance25Video({
        currentBody: { prompt: 'animate', rh_seedance_2_mode: 'image2video' },
        inputVideos: ['https://cdn.test/a.mp4'],
        payload: {},
      }),
    /only accept image input/,
  );
});
