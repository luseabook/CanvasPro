import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildChatCompletionsStructuredOutput,
  buildResponsesStructuredOutput,
  buildTextStructuredOutputSystemPrompt,
  getTextStructuredOutputRequestMeta,
  normalizeTextStructuredOutput,
  shouldFallbackTextStructuredOutput,
} from './textStructuredOutput.js';

const schema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
  additionalProperties: false,
};

test('textStructuredOutput: normalizes schema configuration and defaults', () => {
  assert.equal(normalizeTextStructuredOutput(null), null);
  assert.deepEqual(normalizeTextStructuredOutput({ name: ' answer ', schema, fallback: 'prompt' }), {
    name: 'answer',
    schema,
    strict: true,
    fallback: 'prompt',
  });
  assert.deepEqual(
    normalizeTextStructuredOutput({ name: 'answer', schema, strict: false, fallback: 'other' }),
    {
      name: 'answer',
      schema,
      strict: false,
      fallback: 'none',
    },
  );
  assert.throws(() => normalizeTextStructuredOutput({ name: 'bad name', schema }));
  assert.throws(() => normalizeTextStructuredOutput({ name: 'answer' }), /JSON Schema/);
});

test('textStructuredOutput: builds chat, responses, prompt, and metadata contracts', () => {
  const output = { name: 'answer', schema, fallback: 'prompt' };

  assert.deepEqual(buildChatCompletionsStructuredOutput(output), {
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'answer',
        strict: true,
        schema,
      },
    },
  });
  assert.deepEqual(buildChatCompletionsStructuredOutput(output, { mode: 'json_object' }), {
    response_format: { type: 'json_object' },
  });
  assert.deepEqual(buildChatCompletionsStructuredOutput(output, { mode: 'none' }), {});

  assert.deepEqual(buildResponsesStructuredOutput(output), {
    text: {
      format: {
        type: 'json_schema',
        name: 'answer',
        strict: true,
        schema,
      },
    },
  });

  assert.equal(buildTextStructuredOutputSystemPrompt('system', output), 'system');
  const prompt = buildTextStructuredOutputSystemPrompt('system', output, {
    mode: 'json_object',
  });
  assert.match(prompt, /STRUCTURED OUTPUT CONTRACT/);
  assert.match(prompt, /"answer"/);
  assert.deepEqual(getTextStructuredOutputRequestMeta(output), {
    name: 'answer',
    fallback: 'prompt',
  });
  assert.deepEqual(getTextStructuredOutputRequestMeta(output, { mode: 'json_object' }), {
    name: 'answer',
    fallback: 'prompt',
    mode: 'json_object',
  });
});

test('textStructuredOutput: enables prompt fallback only for unsupported schema errors', () => {
  assert.equal(shouldFallbackTextStructuredOutput({ fallback: 'prompt' }, 400), true);
  assert.equal(shouldFallbackTextStructuredOutput({ fallback: 'prompt' }, 422), true);
  assert.equal(shouldFallbackTextStructuredOutput({ fallback: 'prompt' }, 429), false);
  assert.equal(shouldFallbackTextStructuredOutput({ fallback: 'none' }, 400), false);
});
