import test from 'node:test';
import assert from 'node:assert/strict';

import { AGENT_ASSISTANT_SYSTEM_PROMPT, requestAgentAssistantReply } from './agentAssistantApi.js';

test('agentAssistantApi: requires provider and model settings', async () => {
  await assert.rejects(() => requestAgentAssistantReply({ message: 'hello' }), /not configured/);
  await assert.rejects(
    () => requestAgentAssistantReply({ message: 'hello', settings: { provider: 'provider-1' } }),
    /not configured/,
  );
});

test('agentAssistantApi: builds prompt context, traces skills, and normalizes the reply', async () => {
  let requestParams = null;
  const traceEvents = [];
  const streamed = [];
  const reply = [
    'Draft answer.',
    '```agent-choice',
    JSON.stringify({
      question: 'Choose a direction',
      options: [
        { id: 'a', label: 'First' },
        { id: 'b', label: 'Second' },
      ],
    }),
    '```',
  ].join('\n');

  const result = await requestAgentAssistantReply({
    message: 'Continue the story',
    context: {
      skills: [
        {
          id: 'story',
          title: 'Story',
          description: 'Story guidance',
          instructions: 'Keep continuity.',
          source: 'project',
        },
      ],
      canvas: {
        projectId: 'project-1',
        selectedNodeIds: ['node-1'],
        nodes: [{ id: 'node-1', type: 'text', contentPreview: 'Opening line' }],
      },
    },
    history: [{ role: 'user', content: 'Continue the story' }],
    settings: {
      provider: 'provider-1',
      model: 'model-1',
      providerProfileId: 'profile-1',
      temperature: 0.2,
      locale: 'en-US',
    },
    externalInformation: {
      sources: [
        {
          sourceKind: 'url',
          finalUrl: 'https://source.test/article',
          content: 'Source fact',
        },
      ],
    },
    request: async (params) => {
      requestParams = params;
      return { text: reply };
    },
    onTrace: (event) => traceEvents.push(event),
    onText: (text) => streamed.push(text),
  });

  const prompt = JSON.parse(requestParams.prompt);
  assert.equal(requestParams.provider, 'provider-1');
  assert.equal(requestParams.model, 'model-1');
  assert.equal(requestParams.providerProfileId, 'profile-1');
  assert.equal(requestParams.temperature, 0.2);
  assert.equal(requestParams.systemPrompt, AGENT_ASSISTANT_SYSTEM_PROMPT);
  assert.deepEqual(prompt.history, []);
  assert.deepEqual(prompt.canvas.selectedNodeIds, ['node-1']);
  assert.equal(prompt.skills[0].id, 'story');
  assert.equal(prompt.externalInformation[0].finalUrl, 'https://source.test/article');
  assert.equal(traceEvents[0].type, 'agent_response_channel_selected');
  assert.equal(traceEvents[1].type, 'agent_skill_context_injected');
  assert.equal(result.status, 'chat');
  assert.equal(result.question, 'Choose a direction');
  assert.match(result.reply, /Draft answer/);
  assert.match(result.reply, /Choose a direction/);
  assert.match(result.reply, /https:\/\/source\.test\/article/);

  requestParams.onText('plain text');
  assert.deepEqual(streamed, ['plain text']);
});

test('agentAssistantApi: rejects empty assistant output', async () => {
  await assert.rejects(
    () =>
      requestAgentAssistantReply({
        message: 'hello',
        settings: { provider: 'provider-1', model: 'model-1' },
        request: async () => ({ text: '' }),
      }),
    /empty text/,
  );
});
