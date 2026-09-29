import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveRunningHubQwenImage21Dimensions,
  resolveRunningHubQwenImage21EditPayload,
} from './runningHubQwenImage21EditResolver.js';

test('runningHubQwenImage21EditResolver: resolves aligned dimensions and defaults', () => {
  assert.deepEqual(
    resolveRunningHubQwenImage21Dimensions({
      generationParams: { imageSize: '1K', aspectRatio: '16:9' },
    }),
    { width: 1024, height: 576 },
  );
  assert.deepEqual(
    resolveRunningHubQwenImage21Dimensions({
      resolvedRatioLabel: '9:16',
      generationParams: { imageSize: '1.5K' },
    }),
    { width: 864, height: 1536 },
  );
  assert.deepEqual(
    resolveRunningHubQwenImage21Dimensions({
      generationParams: { imageSize: 'adaptive', aspectRatio: 'adaptive' },
    }),
    { width: 1024, height: 1024 },
  );
  assert.deepEqual(
    resolveRunningHubQwenImage21Dimensions(
      { generationParams: { imageSize: 'custom' } },
      {
        dimensionsNode: {
          align: 8,
          minDimension: 128,
          longSideByImageSize: { custom: 333 },
          defaultAspectRatio: '1:1',
        },
      },
    ),
    { width: 336, height: 336 },
  );
});

test('runningHubQwenImage21EditResolver: builds image and prompt nodes', async () => {
  const executionManifest = {
    mapping: {
      maxInputImages: 2,
      imageLoaderNodes: [
        { nodeId: '10', fieldName: 'image' },
        { nodeId: '11', fieldName: 'image' },
      ],
      conditioningImageNodes: [
        { nodeId: '20', fieldName: 'image' },
        { nodeId: '21', fieldName: 'image' },
      ],
      promptNode: { nodeId: '30', fieldName: 'text' },
      dimensionsNode: {
        widthNode: { nodeId: '40', fieldName: 'value' },
        heightNode: { nodeId: '41', fieldName: 'value' },
      },
      promptEnhanceNode: { nodeId: '50', fieldName: 'value', field: 'enhance', defaultValue: false },
      hasImageNode: { nodeId: '60', fieldName: 'value' },
      latentSwitchNode: { nodeId: '61', fieldName: 'value' },
    },
  };
  const nodes = [];
  const helpers = {
    pushManifestNode(list, node, value) {
      const item = { nodeId: node.nodeId, fieldName: node.fieldName, value };
      list.push(item);
      nodes.push(item);
    },
    buildTaskCreateVideoWorkflowRequest(request) {
      return request;
    },
  };

  const result = await resolveRunningHubQwenImage21EditPayload({
    executionManifest,
    payload: { generationParams: { imageSize: '1K', aspectRatio: '1:1', enhance: 'yes' } },
    finalPrompt: 'edit this',
    finalUrls: ['u1', 'u2'],
    apiKey: 'k',
    helpers,
  });

  assert.deepEqual(nodes, [
    { nodeId: '10', fieldName: 'image', value: 'u1' },
    { nodeId: '11', fieldName: 'image', value: 'u2' },
    { nodeId: '30', fieldName: 'text', value: 'edit this' },
    { nodeId: '40', fieldName: 'value', value: 1024 },
    { nodeId: '41', fieldName: 'value', value: 1024 },
    { nodeId: '50', fieldName: 'value', value: true },
    { nodeId: '60', fieldName: 'value', value: true },
    { nodeId: '61', fieldName: 'value', value: false },
  ]);
  assert.equal(result.executionManifest, executionManifest);
  assert.equal(result.apiKey, 'k');
  assert.deepEqual(result.nodeInfoList, nodes);
});

test('runningHubQwenImage21EditResolver: clears unused image nodes and validates mapping', async () => {
  const executionManifest = {
    mapping: {
      maxInputImages: 2,
      imageLoaderNodes: [
        { nodeId: '10', fieldName: 'image' },
        { nodeId: '11', fieldName: 'image' },
      ],
      conditioningImageNodes: [
        { nodeId: '20', fieldName: 'image' },
        { nodeId: '21', fieldName: 'image' },
      ],
      promptNode: { nodeId: '30', fieldName: 'text' },
      dimensionsNode: {
        widthNode: { nodeId: '40', fieldName: 'value' },
        heightNode: { nodeId: '41', fieldName: 'value' },
      },
      promptEnhanceNode: { nodeId: '50', fieldName: 'value' },
      hasImageNode: { nodeId: '60', fieldName: 'value' },
      latentSwitchNode: { nodeId: '61', fieldName: 'value' },
    },
  };
  const nodes = [];
  const helpers = {
    pushManifestNode(list, node, value) {
      const item = { nodeId: node.nodeId, fieldName: node.fieldName, value };
      list.push(item);
      nodes.push(item);
    },
    buildTaskCreateVideoWorkflowRequest: () => ({ ok: true }),
  };

  await resolveRunningHubQwenImage21EditPayload({
    executionManifest,
    payload: {},
    finalPrompt: '',
    finalUrls: [],
    apiKey: 'k',
    helpers,
  });

  assert.deepEqual(
    nodes.filter((node) => node.nodeId === '20' || node.nodeId === '21'),
    [
      { nodeId: '20', fieldName: 'image', value: null },
      { nodeId: '21', fieldName: 'image', value: null },
    ],
  );
  assert.equal(nodes.find((node) => node.nodeId === '60').value, false);
  assert.equal(nodes.find((node) => node.nodeId === '61').value, true);

  await assert.rejects(
    resolveRunningHubQwenImage21EditPayload({
      executionManifest,
      payload: {},
      finalPrompt: '',
      finalUrls: ['1', '2', '3'],
      apiKey: 'k',
      helpers,
    }),
    /2/,
  );
  await assert.rejects(
    resolveRunningHubQwenImage21EditPayload({
      executionManifest: {
        mapping: { ...executionManifest.mapping, conditioningImageNodes: [] },
      },
      payload: {},
      finalPrompt: '',
      finalUrls: [],
      apiKey: 'k',
      helpers,
    }),
  );
});
