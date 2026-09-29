import test from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_SKILL_AUTHORING_SYSTEM_PROMPT, requestAgentSkillDraft } from './agentSkillAuthoringApi.js';

test('agentSkillAuthoringApi: builds an authoring request for update operations', async () => {
  const calls = [];
  const traces = [];
  const expected = {
    status: 'ready',
    reply: 'Updated',
    question: '',
    definition: {
      id: 'writer',
      title: 'Writer',
      description: 'Writes clear copy',
      triggers: ['write'],
      instructions: 'Write clearly.',
    },
  };

  const result = await requestAgentSkillDraft({
    message: 'Make it concise',
    originalMessage: 'Create a writer',
    clarificationAnswer: 'Short',
    history: [
      { role: 'assistant', reply: 'What tone?' },
      { role: 'user', content: 'Professional' },
    ],
    existingSkills: [{ id: 'writer', title: 'Writer' }],
    settings: { model: 'm', provider: 'p', providerProfileId: 'profile', locale: 'en-US' },
    operation: 'update',
    targetSkill: {
      id: 'writer',
      title: 'Writer',
      description: 'Existing',
      triggers: ['write'],
      instructions: 'Old instructions',
    },
    onTrace: (event) => traces.push(event),
    request: async (params) => {
      calls.push(params);
      return expected;
    },
  });

  assert.equal(result, expected);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].model, 'm');
  assert.equal(calls[0].provider, 'p');
  assert.equal(calls[0].providerProfileId, 'profile');
  assert.equal(calls[0].systemPrompt, AGENT_SKILL_AUTHORING_SYSTEM_PROMPT);
  assert.equal(calls[0].temperature, 0.2);
  assert.equal(calls[0].structuredOutput.name, 'agent_skill_draft');

  const prompt = JSON.parse(calls[0].prompt);
  assert.equal(prompt.operation, 'update');
  assert.equal(prompt.originalRequest, 'Create a writer');
  assert.equal(prompt.userMessage, 'Make it concise');
  assert.equal(prompt.clarificationAnswer, 'Short');
  assert.equal(prompt.targetSkill.id, 'writer');
  assert.deepEqual(prompt.history, [
    { role: 'assistant', content: 'What tone?' },
    { role: 'user', content: 'Professional' },
  ]);
  assert.deepEqual(traces, [
    {
      type: 'agent_skill_authoring_model_selected',
      channel: 'skill.authoring',
      provider: 'p',
      model: 'm',
    },
  ]);
});

test('agentSkillAuthoringApi: retries invalid JSON with a repair reason', async () => {
  const calls = [];
  const traces = [];
  let attempt = 0;
  const valid = JSON.stringify({
    status: 'need_clarification',
    reply: 'Need details',
    question: 'What should it do?',
    definition: {
      id: 'skill',
      title: 'Skill',
      description: '',
      triggers: [],
      instructions: '',
    },
  });

  const result = await requestAgentSkillDraft({
    message: 'Create a skill',
    settings: { model: 'm', provider: 'p' },
    onTrace: (event) => traces.push(event),
    request: async (params) => {
      calls.push(params);
      attempt += 1;
      return attempt === 1 ? 'not-json' : valid;
    },
  });

  assert.equal(result.status, 'need_clarification');
  assert.equal(calls.length, 2);
  const retryPrompt = JSON.parse(calls[1].prompt);
  assert.equal(retryPrompt.retry.previousAttemptRejected, true);
  assert.match(retryPrompt.retry.reason, /invalid JSON/);
  assert.equal(traces[1].type, 'agent_skill_authoring_json_retry');
});

test('agentSkillAuthoringApi: requires a configured model and provider', async () => {
  await assert.rejects(requestAgentSkillDraft({ message: 'hello' }), /not configured/);
});
