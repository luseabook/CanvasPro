import test from 'node:test';
import assert from 'node:assert/strict';

import { createRendererSelectionFastPath } from './rendererSelectionFastPath.js';

function createHarness() {
  const calls = [];
  const fastPath = createRendererSelectionFastPath({
    buildSelectionRelatedSets(selectedNodeIds) {
      const relatedNodeIds = new Set([...selectedNodeIds, 'shared']);
      const relatedEdgeIds = new Set([...selectedNodeIds].map((nodeId) => `${nodeId}-edge`));
      return { relatedNodeIds, relatedEdgeIds };
    },
    cancelPendingRender: () => calls.push('cancel'),
    consumeViewport: (viewport) => calls.push(['viewport', viewport]),
    ensureEdgeIndex: (edges, revision) => calls.push(['edges', edges, revision]),
    flushSelectionUpdate: (nodeIds, options) => {
      calls.push(['flush', nodeIds, options]);
      return true;
    },
    hasPendingRender: () => harness.pending,
    renderAffectedEdges: (edgeIds) => calls.push(['renderEdges', [...edgeIds].sort()]),
    renderSelectionOverlays: () => calls.push('overlays'),
    setCurrentSnapshot: (snapshot) => calls.push(['snapshot', snapshot.selectedNodeIds.join(',')]),
  });
  const harness = { calls, fastPath, pending: false };
  return harness;
}

function snapshot(selectedNodeIds, overrides = {}) {
  return {
    _nodesRev: 1,
    nodes: { a: {}, b: {}, c: {} },
    edges: {},
    _edgesRev: 1,
    viewport: { x: 1, y: 2, zoom: 1 },
    selectedNodeIds,
    ui: { selectionRelatedHighlightEnabled: true },
    ...overrides,
  };
}

test('rendererSelectionFastPath: reuses identical selections and flushes changed overlays', () => {
  const harness = createHarness();
  const base = snapshot(['a']);
  harness.fastPath.rememberRenderedSnapshot(base);

  assert.equal(harness.fastPath.flushSelectionOnlySnapshot(base), true);
  assert.equal(harness.calls.filter((call) => call === 'overlays').length, 0);

  const changed = snapshot(['b']);
  assert.equal(harness.fastPath.flushSelectionOnlySnapshot(changed), true);
  const flush = harness.calls.find((call) => Array.isArray(call) && call[0] === 'flush');
  assert.deepEqual(flush[1].sort(), ['a', 'b', 'shared']);
  assert.deepEqual(harness.calls.find((call) => Array.isArray(call) && call[0] === 'renderEdges')[1], [
    'a-edge',
    'b-edge',
  ]);
  assert.equal(harness.calls.at(-1), 'overlays');
});

test('rendererSelectionFastPath: respects pending renders, cancellation, and reset', () => {
  const harness = createHarness();
  const base = snapshot(['a']);
  harness.fastPath.rememberRenderedSnapshot(base);

  harness.pending = true;
  assert.equal(harness.fastPath.flushSelectionOnlySnapshot(snapshot(['b'])), false);
  assert.equal(
    harness.fastPath.flushSelectionOnlySnapshot(snapshot(['b']), {
      allowPendingRaf: true,
      cancelPendingRaf: true,
    }),
    true,
  );
  assert.ok(harness.calls.includes('cancel'));

  harness.fastPath.reset();
  assert.equal(harness.fastPath.flushSelectionOnlySnapshot(snapshot(['c'])), false);

  const withoutRevisions = snapshot(['a']);
  delete withoutRevisions._nodesRev;
  harness.fastPath.rememberRenderedSnapshot(withoutRevisions);
  const changedNodes = snapshot(['a']);
  delete changedNodes._nodesRev;
  changedNodes.nodes = { z: {} };
  assert.equal(harness.fastPath.flushSelectionOnlySnapshot(changedNodes), false);
});
