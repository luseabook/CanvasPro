import test from 'node:test';
import assert from 'node:assert/strict';

import { buildChatCompletionThinkingOptions } from './textThinkingControl.js';

test('textThinkingControl: maps OpenAI reasoning effort values', () => {
  assert.deepEqual(
    buildChatCompletionThinkingOptions({ reasoningEffort: ' HIGH ' }, { reasoningEffortMode: 'openai' }),
    { reasoning_effort: 'high' },
  );
  assert.deepEqual(
    buildChatCompletionThinkingOptions({ reasoning_effort: 'minimal' }, { reasoningEffortMode: 'openai' }),
    { reasoning_effort: 'minimal' },
  );
  assert.deepEqual(
    buildChatCompletionThinkingOptions({ thinking: { type: 'disabled' } }, { reasoningEffortMode: 'openai' }),
    { reasoning_effort: 'minimal' },
  );
  assert.deepEqual(
    buildChatCompletionThinkingOptions({ thinking: { type: 'enabled' } }, { reasoningEffortMode: 'openai' }),
    { reasoning_effort: 'medium' },
  );
  assert.deepEqual(buildChatCompletionThinkingOptions({}, { reasoningEffortMode: 'openai' }), {});
});

test('textThinkingControl: maps provider-specific thinking controls', () => {
  assert.deepEqual(
    buildChatCompletionThinkingOptions(
      { thinking: { type: 'enabled' } },
      { thinkingControlMode: 'enable_thinking' },
    ),
    { enable_thinking: true },
  );
  assert.deepEqual(
    buildChatCompletionThinkingOptions(
      { thinking: { type: 'disabled' } },
      { thinkingControlMode: 'enable_thinking' },
    ),
    { enable_thinking: false },
  );
  assert.deepEqual(
    buildChatCompletionThinkingOptions(
      { thinking: { type: 'enabled' } },
      { thinkingControlMode: 'thinking' },
    ),
    { thinking: { type: 'enabled' } },
  );
  assert.deepEqual(buildChatCompletionThinkingOptions({ thinking: { type: 'enabled' } }), {});
});
