import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveRunningHubHailuoH3OmniDimensions,
  resolveRunningHubHailuoH3OmniPayload,
} from './runningHubHailuoH3OmniResolver.js';

test('runningHubHailuoH3OmniResolver: rounds dimensions for the selected quality and ratio', () => {
  assert.deepEqual(
    resolveRunningHubHailuoH3OmniDimensions(
      {
        aspectRatio: '16:9',
        rhHailuoH3Quality: 'high',
      },
      {
        defaultQuality: 'economy',
        qualityLongEdges: { economy: 640, high: 960 },
        dimensionMultiple: 32,
      },
    ),
    { width: 960, height: 544 },
  );
});

test('runningHubHailuoH3OmniResolver: builds frame inputs and normalized workflow nodes', async () => {
  let taskRequest = null;
  const uploadCalls = [];
  const result = await resolveRunningHubHailuoH3OmniPayload({
    executionManifest: {
      mapping: {
        promptNode: { nodeId: 'prompt', fieldName: 'text' },
        modeNode: {
          nodeId: 'mode',
          fieldName: 'mode',
          frameValue: '1',
          textValue: '0',
        },
        firstLastFrameNode: {
          nodeId: 'frames',
          firstFieldName: 'first',
          lastFieldName: 'last',
        },
        imageLoaderNodes: [
          { nodeId: 'first-image', fieldName: 'image' },
          { nodeId: 'last-image', fieldName: 'image' },
        ],
        accelerationNode: { nodeId: 'acceleration', field: 'acceleration' },
        secondsNode: { nodeId: 'seconds', defaultValue: 5, min: 3, max: 10 },
        widthNode: { nodeId: 'width' },
        heightNode: { nodeId: 'height' },
        qualityLongEdges: { economy: 640, high: 960 },
      },
    },
    payload: {
      prompt: 'Move the subject',
      rh_hailuo_h3_mode: 'frames',
      inputUrlsBySlot: {
        firstFrame: 'local-first.png',
        lastFrame: 'local-last.png',
      },
      aspectRatio: '16:9',
      rhHailuoH3Quality: 'high',
      duration: 99,
      generationParams: { acceleration: 'fast' },
    },
    finalPrompt: 'Move the subject',
    apiKey: 'key',
    ctx: {},
    helpers: {
      async uploadRunningHubMediaInputs(kind, urls, payload, apiKey, ctx, options) {
        uploadCalls.push({ kind, urls, payload, apiKey, ctx, options });
        return urls.map((_, index) => `uploaded-${index + 1}`);
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
        return { success: true, args };
      },
    },
  });

  const nodes = Object.fromEntries(result.args.nodeInfoList.map((node) => [node.nodeId, node]));
  assert.equal(uploadCalls.length, 1);
  assert.equal(uploadCalls[0].kind, 'image');
  assert.deepEqual(uploadCalls[0].urls, ['local-first.png', 'local-last.png']);
  assert.equal(nodes.prompt.value, 'Move the subject');
  assert.equal(nodes.mode.value, '1');
  assert.equal(nodes['first-image'].value, 'uploaded-1');
  assert.equal(nodes['last-image'].value, 'uploaded-2');
  assert.equal(nodes.acceleration.value, 'fast');
  assert.equal(nodes.seconds.value, 10);
  assert.equal(nodes.width.value, 960);
  assert.equal(nodes.height.value, 544);
  assert.equal(taskRequest.apiKey, 'key');
});

test('runningHubHailuoH3OmniResolver: rejects incomplete frame mapping', async () => {
  await assert.rejects(
    () =>
      resolveRunningHubHailuoH3OmniPayload({
        executionManifest: {
          mapping: {
            imageLoaderNodes: [{}],
            modeNode: { frameValue: '1' },
          },
        },
        payload: {
          rh_hailuo_h3_mode: 'frames',
          inputUrlsBySlot: { firstFrame: 'local-first.png' },
        },
        finalPrompt: 'Move',
        apiKey: 'key',
        ctx: {},
        helpers: {
          async uploadRunningHubMediaInputs() {
            return [];
          },
          pushManifestNode() {},
        },
      }),
    /映射不完整/,
  );
});
