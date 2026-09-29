import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';

import appStore from '../../core/stores/appStore.js';
import { RH_VIDEO_BERNINI_V1_MODEL_ID } from '../../manifests/index.js';
import { syncVideoNodeFixedInputSummary } from './fixedInputSummarySync.js';

const originalGetIncomingEdges = appStore.getIncomingEdges;
const originalGetStateRaw = appStore.getStateRaw;
const originalUpdateNodeData = appStore.updateNodeData;

afterEach(() => {
  appStore.getIncomingEdges = originalGetIncomingEdges;
  appStore.getStateRaw = originalGetStateRaw;
  appStore.updateNodeData = originalUpdateNodeData;
});

function installGraph({ edges, nodes }) {
  appStore.getIncomingEdges = () => edges;
  appStore.getStateRaw = () => ({ nodes });
}

test('fixedInputSummarySync: builds and stores the Bernini input-mode patch', () => {
  const calls = [];
  installGraph({
    edges: [
      { id: 'edge-video', sourceId: 'video-1', targetId: 'target-1', refSlot: 'sourceVideo' },
      { id: 'edge-image', sourceId: 'image-1', targetId: 'target-1', refSlot: 'refImage' },
    ],
    nodes: {
      'video-1': { id: 'video-1', type: 'source-video', videoUrl: 'https://cdn.example/video.mp4' },
      'image-1': { id: 'image-1', type: 'source-image', imageUrl: 'https://cdn.example/image.png' },
    },
  });
  appStore.updateNodeData = (nodeId, patch) => calls.push([nodeId, patch]);

  const result = syncVideoNodeFixedInputSummary({
    nodeId: 'target-1',
    nodeData: { model: RH_VIDEO_BERNINI_V1_MODEL_ID },
    syncStore: true,
  });

  assert.equal(result.changed, true);
  assert.equal(result.fixedInputConfig.slotKindById.sourceVideo, 'video');
  assert.equal(result.inEdges.length, 2);
  assert.deepEqual(result.patch, {
    rhBerniniInputMode: 'videoImage',
    rhBerniniFunction: 'vi2v',
    generationParams: { rhBerniniFunction: 'vi2v' },
    generationParamsByModel: {
      [RH_VIDEO_BERNINI_V1_MODEL_ID]: { rhBerniniFunction: 'vi2v' },
    },
  });
  assert.deepEqual(calls, [['target-1', result.patch]]);
});

test('fixedInputSummarySync: reports no fixed-slot config without a manifest declaration', () => {
  installGraph({
    edges: [],
    nodes: {},
  });
  const result = syncVideoNodeFixedInputSummary({
    nodeId: 'missing-target',
    nodeData: { model: 'missing/model' },
  });

  assert.deepEqual(result, {
    nodeData: { model: 'missing/model' },
    fixedInputConfig: null,
    inEdges: [],
    changed: false,
  });
});

test('fixedInputSummarySync: can compute a patch without mutating the store', () => {
  let updateCalls = 0;
  installGraph({
    edges: [{ id: 'edge-video', sourceId: 'video-1', targetId: 'target-1', refSlot: 'sourceVideo' }],
    nodes: {
      'video-1': { id: 'video-1', type: 'source-video', videoUrl: 'https://cdn.example/video.mp4' },
    },
  });
  appStore.updateNodeData = () => {
    updateCalls += 1;
  };

  const result = syncVideoNodeFixedInputSummary({
    nodeId: 'target-1',
    nodeData: { model: RH_VIDEO_BERNINI_V1_MODEL_ID },
    syncStore: false,
  });

  assert.equal(result.changed, true);
  assert.equal(result.patch.rhBerniniInputMode, 'video');
  assert.equal(updateCalls, 0);
});
