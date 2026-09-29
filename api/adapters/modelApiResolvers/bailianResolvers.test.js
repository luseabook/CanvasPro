import test from 'node:test';
import assert from 'node:assert/strict';

import { bailianImage, bailianVideo } from './bailianResolvers.js';

test('bailianResolvers: maps Qwen image references and dimensions', () => {
  const result = bailianImage({
    currentBody: { input: { old: true }, parameters: { quality: 'high' } },
    payload: { generationParams: { aspectRatio: '16:9', imageSize: '2K' } },
    inputImages: ['https://cdn.example/a.png'],
    finalPrompt: 'edit it',
  });

  assert.deepEqual(result.input.messages[0].content, [
    { image: 'https://cdn.example/a.png' },
    { text: 'edit it' },
  ]);
  assert.equal(result.parameters.size, '2720*1536');
  assert.equal(result.parameters.quality, 'high');
  assert.throws(
    () =>
      bailianImage({
        currentBody: {},
        payload: {},
        inputImages: ['1', '2', '3', '4'],
        finalPrompt: '',
      }),
    /3/,
  );
});

test('bailianResolvers: maps frame mode images and serializable video parameters', () => {
  const result = bailianVideo({
    currentBody: { input: { keep: true }, parameters: { previous: 'value' } },
    payload: {
      generationParams: {
        generation_type: 'frame',
        aspectRatio: '16:9',
        resolution: '1080P',
        duration: '5',
        audio: false,
        prompt_extend: true,
        watermark: false,
        seed: 0,
      },
    },
    inputImages: ['first.png', 'last.png'],
    inputVideos: [],
    inputAudios: [],
    finalUrlsBySlot: {},
  });

  assert.equal(result.input.keep, true);
  assert.deepEqual(result.input.media, [
    { type: 'first_frame', url: 'first.png' },
    { type: 'last_frame', url: 'last.png' },
  ]);
  assert.deepEqual(result.parameters, {
    resolution: '1080P',
    ratio: '16:9',
    duration: 5,
    audio: false,
    prompt_extend: true,
    watermark: false,
    seed: 0,
  });
});

test('bailianResolvers: maps reference media and rejects invalid frame combinations', () => {
  const result = bailianVideo({
    currentBody: { input: { keep: true }, parameters: {} },
    payload: {
      generationParams: {
        generation_type: 'reference',
        aspectRatio: 'adaptive',
        resolution: '720P',
        duration: 4,
        audio: true,
        prompt_extend: false,
        watermark: true,
      },
    },
    inputImages: ['image.png'],
    inputVideos: ['video.mp4'],
    inputAudios: ['audio.mp3'],
    finalUrlsBySlot: {},
  });

  assert.deepEqual(result.input.media, [
    { type: 'reference_image', url: 'image.png' },
    { type: 'reference_video', url: 'video.mp4' },
    { type: 'reference_audio', url: 'audio.mp3' },
  ]);
  assert.equal(result.parameters.ratio, 'adaptive');
  assert.equal(result.parameters.seed, undefined);

  assert.throws(() =>
    bailianVideo({
      currentBody: {},
      payload: { generationParams: { generation_type: 'frame' } },
      inputImages: ['first.png'],
      inputVideos: ['video.mp4'],
      inputAudios: [],
      finalUrlsBySlot: {},
    }),
  );
  assert.throws(() =>
    bailianVideo({
      currentBody: {},
      payload: { generationParams: { generation_type: 'frame' } },
      inputImages: [],
      inputVideos: [],
      inputAudios: [],
      finalUrlsBySlot: { lastFrame: 'last.png' },
    }),
  );
});
