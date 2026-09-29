import test from 'node:test';
import assert from 'node:assert/strict';

import { buildRendererVirtualizationSignature } from './rendererVirtualizationSignature.js';

test('rendererVirtualizationSignature: normalizes unordered node id inputs', () => {
  const first = buildRendererVirtualizationSignature({
    snapshotRev: 1,
    nodeCount: 10,
    viewport: { x: 10, y: 20, zoom: 1 },
    selectedNodeIds: ['b', 'a'],
    pinnedNodeIds: new Set(['z', 'y']),
    connOverlay: { srcId: 'src', hoverId: null },
    pickConnectMode: { active: true, sourceNodeId: 'src' },
    dragContext: { isDragging: true, pendingDx: Number.NaN, pendingDy: 4 },
    containerW: 1200,
    containerH: 800,
  });
  const reordered = buildRendererVirtualizationSignature({
    snapshotRev: 1,
    nodeCount: 10,
    viewport: { x: 10, y: 20, zoom: 1 },
    selectedNodeIds: ['a', 'b'],
    pinnedNodeIds: ['y', 'z'],
    connOverlay: { srcId: 'src', hoverId: null },
    pickConnectMode: { active: true, sourceNodeId: 'src' },
    dragContext: { isDragging: true, pendingDx: 0, pendingDy: 4 },
    containerW: 1200,
    containerH: 800,
  });

  assert.equal(first, reordered);
  assert.notEqual(
    first,
    buildRendererVirtualizationSignature({
      snapshotRev: 1,
      nodeCount: 10,
      viewport: { x: 10, y: 20, zoom: 1 },
      selectedNodeIds: ['a', 'b'],
      pinnedNodeIds: ['y', 'z'],
      connOverlay: { srcId: 'other', hoverId: null },
      containerW: 1200,
      containerH: 800,
    }),
  );
});

test('rendererVirtualizationSignature: quantizes dense low-zoom viewport movement', () => {
  const build = (x, y, nodeCount = 80, zoom = 0.4) =>
    buildRendererVirtualizationSignature({
      nodeCount,
      viewport: { x, y, zoom },
    });

  assert.equal(build(100, 127), build(120, 127));
  assert.notEqual(build(100, 127), build(128, 127));
  assert.equal(build(100, 100, 120, 0.3), build(150, 100, 120, 0.3));
  assert.notEqual(build(100, 100, 120, 0.3), build(200, 100, 120, 0.3));
});
