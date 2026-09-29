import test from 'node:test';
import assert from 'node:assert/strict';

import { describeGraphMutation, planNodeMovement } from './graphMutationImpact.js';

test('graphMutationImpact: plans parent and child movement from supported position mutations', () => {
  const graph = {
    nodes: { a: {}, b: {}, c: {} },
    _parentToChildren: { a: ['b'], b: ['c'] },
  };

  assert.deepEqual(planNodeMovement(graph, 'updateNodePosition', ['a', 0, 5]), {
    a: { dx: 0, dy: 5 },
    b: { dx: 0, dy: 5 },
    c: { dx: 0, dy: 5 },
  });
  assert.deepEqual(planNodeMovement(graph, 'moveNodes', [['a'], 3, 4]), {
    a: { dx: 3, dy: 4 },
    b: { dx: 3, dy: 4 },
    c: { dx: 3, dy: 4 },
  });
  assert.deepEqual(
    planNodeMovement(graph, 'moveNodesByOffsets', [
      {
        a: { dx: 1, dy: 0 },
        b: { dx: 9, dy: 8 },
      },
    ]),
    {
      a: { dx: 1, dy: 0 },
      b: { dx: 9, dy: 8 },
      c: { dx: 9, dy: 8 },
    },
  );
  assert.deepEqual(planNodeMovement(graph, 'updateNodePosition', ['a', 0, 0]), {});
});

test('graphMutationImpact: describes node, group, and edge mutations', () => {
  const graph = {
    nodes: {
      n1: { parentId: null },
      n2: { parentId: 'g' },
      n3: { parentId: 'g' },
    },
    edges: {
      e1: { id: 'e1', sourceId: 'n1', targetId: 'n2' },
      e2: { id: 'e2', sourceId: 'n2', targetId: 'n3' },
    },
  };

  assert.deepEqual(describeGraphMutation('deleteNodes', [['n2']], graph), {
    name: 'deleteNodes',
    args: [['n2']],
    nodeIds: ['n2', 'n1', 'n3'],
    removedNodeIds: ['n2'],
  });
  assert.deepEqual(describeGraphMutation('groupNodes', [['n1', 'n2'], 'g'], graph).nodeIds, ['n1']);
  assert.deepEqual(
    describeGraphMutation('addEdge', [{ id: 'e3', sourceId: 'n3', targetId: 'n4' }], graph).nodeIds,
    ['n3', 'n4'],
  );
  assert.deepEqual(describeGraphMutation('removeEdge', ['e1'], graph).nodeIds, ['n1', 'n2']);
  assert.deepEqual(
    describeGraphMutation('updateEdgesBatch', [['e1'], [{ id: 'e2', sourceId: 'n2', targetId: 'n3' }]], graph)
      .nodeIds,
    ['n1', 'n2', 'n3'],
  );
});

test('graphMutationImpact: describes data mutations and rejects unknown mutations', () => {
  const graph = { nodes: {}, edges: {} };

  assert.deepEqual(
    describeGraphMutation('updateNodesData', [{ n1: { value: 1 }, n3: { value: 2 } }], graph).nodeIds,
    ['n1', 'n3'],
  );
  assert.deepEqual(describeGraphMutation('swapStoryboardCells', ['n1', 'unused', 'n3'], graph).nodeIds, [
    'n1',
    'n3',
  ]);
  assert.deepEqual(describeGraphMutation('addNode', [{ id: 'n9' }], graph).nodeIds, ['n9']);
  assert.deepEqual(describeGraphMutation('updateNodeData', ['n1', {}], graph).nodeIds, ['n1']);
  assert.deepEqual(describeGraphMutation('renameNode', ['n2', 'name'], graph).nodeIds, ['n2']);
  assert.throws(() => describeGraphMutation('unknownMutation', [], graph), {
    message: 'Unknown graph mutation: unknownMutation',
  });
});
