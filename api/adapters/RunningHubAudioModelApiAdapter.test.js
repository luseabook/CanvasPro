import test from 'node:test';
import assert from 'node:assert/strict';

import { registerManifestBundle } from '../../src/manifests/index.js';
import {
  createRunningHubAudioCatalogEntry,
  paramMapping,
  slotMapping,
} from '../../src/manifests/audio/modelApi/runningHubAudioCatalogShared.js';
import {
  buildRunningHubCatalogRequest,
  prepareRunningHubCatalogRequest,
} from './RunningHubAudioModelApiAdapter.js';

function createPreparationExecution(id, name, endpoint) {
  return {
    schemaVersion: '1.0',
    id,
    provider: 'runninghub',
    kind: 'text',
    adapterType: 'modelApi',
    endpoint,
    model: endpoint.replace('/openapi/v2/', ''),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    bodyMapping: [],
    responseMapping: {
      taskIdPath: 'taskId',
      statusPath: 'status',
      errorPath: ['errorMessage'],
      resultPaths: ['results[].text'],
    },
    result: { taskIdPath: 'taskId', textFields: ['results[].text'] },
    extensions: { audioPreparation: name },
  };
}

let catalogSequence = 0;

function createCatalog(preparations = []) {
  catalogSequence += 1;
  const id = 'audio-adapter-contract-' + catalogSequence;
  return createRunningHubAudioCatalogEntry({
    id,
    name: 'Audio adapter contract',
    endpoint: '/openapi/v2/audio-contract',
    docId: id,
    fields: [
      { id: 'style', label: '风格', type: 'text', defaultValue: 'pop' },
      {
        id: 'voiceMode',
        label: '声音模式',
        type: 'segmented',
        defaultValue: 'default',
        options: [
          { value: 'default', label: '默认' },
          { value: 'custom', label: '自定义' },
        ],
      },
      { id: 'customVoice', label: '自定义声音', type: 'text', defaultValue: 'none' },
    ],
    slots: [{ id: 'audioRef', kind: 'audio', label: '参考音频', required: false }],
    promptField: 'prompt',
    promptMaxLength: 2000,
    mapping: [paramMapping('style'), paramMapping('voice'), slotMapping('audio_url', 'audioRef')],
    rules: {
      voiceOverride: {
        mode: 'voiceMode',
        custom: 'customVoice',
        target: 'voice',
      },
    },
    preparations,
  });
}

function registerCatalog(catalog, extraExecutions = []) {
  registerManifestBundle({
    sourceId: 'test.audio-adapter-contract',
    executions: [catalog.execution, ...extraExecutions],
    models: [catalog.model],
  });
}

test('RunningHubAudioModelApiAdapter: builds an uploaded request and applies overrides', async () => {
  const catalog = createCatalog();
  registerCatalog(catalog);
  const providerRequests = [];
  const uploadCalls = [];

  const request = await buildRunningHubCatalogRequest(
    {
      apiKey: 'direct-key',
      providerProfileId: 'runninghub',
      generationParams: {
        style: 'jazz',
        voiceMode: 'custom',
        customVoice: ' cloned ',
      },
      audioRefs: [{ refSlot: 'audioRef', url: 'local/reference.mp3' }],
      nodeId: 'audio-node-1',
      installId: 'install-1',
    },
    'read this line',
    { modelManifest: catalog.model, executionManifest: catalog.execution },
    {
      getProviderConfig(profileId) {
        providerRequests.push(profileId);
        return { modelApiKey: 'profile-key' };
      },
      async processInputAudios(urls, apiKey, options) {
        uploadCalls.push({ urls, apiKey, options });
        return urls.map((url) => 'https://uploaded.example/' + url.split('/').pop());
      },
    },
  );

  assert.deepEqual(providerRequests, ['runninghub']);
  assert.equal(uploadCalls.length, 1);
  assert.deepEqual(uploadCalls[0].urls, ['local/reference.mp3']);
  assert.equal(uploadCalls[0].apiKey, 'profile-key');
  assert.equal(uploadCalls[0].options.provider, 'runninghub');
  assert.equal(uploadCalls[0].options.strictUpload, true);
  assert.deepEqual(request.headers, {
    'Content-Type': 'application/json',
    'X-AIC-Install-Id': 'install-1',
  });
  assert.deepEqual(request.body, {
    apiUrl: 'https://www.runninghub.cn/openapi/v2/audio-contract',
    apiKey: 'profile-key',
    prompt: 'read this line',
    style: 'jazz',
    audio_url: 'https://uploaded.example/reference.mp3',
    voice: 'cloned',
  });
  assert.deepEqual(request.adapterTrace, {
    source: 'manifest',
    modelId: catalog.model.modelId,
    executionId: catalog.execution.id,
  });
  assert.equal(request.meta.isRunningHubAudioModelApi, true);
  assert.equal(request.meta.prompt, 'read this line');
  assert.equal(request.meta.installId, 'install-1');
});

test('RunningHubAudioModelApiAdapter: rejects missing configuration and credentials', async () => {
  const catalog = createCatalog();
  registerCatalog(catalog);

  await assert.rejects(
    () =>
      buildRunningHubCatalogRequest(
        { generationParams: {} },
        'text',
        {
          modelManifest: catalog.model,
          executionManifest: { ...catalog.execution, extensions: {} },
        },
      ),
    /RunningHub 音频执行配置缺失/,
  );

  await assert.rejects(
    () =>
      buildRunningHubCatalogRequest(
        { generationParams: {} },
        'text',
        { modelManifest: catalog.model, executionManifest: catalog.execution },
        {
          getProviderConfig: () => ({}),
        },
      ),
    /RunningHub API Key 未配置/,
  );
});

test('RunningHubAudioModelApiAdapter: prepares IDs and cover features before submission', async () => {
  const idExecution = createPreparationExecution(
    'test.audio.prepare-id.v1',
    'prepare-id',
    '/openapi/v2/prepare-id',
  );
  const coverExecution = createPreparationExecution(
    'test.audio.prepare-cover.v1',
    'prepare-cover',
    '/openapi/v2/prepare-cover',
  );
  const catalog = createCatalog([
    {
      executionId: idExecution.id,
      slot: 'audioRef',
      targetField: 'instrumentalId',
      inputField: 'file',
      resultType: 'id',
    },
    {
      executionId: coverExecution.id,
      slot: 'audioRef',
      targetField: 'coverRef',
      inputField: 'file',
      resultType: 'coverFeatures',
    },
  ]);
  registerCatalog(catalog, [idExecution, coverExecution]);

  const request = await buildRunningHubCatalogRequest(
    {
      apiKey: 'key',
      audioRefs: [{ refSlot: 'audioRef', url: 'local/reference.mp3' }],
      generationParams: {},
    },
    'lyrics',
    { modelManifest: catalog.model, executionManifest: catalog.execution },
    {
      async processInputAudios(urls) {
        return urls.map(() => 'https://uploaded.example/reference.mp3');
      },
    },
  );
  assert.equal(request.meta.preparations.length, 2);

  const preparationCalls = [];
  const prepared = await prepareRunningHubCatalogRequest(request, {
    async submitAndPoll(preparedRequest) {
      preparationCalls.push(preparedRequest);
      if (preparedRequest.body.apiUrl.endsWith('/prepare-id')) {
        return { results: [{ outputType: 'text', text: 'Voice_ID-1' }] };
      }
      return {
        results: [
          {
            outputType: 'text',
            text: JSON.stringify({
              coverFeatureId: 'cover_123',
              lyrics: '这是用于翻唱的完整歌词内容',
            }),
          },
        ],
      };
    },
  });

  assert.equal(preparationCalls.length, 2);
  assert.equal(preparationCalls[0].body.apiKey, 'key');
  assert.equal(preparationCalls[0].meta.preparations.length, 0);
  assert.equal(prepared.body.instrumentalId, 'Voice_ID-1');
  assert.equal(prepared.body.coverRef, 'cover_123');
  assert.equal(prepared.body.lyrics, '这是用于翻唱的完整歌词内容');
  assert.deepEqual(prepared.meta.preparations, []);
});

test('RunningHubAudioModelApiAdapter: rejects invalid preparation responses', async () => {
  const idExecution = createPreparationExecution(
    'test.audio.prepare-invalid-id.v1',
    'prepare-invalid-id',
    '/openapi/v2/prepare-invalid-id',
  );
  const catalog = createCatalog([
    {
      executionId: idExecution.id,
      slot: 'audioRef',
      targetField: 'instrumentalId',
      inputField: 'file',
      resultType: 'id',
    },
  ]);
  registerCatalog(catalog, [idExecution]);

  const request = await buildRunningHubCatalogRequest(
    {
      apiKey: 'key',
      audioRefs: [{ refSlot: 'audioRef', url: 'local/reference.mp3' }],
      generationParams: {},
    },
    'lyrics',
    { modelManifest: catalog.model, executionManifest: catalog.execution },
    {
      async processInputAudios(urls) {
        return urls.map(() => 'https://uploaded.example/reference.mp3');
      },
    },
  );

  await assert.rejects(
    () =>
      prepareRunningHubCatalogRequest(request, {
        async submitAndPoll() {
          return { results: [{ outputType: 'text', text: '!!!' }] };
        },
      }),
    /Mureka 前处理未返回有效素材 ID/,
  );
});

