import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createEdgeCutCandidateIndex,
  createEdgeCutQueryBounds,
  queryEdgeCutCandidateIds,
  resolveEdgeCutNodeGeometry,
  resolveEdgeCutSegment,
} from './edgeCuttingCandidates.js';

function createNodes() {
  return {
    a: { x: 0, y: 0, width: 100, height: 50 },
    b: { x: 300, y: 100 },
    c: { x: 1000, y: 0, width: 100, height: 50 },
    d: { x: 1300, y: 100 },
  };
}

test('edgeCuttingCandidates resolves node geometry and segments', () => {
  assert.deepEqual(resolveEdgeCutNodeGeometry(null), null);
  assert.deepEqual(resolveEdgeCutNodeGeometry({ x: 10, y: 20 }), {
    x: 10,
    y: 20,
    width: 260,
    height: 100,
  });
  assert.deepEqual(
    resolveEdgeCutSegment({ sourceId: 'a', targetId: 'b' }, createNodes()),
    {
      startX: 100,
      startY: 25,
      endX: 300,
      endY: 150,
    },
  );
});

test('edgeCuttingCandidates builds and queries a visibility index', () => {
  const edges = {
    'edge-1': { id: 'edge-1', sourceId: 'a', targetId: 'b' },
    'edge-2': { id: 'edge-2', sourceId: 'c', targetId: 'd' },
  };
  const index = createEdgeCutCandidateIndex(edges, createNodes(), { threshold: 2 });

  assert.deepEqual(index.edgeIds, ['edge-1', 'edge-2']);
  assert.notEqual(index.index, null);
  assert.deepEqual(queryEdgeCutCandidateIds(index, 95, 20, 105, 30), ['edge-1']);
  assert.deepEqual(queryEdgeCutCandidateIds(index, 1095, 20, 1105, 30), ['edge-2']);
});

test('edgeCuttingCandidates falls back to all ids below the index threshold', () => {
  const index = createEdgeCutCandidateIndex(
    { 'edge-1': { sourceId: 'a', targetId: 'b' } },
    createNodes(),
    { threshold: 2 },
  );

  assert.equal(index.index, null);
  assert.deepEqual(index.edgeIds, ['edge-1']);
  assert.deepEqual(queryEdgeCutCandidateIds(index, 0, 0, 10, 10), ['edge-1']);
  assert.equal(createEdgeCutQueryBounds(0, 0, 'invalid', 10), null);
});
