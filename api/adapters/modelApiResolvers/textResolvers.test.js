import test from 'node:test';
import assert from 'node:assert/strict';

import { runninghubLlmChatEndpoint } from './textResolvers.js';

test('textResolvers: exposes the RunningHub LLM chat endpoint', () => {
  assert.equal(runninghubLlmChatEndpoint(), 'https://llm.runninghub.cn/v1/chat/completions');
});
