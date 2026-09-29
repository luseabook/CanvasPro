import test from 'node:test';
import assert from 'node:assert/strict';

import {
  runninghubHailuo23Video,
  runninghubHailuo23VideoEndpoint,
  runninghubHappyHorseVideo,
  runninghubHappyHorseVideoEndpoint,
  runninghubKlingO1Video,
  runninghubKlingO1VideoEndpoint,
  runninghubKlingO3Video,
  runninghubKlingO3VideoEndpoint,
  runninghubKlingV3Video,
  runninghubKlingV3VideoEndpoint,
  runninghubSeedance2Video,
  runninghubSeedance2VideoEndpoint,
  runninghubVeo3Video,
  runninghubVeo3VideoEndpoint,
  runninghubWan27Video,
  runninghubWan27VideoEndpoint,
} from './runningHubVideoResolvers.js';

test('runningHubVideoResolvers: routes HappyHorse modes and rejects unsupported 1.1 editing', () => {
  assert.equal(
    runninghubHappyHorseVideoEndpoint({
      modelToken: 'happyhorse-1.0',
      payload: { generationParams: { happyhorse_mode: 'image' } },
      currentBody: {},
      inputImages: ['image'],
    }),
    'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.0/image-to-video',
  );
  assert.equal(
    runninghubHappyHorseVideoEndpoint({
      modelToken: 'happyhorse-1.1',
      payload: { happyhorse_mode: 'reference' },
      inputImages: ['image'],
    }),
    'https://www.runninghub.cn/openapi/v2/alibaba/happyhorse-1.1/reference-to-video',
  );

  assert.deepEqual(
    runninghubHappyHorseVideo({
      currentBody: { prompt: 'prompt', seed: '4.7', imageUrl: 'old' },
      inputImages: ['new-image'],
      payload: { happyhorse_mode: 'image' },
      finalUrlsBySlot: { firstFrame: 'slot-image' },
    }),
    { prompt: 'prompt', seed: 4, imageUrl: 'slot-image' },
  );
  assert.deepEqual(
    runninghubHappyHorseVideo({
      currentBody: { prompt: 'edit', mode: 'edit', videoUrl: 'old' },
      inputVideos: ['video'],
      payload: { generationParams: { happyhorse_mode: 'edit', audioSetting: 'origin' } },
    }),
    { prompt: 'edit', mode: 'edit', videoUrl: 'video', audioSetting: 'origin' },
  );
  assert.throws(
    () =>
      runninghubHappyHorseVideo({
        currentBody: { prompt: 'edit' },
        inputVideos: ['video'],
        payload: { model: 'happyhorse-1.1', happyhorse_mode: 'edit' },
      }),
    /1.1 does not support video edit mode/,
  );
});

test('runningHubVideoResolvers: routes and normalizes Seedance 2.0 multimodal workflows', () => {
  assert.equal(
    runninghubSeedance2VideoEndpoint({
      payload: {
        model: 'sparkvideo-2.0-mini',
        generationParams: { rh_seedance_2_mode: 'reference' },
      },
    }),
    'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-mini/multimodal-video',
  );
  assert.equal(
    runninghubSeedance2VideoEndpoint({
      modelToken: 'sparkvideo-2.0-fast',
      payload: { generationParams: { rh_seedance_2_mode: 'frames' } },
    }),
    'https://www.runninghub.cn/openapi/v2/rhart-video/sparkvideo-2.0-fast/image-to-video',
  );

  const body = runninghubSeedance2Video({
    currentBody: {
      model: 'model',
      webSearch: true,
      realPersonMode: true,
      conversionSlots: ['face'],
    },
    inputImages: ['image-1'],
    inputVideos: ['video-1'],
    inputAudios: ['audio-1'],
    payload: {
      prompt: 'prompt',
      generationParams: { rh_seedance_2_mode: 'reference' },
    },
    finalUrlsBySlot: { referenceImage: 'image-2' },
  });
  assert.deepEqual(body, {
    model: 'model',
    prompt: 'prompt',
    realPersonMode: true,
    imageUrls: ['image-2', 'image-1'],
    videoUrls: ['video-1'],
    audioUrls: ['audio-1'],
    conversionSlots: ['face'],
  });
});

test('runningHubVideoResolvers: maps Kling O1 reference, edit, and frame modes', () => {
  assert.equal(
    runninghubKlingO1VideoEndpoint({
      payload: { generationParams: { rh_kling_o1_generation_mode: 'reference' } },
      inputImages: ['image'],
      inputVideos: ['video'],
    }),
    'https://www.runninghub.cn/openapi/v2/kling-video-o1-std/refrence-to-video',
  );
  assert.deepEqual(
    runninghubKlingO1Video({
      currentBody: { prompt: '@图片1 move', mode: 'pro', duration: 6, aspectRatio: '1:1' },
      inputImages: ['image'],
      inputVideos: ['video'],
      payload: { generationParams: { rh_kling_o1_generation_mode: 'reference', keepOriginalSound: 'yes' } },
    }),
    {
      prompt: '<<<image_1>>> move',
      mode: 'pro',
      duration: '5',
      aspectRatio: '1:1',
      imageUrls: ['image'],
      videoUrl: 'video',
      keepOriginalSound: true,
    },
  );
  assert.deepEqual(
    runninghubKlingO1Video({
      currentBody: { prompt: 'edit', mode: 'pro', duration: 10, aspectRatio: '16:9' },
      inputVideos: ['video'],
      payload: { rh_kling_o1_generation_mode: 'edit', keepOriginalSound: true },
    }),
    {
      prompt: 'edit',
      mode: 'std',
      videoUrl: 'video',
      keepOriginalSound: true,
    },
  );
  assert.deepEqual(
    runninghubKlingO1Video({
      currentBody: { prompt: 'frames', mode: 'std', duration: 10 },
      inputImages: ['first', 'last'],
      payload: {},
    }),
    {
      prompt: 'frames',
      mode: 'std',
      duration: '10',
      aspectRatio: '9:16',
      firstImageUrl: 'first',
      lastImageUrl: 'last',
    },
  );
});

test('runningHubVideoResolvers: routes Kling V3 and O3 variants', () => {
  assert.equal(
    runninghubKlingV3VideoEndpoint({
      modelToken: 'kling-v3-turbo-pro',
      payload: {},
      inputImages: ['image'],
    }),
    'https://www.runninghub.cn/openapi/v2/kling-v3-turbo-pro/image-to-video',
  );
  assert.deepEqual(
    runninghubKlingV3Video({
      currentBody: { model: 'kling-v3.0-std', prompt: 'move', aspectRatio: '16:9' },
      inputImages: ['first', 'last'],
      payload: { model: 'kling-v3.0-std' },
    }),
    {
      model: 'kling-v3.0-std',
      prompt: 'move',
      firstImageUrl: 'first',
      lastImageUrl: 'last',
    },
  );

  assert.equal(
    runninghubKlingO3VideoEndpoint({
      payload: { resolution: 'pro', generationParams: { kling_v3_omni_mode: 'edit' } },
      inputVideos: ['video'],
    }),
    'https://www.runninghub.cn/openapi/v2/kling-video-o3-pro/video-edit',
  );
  assert.deepEqual(
    runninghubKlingO3Video({
      currentBody: { prompt: 'edit', aspectRatio: '16:9', duration: 5 },
      inputVideos: ['video'],
      payload: {
        resolution: 'pro',
        generationParams: { kling_v3_omni_mode: 'edit', keepOriginalSound: 'true' },
      },
      finalUrlsBySlot: { editRefImage: 'reference' },
    }),
    {
      prompt: 'edit',
      videoUrl: 'video',
      imageUrls: ['reference'],
      keepOriginalSound: true,
    },
  );
  assert.throws(
    () =>
      runninghubKlingO3Video({
        currentBody: { prompt: 'edit' },
        inputVideos: ['video'],
        payload: { resolution: '4k', generationParams: { kling_v3_omni_mode: 'edit' } },
      }),
    /4K does not support video edit/,
  );
});

test('runningHubVideoResolvers: routes Hailuo 2.3 and enforces image/video rules', () => {
  assert.equal(
    runninghubHailuo23VideoEndpoint({
      payload: { generationParams: { rh_hailuo_23_quality: 'fast' } },
      inputImages: ['image'],
    }),
    'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3-fast/image-to-video',
  );
  assert.equal(
    runninghubHailuo23VideoEndpoint({
      payload: { generationParams: { rh_hailuo_23_quality: 'pro' } },
      inputImages: [],
    }),
    'https://www.runninghub.cn/openapi/v2/minimax/hailuo-2.3/t2v-pro',
  );
  assert.deepEqual(
    runninghubHailuo23Video({
      currentBody: { prompt: 'move', duration: 10 },
      inputImages: ['image'],
      payload: { generationParams: { rh_hailuo_23_quality: 'fast' } },
    }),
    { prompt: 'move', duration: '10', imageUrl: 'image' },
  );
  assert.deepEqual(
    runninghubHailuo23Video({
      currentBody: { prompt: 'move', duration: 10 },
      payload: { generationParams: { rh_hailuo_23_quality: 'pro' } },
    }),
    { prompt: 'move' },
  );
  assert.throws(
    () =>
      runninghubHailuo23Video({
        currentBody: { prompt: 'move' },
        inputVideos: ['video'],
        payload: {},
      }),
    /does not accept video input/,
  );
});

test('runningHubVideoResolvers: routes Veo3 channels, modes, frames, and extension', () => {
  assert.equal(
    runninghubVeo3VideoEndpoint({
      payload: {
        generationParams: {
          rh_veo3_channel: 'official',
          mode: 'pro',
          generation_type: 'reference',
        },
      },
      inputImages: ['reference'],
    }),
    'https://www.runninghub.cn/openapi/v2/rhart-video-v3.1-pro-official/reference-to-video',
  );
  assert.deepEqual(
    runninghubVeo3Video({
      currentBody: { prompt: 'move', resolution: '4k', duration: 4 },
      inputImages: ['reference'],
      payload: {
        generationParams: {
          rh_veo3_channel: 'official',
          mode: 'pro',
          generation_type: 'reference',
        },
      },
    }),
    {
      prompt: 'move',
      resolution: '4k',
      imageUrls: ['reference'],
    },
  );
  assert.deepEqual(
    runninghubVeo3Video({
      currentBody: { prompt: 'extend', resolution: '1080p', duration: 8 },
      inputVideos: ['video'],
      payload: {
        generationParams: {
          rh_veo3_channel: 'official',
          mode: 'fast',
          generation_type: 'extend',
        },
      },
    }),
    {
      resolution: '1080p',
      video: 'video',
    },
  );
  assert.throws(
    () =>
      runninghubVeo3Video({
        currentBody: { prompt: 'extend' },
        inputVideos: ['video'],
        payload: {
          generationParams: {
            rh_veo3_channel: 'lowCost',
            mode: 'fast',
            generation_type: 'extend',
          },
        },
      }),
    /only supports official Fast or Pro/,
  );
});

test('runningHubVideoResolvers: routes Wan 2.7 reference, edit, image, and extend modes', () => {
  assert.equal(
    runninghubWan27VideoEndpoint({
      payload: { wan27_mode: 'reference' },
      inputImages: ['reference'],
    }),
    'https://www.runninghub.cn/openapi/v2/alibaba/wan-2.7/reference-to-video',
  );
  assert.deepEqual(
    runninghubWan27Video({
      currentBody: { prompt: 'edit' },
      inputVideos: ['video'],
      inputImages: ['reference'],
      payload: { wan27_mode: 'edit' },
    }),
    {
      prompt: 'edit',
      videoUrl: 'video',
      imageUrls: ['reference'],
    },
  );
  assert.deepEqual(
    runninghubWan27Video({
      currentBody: { prompt: 'frames', aspectRatio: '16:9' },
      inputImages: ['first', 'last'],
      payload: {},
    }),
    {
      prompt: 'frames',
      firstImageUrl: 'first',
      lastImageUrl: 'last',
    },
  );
  assert.deepEqual(
    runninghubWan27Video({
      currentBody: { prompt: 'extend' },
      inputVideos: ['video'],
      payload: { wan27_mode: 'video' },
    }),
    {
      prompt: 'extend',
      videoUrl: 'video',
    },
  );
  assert.throws(
    () =>
      runninghubWan27Video({
        currentBody: { prompt: 'reference' },
        inputImages: ['image'],
        inputAudios: ['audio'],
        payload: { wan27_mode: 'reference' },
      }),
    /does not accept audio input/,
  );
});
