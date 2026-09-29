import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appendRunningHubReferenceMediaInputs,
  normalizeRunningHubReferenceMediaUrls,
} from './runningHubReferenceMediaResolverShared.js';

test('runningHubReferenceMediaResolverShared: trims and deduplicates URLs', () => {
  assert.deepEqual(normalizeRunningHubReferenceMediaUrls([' a ', 'a', '', null, ' b ']), ['a', 'b']);
  assert.deepEqual(normalizeRunningHubReferenceMediaUrls('not-array'), []);
});

test('runningHubReferenceMediaResolverShared: appends uploaded nodes and clears unused slots', async () => {
  const nodes = [];
  const calls = [];
  const helpers = {
    async uploadRunningHubMediaInputs(kind, urls, payload, apiKey, ctx, options) {
      calls.push({ kind, urls, payload, apiKey, ctx, options });
      return urls.map((url) => `uploaded:${url}`);
    },
    pushManifestNode(list, node, value) {
      list.push({ nodeId: node.nodeId, fieldName: node.fieldName, value });
    },
  };

  const result = await appendRunningHubReferenceMediaInputs({
    payload: { audioRefs: [' a ', 'b', 'a'] },
    specs: [
      {
        kind: 'audio',
        loaderNodes: [
          { nodeId: '10', fieldName: 'audio' },
          { nodeId: '11', fieldName: 'audio' },
        ],
        slotCount: 3,
        maxCount: 2,
        minCount: 1,
        payloadField: 'audioRefs',
        referenceNodeId: '20',
        referenceFieldPrefixes: ['audio_ref_'],
      },
    ],
    requiredTotal: 1,
    apiKey: 'k',
    ctx: { context: true },
    helpers,
    nodeInfoList: nodes,
  });

  assert.deepEqual(calls, [
    {
      kind: 'audio',
      urls: ['a', 'b'],
      payload: { audioRefs: [' a ', 'b', 'a'] },
      apiKey: 'k',
      ctx: { context: true },
      options: { uploadFailedMessage: undefined },
    },
  ]);
  assert.deepEqual(nodes, [
    { nodeId: '10', fieldName: 'audio', value: 'uploaded:a' },
    { nodeId: '11', fieldName: 'audio', value: 'uploaded:b' },
    { nodeId: '20', fieldName: 'audio_ref_2', value: null },
  ]);
  assert.deepEqual(result, {
    audio: { inputCount: 2, uploadedCount: 2 },
  });
});

test('runningHubReferenceMediaResolverShared: rejects incomplete or failed uploads', async () => {
  const baseSpec = {
    kind: 'image',
    loaderNodes: [{ nodeId: '10', fieldName: 'image' }],
    slotCount: 1,
    maxCount: 1,
    minCount: 0,
    payloadField: 'imageRefs',
    referenceNodeId: '20',
    referenceFieldPrefixes: ['image_ref_'],
  };

  await assert.rejects(
    appendRunningHubReferenceMediaInputs({
      payload: { imageRefs: ['a', 'b'] },
      specs: [baseSpec],
      helpers: { uploadRunningHubMediaInputs: async () => [], pushManifestNode() {} },
      nodeInfoList: [],
    }),
    /exceed/,
  );

  await assert.rejects(
    appendRunningHubReferenceMediaInputs({
      payload: { imageRefs: ['a'] },
      specs: [baseSpec],
      helpers: { uploadRunningHubMediaInputs: async () => [], pushManifestNode() {} },
      nodeInfoList: [],
    }),
    /RunningHUB/,
  );

  await assert.rejects(
    appendRunningHubReferenceMediaInputs({
      payload: {},
      specs: [{ ...baseSpec, loaderNodes: [] }],
      requiredTotal: 1,
      helpers: { uploadRunningHubMediaInputs: async () => [], pushManifestNode() {} },
      nodeInfoList: [],
    }),
  );
});
