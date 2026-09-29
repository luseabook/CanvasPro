import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRunningHubPriceRequest } from './runningHubPriceRequest.js';

const bodyMapping = [
  { path: 'model', from: 'model' },
  { path: 'prompt', from: 'prompt' },
  { path: 'image', from: 'inputImages', omitWhenEmpty: true },
  { path: 'video', from: 'inputVideos', omitWhenEmpty: true },
];

test('runningHubPriceRequest: maps video references and removes their raw URLs from the body', async () => {
  const result = await buildRunningHubPriceRequest({
    baseUrl: 'https://rh.test/',
    kind: 'video',
    params: { prompt: 'animate', model: 'base-model' },
    references: [
      { type: 'image', url: 'https://cdn.test/start.png', refSlot: 'start' },
      { type: 'video', url: 'https://cdn.test/source.mp4' },
    ],
    resolved: {
      modelManifest: { kind: 'video', modelId: 'video-manifest' },
      executionManifest: {
        id: 'exec-video-price',
        model: 'base-model',
        endpoint: '/price',
        bodyMapping,
      },
    },
  });

  assert.deepEqual(result, {
    body: {
      apiUrl: 'https://rh.test/price',
      model: 'base-model',
      prompt: 'animate',
      image: [],
      video: [],
    },
  });
});

test('runningHubPriceRequest: resolves mode-specific model tokens', async () => {
  const result = await buildRunningHubPriceRequest({
    baseUrl: 'https://rh.test',
    kind: 'image',
    params: { prompt: 'draw', mode: 'fast' },
    references: [],
    resolved: {
      modelManifest: { kind: 'image', modelId: 'image-manifest' },
      executionManifest: {
        id: 'exec-image-price',
        model: 'base-model',
        modeModels: { fast: { default: 'fast-model' } },
        endpoint: '/price',
        bodyMapping,
      },
    },
  });

  assert.deepEqual(result, {
    body: {
      apiUrl: 'https://rh.test/price',
      model: 'fast-model',
      prompt: 'draw',
    },
  });
});
