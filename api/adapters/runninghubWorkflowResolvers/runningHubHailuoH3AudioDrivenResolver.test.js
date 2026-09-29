import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveRunningHubHailuoH3AudioDrivenPayload } from './runningHubHailuoH3AudioDrivenResolver.js';

function createMapping() {
  return {
    referenceNode: {
      nodeId: 'reference',
      imageFieldPrefix: 'image',
      videoFieldPrefix: 'video',
      audioFieldPrefix: 'audio',
    },
    referenceLimits: { image: 4, video: 1, audio: 1 },
    imageLoaderNodes: Array.from({ length: 4 }, (_, index) => ({
      nodeId: `image-loader-${index + 1}`,
      fieldName: 'image',
    })),
    videoLoaderNodes: [{ nodeId: 'video-loader', fieldName: 'video' }],
    audioLoaderNodes: [{ nodeId: 'audio-loader', fieldName: 'audio' }],
    promptNode: { nodeId: 'prompt', fieldName: 'text' },
    widthNode: { nodeId: 'width', fieldName: 'width' },
    heightNode: { nodeId: 'height', fieldName: 'height' },
    accelerationNode: {
      nodeId: 'acceleration',
      fieldName: 'acceleration',
      field: 'acceleration',
      defaultValue: 'standard',
    },
    qualityLongEdges: { economy: 640, high: 960 },
    defaultQuality: 'economy',
  };
}

function createHelpers(uploadCalls) {
  let taskRequest = null;
  return {
    helpers: {
      async uploadRunningHubMediaInputs(kind, urls) {
        uploadCalls.push({ kind, urls: [...urls] });
        return urls.map((url) => `uploaded:${url}`);
      },
      pushManifestNode(nodeInfoList, node, value) {
        if (node?.nodeId) {
          nodeInfoList.push({
            nodeId: node.nodeId,
            fieldName: node.fieldName,
            value,
          });
        }
      },
      getMappedValue(value, node) {
        return value ?? node?.defaultValue ?? '';
      },
      buildTaskCreateVideoWorkflowRequest(args) {
        taskRequest = args;
        return { task: args };
      },
    },
    getTaskRequest() {
      return taskRequest;
    },
  };
}

test('runningHubHailuoH3AudioDrivenResolver: uploads audio and clears unused media slots', async () => {
  const uploadCalls = [];
  const { helpers, getTaskRequest } = createHelpers(uploadCalls);
  const result = await resolveRunningHubHailuoH3AudioDrivenPayload({
    executionManifest: {
      mapping: {
        ...createMapping(),
        qualityLongEdges: { economy: 640, high: 960 },
        defaultQuality: 'economy',
      },
    },
    payload: {
      prompt: '@图1 dance',
      inputAudios: ['audio-1'],
      aspectRatio: '16:9',
      rhHailuoH3Quality: 'high',
      generationParams: { acceleration: 'high' },
    },
    finalPrompt: '@图1 dance',
    apiKey: 'key',
    ctx: {},
    helpers,
  });

  assert.deepEqual(uploadCalls, [
    { kind: 'image', urls: [] },
    { kind: 'video', urls: [] },
    { kind: 'audio', urls: ['audio-1'] },
  ]);
  const byNode = Object.fromEntries(
    result.task.nodeInfoList.map((node) => [`${node.nodeId}:${node.fieldName}`, node.value]),
  );
  assert.equal(byNode['audio-loader:audio'], 'uploaded:audio-1');
  assert.equal(byNode['reference:image0'], null);
  assert.equal(byNode['reference:image1'], null);
  assert.equal(byNode['reference:image2'], null);
  assert.equal(byNode['reference:image3'], null);
  assert.equal(byNode['reference:video0'], null);
  assert.equal(byNode['prompt:text'], '@图1 dance');
  assert.equal(byNode['width:width'], 960);
  assert.equal(byNode['height:height'], 544);
  assert.equal(byNode['acceleration:acceleration'], 'high');
  assert.equal(getTaskRequest().apiKey, 'key');
});

test('runningHubHailuoH3AudioDrivenResolver: requires one audio reference', async () => {
  const uploadCalls = [];
  const { helpers } = createHelpers(uploadCalls);
  await assert.rejects(
    () =>
      resolveRunningHubHailuoH3AudioDrivenPayload({
        executionManifest: { mapping: createMapping() },
        payload: { prompt: 'dance' },
        finalPrompt: 'dance',
        apiKey: 'key',
        ctx: {},
        helpers,
      }),
    /必须接入音频参考/,
  );
  assert.deepEqual(uploadCalls, []);
});
