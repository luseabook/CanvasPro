import test from 'node:test';
import assert from 'node:assert/strict';

import {
  apimartQwenTextExecutionManifests,
  apimartQwenTextModelManifests,
} from './apimartQwenTextManifests.js';

test('apimartQwenTextManifests: exports the Qwen model catalog', () => {
  assert.equal(apimartQwenTextModelManifests.length, 5);
  assert.deepEqual(
    apimartQwenTextModelManifests.map((model) => model.modelId),
    [
      'apimart/qwen3.8-max',
      'apimart/qwen3.8-max-0902',
      'apimart/qwen3.8-flash',
      'apimart/qwen3.8-27b',
      'apimart/qwen3.8-2.4t-a95b',
    ],
  );
  assert.equal(apimartQwenTextModelManifests[0].executionId, 'apimart.model-api.text.qwen3-8-max.v1');
  assert.equal(apimartQwenTextModelManifests[0].uiSchema.fields.length, 3);
  assert.equal(apimartQwenTextModelManifests[1].uiSchema.fields.length, 0);
});

test('apimartQwenTextManifests: selects responses only for web-search models', () => {
  assert.equal(apimartQwenTextExecutionManifests.length, 5);
  const [maxExecution, , flashExecution] = apimartQwenTextExecutionManifests;

  assert.equal(maxExecution.endpoint, '/v1/responses');
  assert.equal(maxExecution.endpointMode, 'responses');
  assert.equal(flashExecution.endpoint, '/v1/chat/completions');
  assert.equal(flashExecution.endpointMode, 'chat-completion');
  assert.equal(flashExecution.extensions.thinkingControlMode, 'enable_thinking');
  assert.deepEqual(maxExecution.extensions.webSearchTools, [
    { type: 'web_search' },
    { type: 'web_extractor' },
  ]);
});
