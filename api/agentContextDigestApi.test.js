import test from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_CONTEXT_DIGEST_SYSTEM_PROMPT, requestAgentContextDigest } from './agentContextDigestApi.js';

test('agentContextDigestApi: returns the existing digest when there are no new messages', async () => {
  let called = false;
  const result = await requestAgentContextDigest({
    existingDigest: { goal: 'Ship', pending: ['test'] },
    messages: [],
    request: async () => {
      called = true;
    },
  });

  assert.equal(called, false);
  assert.equal(result.goal, 'Ship');
  assert.deepEqual(result.pending, ['test']);
});

test('agentContextDigestApi: builds and parses a context digest request', async () => {
  const calls = [];
  const traces = [];
  const result = await requestAgentContextDigest({
    existingDigest: { goal: 'Old goal', decisions: ['Keep API stable'] },
    messages: [
      { role: 'user', content: 'New goal', status: 'sent' },
      { role: 'assistant', content: 'Working on it' },
    ],
    projectMemory: { preferences: ['Use concise names'] },
    settings: {
      model: 'model-1',
      provider: 'provider-1',
      providerProfileId: 'profile-1',
      locale: 'en-US',
    },
    signal: { aborted: false },
    onTrace: (event) => traces.push(event),
    request: async (params) => {
      calls.push(params);
      return {
        goal: 'New goal',
        constraints: ['Fast'],
        decisions: ['Use JSON'],
        completed: ['Scoped'],
        pending: ['Implement'],
      };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'model-1');
  assert.equal(calls[0].provider, 'provider-1');
  assert.equal(calls[0].providerProfileId, 'profile-1');
  assert.equal(calls[0].systemPrompt, AGENT_CONTEXT_DIGEST_SYSTEM_PROMPT);
  assert.equal(calls[0].temperature, 0);
  assert.equal(calls[0].signal.aborted, false);
  assert.equal(calls[0].structuredOutput.name, 'agent_context_digest');

  const prompt = JSON.parse(calls[0].prompt);
  assert.equal(prompt.languagePolicy, 'Write digest values in English.');
  assert.equal(prompt.existingDigest.goal, 'Old goal');
  assert.deepEqual(prompt.projectMemory.preferences, ['Use concise names']);
  assert.deepEqual(prompt.newMessages, [
    { role: 'user', content: 'New goal', status: 'sent' },
    { role: 'assistant', content: 'Working on it' },
  ]);
  assert.deepEqual(traces, [
    {
      type: 'agent_context_digest_model_selected',
      provider: 'provider-1',
      model: 'model-1',
    },
  ]);
  assert.equal(result.goal, 'New goal');
  assert.deepEqual(result.pending, ['Implement']);
});

test('agentContextDigestApi: retries invalid JSON once with a repair prompt', async () => {
  const calls = [];
  const traces = [];
  const valid = JSON.stringify({
    goal: 'Recovered',
    constraints: [],
    decisions: [],
    completed: [],
    pending: [],
  });
  let attempt = 0;

  const result = await requestAgentContextDigest({
    existingDigest: { goal: 'Old' },
    messages: [{ role: 'user', content: 'Continue' }],
    settings: { model: 'm', provider: 'p' },
    onTrace: (event) => traces.push(event),
    request: async (params) => {
      calls.push(params);
      attempt += 1;
      return attempt === 1 ? 'not-json' : valid;
    },
  });

  assert.equal(calls.length, 2);
  const retryPrompt = JSON.parse(calls[1].prompt);
  assert.equal(retryPrompt.retry.previousAttemptRejected, true);
  assert.match(retryPrompt.retry.instruction, /corrected strict JSON/);
  assert.equal(traces[1].type, 'agent_context_digest_json_retry');
  assert.equal(result.goal, 'Recovered');
});

test('agentContextDigestApi: requires a configured model and provider', async () => {
  await assert.rejects(
    requestAgentContextDigest({
      messages: [{ role: 'user', content: 'hello' }],
      settings: {},
    }),
    /not configured/,
  );
});
