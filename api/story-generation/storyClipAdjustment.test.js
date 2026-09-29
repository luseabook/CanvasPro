import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStoryClipAdjustmentApi,
  STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION,
} from './storyClipAdjustment.js';

function createApi(overrides = {}) {
  return createStoryClipAdjustmentApi({
    generateText: async () => '',
    parseStrictJson: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    normalizeText: (value) => String(value ?? '').trim(),
    normalizePositiveNumber: (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? number : 0;
    },
    getResultText: (value) => value,
    assertPlanningModel: () => {},
    buildStoryTextProviderProfilePayload: () => ({}),
    requestStrictResult: async ({ parse }) =>
      parse(JSON.stringify({ candidateText: 'replacement' })),
    requestTimeoutMs: 0,
    ...overrides,
  });
}

test('storyClipAdjustment builds a normalized adjustment prompt', () => {
  const api = createApi();
  const prompt = JSON.parse(
    api.buildStoryClipAdjustmentPrompt({
      scope: 'invalid',
      instruction: 'Make it clearer',
      currentPrompt: 'A wide shot',
      preserveAssetRefs: true,
      preserveDuration: false,
      lockedAssetTokens: [' @hero ', '@room', '@hero'],
      duration: '8s',
      maxDurationSeconds: '6.6',
      context: {
        sourceMode: 'video-replication',
        targetLocale: 'en',
        sourceLanguage: 'ja',
        episodeNumber: 0,
      },
    }),
  );

  assert.equal(prompt.schemaVersion, STORY_CLIP_ADJUSTMENT_SCHEMA_VERSION);
  assert.equal(prompt.scope, 'prompt');
  assert.deepEqual(prompt.locked.assetTokens, ['@hero', '@room']);
  assert.equal(prompt.locked.preserveAssetRefs, true);
  assert.equal(prompt.locked.preserveDuration, false);
  assert.equal(prompt.timing.maxDurationSeconds, 6.6);
  assert.equal(prompt.timing.allowReallocation, true);
  assert.equal(prompt.context.episodeNumber, 1);
});

test('storyClipAdjustment sanitizes parsed output and replaces a selection', async () => {
  const api = createApi({
    requestStrictResult: async ({ parse }) =>
      parse(JSON.stringify({ candidateText: '<b>tightened</b>' })),
  });

  const parsed = api.parseStoryClipAdjustmentResult({
    candidateText: '<p>Hello <b>world</b></p>',
    candidateDurationSeconds: '3.7',
  });
  assert.equal(parsed.candidateText, 'Hello world');
  assert.equal(parsed.candidateDurationSeconds, 3.7);

  const result = await api.adjustStoryClipPrompt({
    instruction: 'Replace the selected text',
    currentPrompt: 'before selected after',
    selection: { start: 7, end: 15, text: 'selected' },
    scope: 'selection',
    model: 'model',
    provider: 'provider',
  });
  assert.equal(result.scope, 'selection');
  assert.equal(result.candidateText, 'before tightened after');
  assert.equal(result.replacementText, 'tightened');
});
