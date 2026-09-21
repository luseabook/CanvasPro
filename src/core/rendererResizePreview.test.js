import test from 'node:test';
import assert from 'node:assert/strict';
import { installNodeResizeGeometryPreviewer, previewNodeResizeGeometry } from './rendererResizePreview.js';
(test('previewNodeResizeGeometry rerenders affected edges with preview size', () => {
  const _0x419fa4 = {
      _edgesRev: 7,
      viewport: { zoom: 1 },
      nodes: {
        'node-1': { id: 'node-1', width: 200, height: 120 },
        'node-2': { id: 'node-2', width: 100, height: 80 },
      },
      edges: { 'edge-1': { id: 'edge-1', sourceId: 'node-1', targetId: 'node-2' } },
    },
    _0x5f52bc = new Map([['node-1', new Set(['edge-1'])]]),
    _0x54a86d = [],
    _0x6aebf5 = [],
    _0x39630d = previewNodeResizeGeometry(
      { nodeId: 'node-1', width: 240, height: 150 },
      {
        snapshot: _0x419fa4,
        nodeToEdgeIds: _0x5f52bc,
        ensureEdgeIndex: (_0x2a49d2, _0xc747f6) => _0x54a86d.push({ edges: _0x2a49d2, rev: _0xc747f6 }),
        renderEdgesByIds: (_0x5f4fbe, _0x599c2f, _0x3e1e48) =>
          _0x6aebf5.push({ edgeIds: _0x5f4fbe, nodes: _0x599c2f, usedSnapshot: _0x3e1e48 }),
      },
    );
  (assert.equal(_0x39630d, true),
    assert.deepEqual(_0x54a86d, [{ edges: _0x419fa4.edges, rev: 7 }]),
    assert.equal(_0x6aebf5.length, 1),
    assert.deepEqual([..._0x6aebf5[0].edgeIds], ['edge-1']),
    assert.equal(_0x6aebf5[0].nodes['node-1'].width, 240),
    assert.equal(_0x6aebf5[0].nodes['node-1'].height, 150),
    assert.equal(_0x6aebf5[0].nodes['node-2'], _0x419fa4.nodes['node-2']),
    assert.equal(_0x6aebf5[0].usedSnapshot, _0x419fa4),
    assert.equal(_0x419fa4.nodes['node-1'].width, 200));
}),
  test('installNodeResizeGeometryPreviewer exposes renderer bridge', () => {
    const _0x1967b2 = {},
      _0xbfbd6d = { nodes: { 'node-1': { id: 'node-1', width: 100, height: 100 } }, edges: {} },
      _0x40badb = installNodeResizeGeometryPreviewer(
        _0x1967b2,
        () => _0xbfbd6d,
        () => {},
        new Map(),
        () => {},
      );
    (assert.equal(_0x40badb, true),
      assert.equal(
        _0x1967b2.v2Renderer.previewNodeResizeGeometry({ nodeId: 'node-1', width: 120, height: 130 }),
        true,
      ));
  }));
