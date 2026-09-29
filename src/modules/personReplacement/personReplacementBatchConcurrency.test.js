import test from 'node:test';
import assert from 'node:assert/strict';

import { resolvePersonReplacementCharacterImageBatchConcurrency } from './personReplacementBatchConcurrency.js';

test('personReplacementBatchConcurrency caps non-RunningHub character image batches', () => {
  assert.equal(
    resolvePersonReplacementCharacterImageBatchConcurrency({
      targetCount: 8,
      modelId: 'missing-model',
      provider: 'openai',
    }),
    2,
  );
  assert.equal(
    resolvePersonReplacementCharacterImageBatchConcurrency({
      targetCount: 0,
      modelId: 'missing-model',
      provider: 'openai',
    }),
    1,
  );
});

test('personReplacementBatchConcurrency honors RunningHub workflow target counts', () => {
  assert.equal(
    resolvePersonReplacementCharacterImageBatchConcurrency({
      targetCount: '7.9',
      modelId: 'missing-model',
      provider: 'runninghubwf',
      providerProfileId: 'profile-a',
    }),
    7,
  );
  assert.equal(
    resolvePersonReplacementCharacterImageBatchConcurrency({
      targetCount: -4,
      provider: 'runninghubwf',
    }),
    1,
  );
});
