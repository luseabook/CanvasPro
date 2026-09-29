import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BAILIAN_TEXT_OUTPUT_TOKENS_FIELD,
  bailianTextExecutionManifests,
  bailianTextModelManifests,
} from './bailianTextModelApiManifests.js';

test('bailianTextModelApiManifests: exports the Bailian text catalog', () => {
  assert.equal(bailianTextModelManifests.length, 14);
  assert.equal(BAILIAN_TEXT_OUTPUT_TOKENS_FIELD.defaultValue, 8192);
  assert.deepEqual(
    BAILIAN_TEXT_OUTPUT_TOKENS_FIELD.options.map((option) => option.value),
    [4096, 8192, 16384, 32768],
  );

  const qwen38 = bailianTextModelManifests[0];
  const qwen37 = bailianTextModelManifests.find((model) => model.modelId.endsWith('/qwen3.7-max'));
  assert.deepEqual(
    qwen38.uiSchema.fields.map((field) => field.id),
    ['reasoningEffort', 'webSearch', 'maxOutputTokens'],
  );
  assert.deepEqual(
    qwen37.uiSchema.fields.map((field) => field.id),
    ['enableThinking', 'webSearch', 'maxOutputTokens'],
  );
});

test('bailianTextModelApiManifests: maps chat completion parameters', () => {
  assert.equal(bailianTextExecutionManifests.length, 14);
  const [execution] = bailianTextExecutionManifests;

  assert.equal(execution.endpoint, '/compatible-mode/v1/chat/completions');
  assert.equal(execution.extensions.streaming, true);
  assert.equal(execution.extensions.chatCompletionBodyMapping[0].path, 'enable_search');
  assert.equal(execution.extensions.chatCompletionBodyMapping[1].path, 'reasoning_effort');
  assert.deepEqual(execution.result.textFields, ['choices[].message.content']);
});
