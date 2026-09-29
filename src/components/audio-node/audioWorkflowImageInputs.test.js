import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAudioWorkflowImageSlotItems,
  collectAudioWorkflowImageInputs,
} from './audioWorkflowImageInputs.js';

const VIDEO_EDIT_MODEL_ID = 'runninghub/1971148165531475969';

test('audioWorkflowImageInputs: keeps image edges and resolves their fallback image URL', () => {
  const imageNode = { type: 'web-image', capturePreviewUrl: 'https://cdn.example/a.png' };
  const videoNode = { type: 'video', url: 'https://cdn.example/a.mp4' };
  const edges = [
    { id: 'edge-image', sourceId: 'image-node' },
    { id: 'edge-video', sourceId: 'video-node' },
  ];

  assert.deepEqual(
    collectAudioWorkflowImageInputs(VIDEO_EDIT_MODEL_ID, edges, {
      'image-node': imageNode,
      'video-node': videoNode,
    }),
    [
      {
        edgeId: 'edge-image',
        sourceId: 'image-node',
        sourceType: 'web-image',
        refSlot: 'refImage',
        url: 'https://cdn.example/a.png',
      },
    ],
  );
});

test('audioWorkflowImageInputs: attaches edge and source-node references to slot items', () => {
  const sourceNode = { type: 'web-image', capturePreviewUrl: 'https://cdn.example/b.png' };
  const edge = { id: 'edge-b', sourceId: 'node-b' };

  const items = buildAudioWorkflowImageSlotItems(VIDEO_EDIT_MODEL_ID, [edge], { 'node-b': sourceNode });

  assert.equal(items.length, 1);
  assert.equal(items[0].edge, edge);
  assert.equal(items[0].sourceNode, sourceNode);
  assert.equal(items[0].kind, 'image');
  assert.equal(items[0].refSlot, 'refImage');
});

test('audioWorkflowImageInputs: returns no inputs when the model has no image fixed slots', () => {
  assert.deepEqual(collectAudioWorkflowImageInputs('missing/model', [], {}), []);
});
