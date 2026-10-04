import test from 'node:test';
import assert from 'node:assert/strict';
import { installNodeResizeGeometryPreviewer, previewNodeResizeGeometry } from './rendererResizePreview.js';
(test('previewNodeResizeGeometry rerenders affected edges with preview size', () => {
  const snapshot = {
      _edgesRev: 7,
      viewport: { zoom: 1 },
      nodes: {
        'node-1': { id: 'node-1', width: 200, height: 120 },
        'node-2': { id: 'node-2', width: 100, height: 80 },
      },
      edges: { 'edge-1': { id: 'edge-1', sourceId: 'node-1', targetId: 'node-2' } },
    },
    nodeToEdgeIds = new Map([['node-1', new Set(['edge-1'])]]),
    list = [],
    list2 = [],
    previewNodeResizeGeometry2 = previewNodeResizeGeometry(
      { nodeId: 'node-1', width: 240, height: 150 },
      {
        snapshot: snapshot,
        nodeToEdgeIds: nodeToEdgeIds,
        ensureEdgeIndex: (edges, rev) => list.push({ edges: edges, rev: rev }),
        renderEdgesByIds: (edgeIds, nodes, usedSnapshot) =>
          list2.push({ edgeIds: edgeIds, nodes: nodes, usedSnapshot: usedSnapshot }),
      },
    );
  (assert.equal(previewNodeResizeGeometry2, true),
    assert.deepEqual(list, [{ edges: snapshot.edges, rev: 7 }]),
    assert.equal(list2.length, 1),
    assert.deepEqual([...list2[0].edgeIds], ['edge-1']),
    assert.equal(list2[0].nodes['node-1'].width, 240),
    assert.equal(list2[0].nodes['node-1'].height, 150),
    assert.equal(list2[0].nodes['node-2'], snapshot.nodes['node-2']),
    assert.equal(list2[0].usedSnapshot, snapshot),
    assert.equal(snapshot.nodes['node-1'].width, 200));
}),
  test('installNodeResizeGeometryPreviewer exposes renderer bridge', () => {
    const value = {},
      item = { nodes: { 'node-1': { id: 'node-1', width: 100, height: 100 } }, edges: {} },
      installNodeResizeGeometryPreviewer2 = installNodeResizeGeometryPreviewer(
        value,
        () => item,
        () => {},
        new Map(),
        () => {},
      );
    (assert.equal(installNodeResizeGeometryPreviewer2, true),
      assert.equal(
        value.v2Renderer.previewNodeResizeGeometry({ nodeId: 'node-1', width: 120, height: 130 }),
        true,
      ));
  }));
