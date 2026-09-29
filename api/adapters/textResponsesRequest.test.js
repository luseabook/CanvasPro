import test from 'node:test';
import assert from 'node:assert/strict';

import { buildTextResponsesBody, selectTextMediaExecution } from './textResponsesRequest.js';

test('textResponsesRequest: selects video chat-completion only when video input is resolved', () => {
  const manifest = {
    provider: 'provider-1',
    extensions: {
      videoChatCompletion: {
        endpoint: '/chat/completions',
        responseMapping: { text: 'choices.0.message.content' },
        structuredOutputMode: 'json_object',
      },
      chatCompletionInputPolicy: 'video',
      maxOutputTokens: 500,
    },
  };

  assert.equal(
    selectTextMediaExecution(
      manifest,
      { inputVideoUrls: ['video'] },
      {
        resolveChatCompletionInputUrls: () => ({ inputVideoUrls: [] }),
      },
    ),
    manifest,
  );

  const selected = selectTextMediaExecution(
    manifest,
    { inputVideoUrls: ['video'], maxOutputTokens: 100 },
    {
      resolveChatCompletionInputUrls: () => ({ inputVideoUrls: ['video'] }),
    },
  );
  assert.equal(selected.endpoint, '/chat/completions');
  assert.equal(selected.endpointMode, 'chat-completion');
  assert.equal(selected.extensions.structuredOutputMode, 'json_object');
  assert.notEqual(selected, manifest);

  assert.throws(
    () =>
      selectTextMediaExecution(
        manifest,
        { inputVideoUrls: ['video'], webSearch: true },
        {
          resolveChatCompletionInputUrls: () => ({ inputVideoUrls: ['video'] }),
        },
      ),
    /视频理解/,
  );
});

test('textResponsesRequest: builds image-url Responses payloads with tools and thinking', async () => {
  let contentCall;
  const body = await buildTextResponsesBody({
    executionManifest: {
      extensions: {
        responsesInputFormat: 'image-url',
        maxOutputTokens: 1000,
        webSearchTools: [{ type: 'web_search_preview' }],
        imageSearchTools: {
          on: { type: 'image_search', requiresImage: true },
        },
        imageSearchInstructions: 'Search carefully',
      },
    },
    payload: {
      systemPrompt: 'System',
      webSearch: true,
      imageSearch: 'on',
    },
    finalPrompt: 'Describe',
    apiKey: 'key',
    provider: 'provider-1',
    modelToken: 'model-1',
    cfg: { apiUrl: 'https://api.test' },
    ctx: {
      resolveChatCompletionInputUrls() {
        return {
          inputImageUrls: ['https://img.test/a.png'],
          inputVideoUrls: [],
        };
      },
      async buildChatCompletionUserContent(prompt, inputUrls, apiKey, provider, options) {
        contentCall = { prompt, inputUrls, apiKey, provider, options };
        return [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: inputUrls.inputImageUrls[0] } },
        ];
      },
    },
    maxOutputTokens: 100,
    thinkingType: 'enabled',
    thinkingControlMode: 'thinking',
  });

  assert.deepEqual(body, {
    apiKey: 'key',
    model: 'model-1',
    stream: false,
    instructions: 'System\n\nSearch carefully',
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Describe' },
          { type: 'input_image', image_url: 'https://img.test/a.png' },
        ],
      },
    ],
    tools: [{ type: 'web_search_preview' }, { type: 'image_search' }],
    max_output_tokens: 100,
    thinking: { type: 'enabled' },
  });
  assert.deepEqual(contentCall.inputUrls, {
    inputImageUrls: ['https://img.test/a.png'],
    inputVideoUrls: [],
  });
  assert.equal(contentCall.options.strictUpload, true);
  assert.equal(contentCall.options.baseUrl, 'https://api.test');
});

test('textResponsesRequest: rejects unsupported input parts and excessive output limits', async () => {
  await assert.rejects(
    () =>
      buildTextResponsesBody({
        executionManifest: { extensions: { responsesInputFormat: 'image-url', maxOutputTokens: 100 } },
        payload: {},
        finalPrompt: 'Prompt',
        apiKey: 'key',
        provider: 'provider-1',
        modelToken: 'model-1',
        cfg: { apiUrl: 'https://api.test' },
        ctx: {
          async buildChatCompletionUserContent() {
            return [{ type: 'audio_url', audio_url: { url: 'https://audio.test/a.mp3' } }];
          },
        },
      }),
    /Unsupported Responses input part/,
  );

  await assert.rejects(
    () =>
      buildTextResponsesBody({
        executionManifest: { extensions: { responsesInputFormat: 'image-url', maxOutputTokens: 100 } },
        payload: {},
        finalPrompt: 'Prompt',
        apiKey: 'key',
        provider: 'provider-1',
        modelToken: 'model-1',
        cfg: { apiUrl: 'https://api.test' },
        ctx: {
          async buildChatCompletionUserContent() {
            return 'Prompt';
          },
        },
        maxOutputTokens: 101,
      }),
    /100 tokens/,
  );
});
