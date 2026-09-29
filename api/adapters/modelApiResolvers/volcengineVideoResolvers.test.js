import test from 'node:test';
import assert from 'node:assert/strict';

import { volcengineSeedance2Video } from './volcengineVideoResolvers.js';

test('volcengineVideoResolvers: normalizes text mode request fields', () => {
  const result = volcengineSeedance2Video({
    currentBody: {
      model: 'seedance-2',
      prompt: 'A calm lake',
      resolution: '720p',
      ratio: '16:9',
      duration: 5,
      generate_audio: true,
      watermark: false,
    },
    payload: {},
    finalPrompt: 'A calm lake',
    modelToken: 'seedance-2',
    executionManifest: { extensions: { seedanceVideo: {} } },
  });

  assert.deepEqual(result, {
    model: 'seedance-2',
    content: [{ type: 'text', text: 'A calm lake' }],
    resolution: '720p',
    ratio: '16:9',
    duration: 5,
    generate_audio: true,
    watermark: false,
  });
});

test('volcengineVideoResolvers: builds first and last frame content without duplicates', () => {
  const result = volcengineSeedance2Video({
    currentBody: {
      prompt: 'Animate',
      resolution: '720p',
      ratio: '16:9',
      duration: 5,
    },
    payload: { dreaminaRouteMode: 'frames2video' },
    finalPrompt: 'Animate',
    inputImages: ['first.png', 'last.png'],
    finalUrlsBySlot: {
      firstFrame: ['first.png'],
      lastFrame: ['last.png'],
    },
    modelToken: 'seedance-2',
    executionManifest: { extensions: { seedanceVideo: {} } },
  });

  assert.deepEqual(result.content, [
    { type: 'text', text: 'Animate' },
    {
      type: 'image_url',
      image_url: { url: 'first.png' },
      role: 'first_frame',
    },
    {
      type: 'image_url',
      image_url: { url: 'last.png' },
      role: 'last_frame',
    },
  ]);
});

test('volcengineVideoResolvers: maps multimodal reference roles and enforces limits', () => {
  const result = volcengineSeedance2Video({
    currentBody: {
      prompt: 'Reference this',
      resolution: '720p',
      ratio: 'auto',
      duration: 6,
    },
    payload: { dreaminaRouteMode: 'reference' },
    finalPrompt: 'Reference this',
    inputImages: ['image.png'],
    inputVideos: ['video.mp4'],
    inputAudios: ['audio.mp3'],
    finalUrlsBySlot: { referenceImage: ['reference.png'] },
    modelToken: 'seedance-2',
    executionManifest: {
      extensions: {
        seedanceVideo: {
          maxImageCount: 2,
          maxVideoReferenceCount: 1,
          maxAudioReferenceCount: 1,
          allowAudioOnlyReferences: true,
        },
      },
    },
  });

  assert.deepEqual(result.content, [
    { type: 'text', text: 'Reference this' },
    {
      type: 'image_url',
      image_url: { url: 'reference.png' },
      role: 'reference_image',
    },
    {
      type: 'image_url',
      image_url: { url: 'image.png' },
      role: 'reference_image',
    },
    {
      type: 'video_url',
      video_url: { url: 'video.mp4' },
      role: 'reference_video',
    },
    {
      type: 'audio_url',
      audio_url: { url: 'audio.mp3' },
      role: 'reference_audio',
    },
  ]);

  assert.throws(
    () =>
      volcengineSeedance2Video({
        currentBody: { prompt: 'Text only', ratio: '16:9', duration: 5 },
        payload: { dreaminaRouteMode: 'text2video' },
        finalPrompt: 'Text only',
        inputImages: ['image.png'],
        modelToken: 'seedance-2',
        executionManifest: { extensions: { seedanceVideo: {} } },
      }),
    /does not accept media input/,
  );
});
